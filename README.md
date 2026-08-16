# Casamento Amanda & Lucas — Site

Site do casamento com **lista de presentes via PIX**, **confirmação de presença** e **painel administrativo para os noivos**.

## Arquitetura

A aplicação é um monólito em duas camadas servidas pelo mesmo domínio/origem:

| Camada | Onde vive | O que é |
|---|---|---|
| **SPA (frontend)** | Raiz do repositório (`index.html`, `js/`, `css/`) | SPA em JavaScript puro (ES Modules, sem build). Roteamento por `history.pushState` em `js/app.js`. |
| **API (backend)** | `laravel_core/` | Laravel 11 + Sanctum (sessão via cookie). As rotas `/api/*` e `/sanctum/*` são respondidas por `index.php` na raiz. |

O `.htaccess` da raiz já faz o roteamento:

1. `/api/*` e `/sanctum/*` → `index.php` (Laravel);
2. qualquer outra URL (ex.: `/login`, `/lista-de-presentes`) → `index.html` (SPA).

Por isso o **document root** do servidor web é a **raiz do repositório** (não `laravel_core/public`).

### Fluxo de dados

```
Navegador ──> Apache (container web) ──┬── /api/* ──> Laravel ──> MySQL (container db)
                                      └── /*.html ──> index.html (SPA estática)
```

O QR Code PIX é gerado por um serviço externo (`api.qrserver.com`), então a máquina precisa de acesso à internet para o fluxo de pagamento.

## Pré-requisitos

- Docker Engine **24+**
- Docker Compose **v2.20+** (requerido para `depends_on` com `service_completed_successfully`)
- Portas livres: **80** (site), **3307** (MySQL) — alteráveis no `docker-compose.yml`

## Subindo o sistema localmente

Tudo é orquestrado por um único arquivo `docker-compose.yml` na raiz do projeto:

```bash
# Sobe o banco, executa as migrations e inicia o servidor web
docker compose up -d --build
```

As **migrations são executadas automaticamente** pelo serviço `migrate` durante a subida (o `web` só inicia depois que elas terminam). Na primeira vez, se quiser também popular com dados de demonstração:

```bash
docker compose exec web php artisan db:seed --force
```

Acesse o site em: **http://localhost**

> **APP_KEY**: se o `laravel_core/.env` não existir (clonado do zero), gere a chave antes de usar o login:
> ```bash
> docker compose exec web php artisan key:generate
> ```

### Contas de demonstração (após o `db:seed`)

| Perfil | Usuário | Senha |
|---|---|---|
| Noivos (admin) | `usuario` | `senha` |
| Convidado | `convidado` | `casamento2026` |

> O `db:seed` usa `firstOrCreate`, então pode ser executado várias vezes sem duplicar dados.

### Ferramenta de banco (opcional)

```bash
docker compose --profile tools up -d   # phpMyAdmin em http://localhost:8081 (casamento/casamento)
```

## Como funciona a orquestração

O `docker-compose.yml` define os serviços:

### 1. `web` — Apache + PHP 8.2
- Imagem construída a partir de `docker/web/Dockerfile` (`php:8.2-apache` + extensões `pdo_mysql`, `mbstring`, `zip` + módulos `rewrite`/`headers` + Composer).
- Faz bind mount do repositório em `/var/www/html` — **toda edição no código aparece na hora** (sem rebuild).
- Variáveis de ambiente definidas no Compose (host do banco, domínios do Sanctum, etc.) **têm precedência sobre o `laravel_core/.env`**, pois o phpdotenv não sobrescreve variáveis já existentes no ambiente.
- `working_dir` aponta para `laravel_core`, então comandos `php artisan ...` funcionam direto via `docker compose exec`.

### 2. `migrate` — execução automática das migrations
- Container de **uso único** (mesma imagem do `web`) que roda `php artisan migrate --force`.
- Sobe **após** o banco ficar saudável (`service_healthy`) e **antes** do `web` (`service_completed_successfully`).
- É idempotente: pode rodar a cada `docker compose up` sem repetir tabelas já criadas.

### 3. `db` — MySQL 8
- Banco `casamento`, usuário `casamento`, senha `casamento`.
- Dados persistidos em volume nomeado `dbdata` (não somem com `docker compose down`).
- `healthcheck` garante que as migrations só rodem com o banco pronto.

### 4. `phpmyadmin` — opcional (perfil `tools`)
- Conveniência para inspecionar as tabelas durante o desenvolvimento.

## Configuração importante

As variáveis abaixo **precisam** estar coerentes entre o Compose e o `.env`:

| Variável | Valor local | Por quê |
|---|---|---|
| `APP_URL` | `http://localhost` | Origem usada em links gerados pelo Laravel |
| `SANCTUM_STATEFUL_DOMAINS` | `localhost,127.0.0.1,localhost:80,127.0.0.1:80` | Permite o cookie de sessão do Sanctum na SPA |
| `SESSION_DOMAIN` | `localhost` | Escopo do cookie de sessão |
| `DB_HOST` | `db` | Nome do serviço no Compose (não `127.0.0.1`) |

Se trocar a porta do site no Compose, atualize `APP_URL`, `SANCTUM_STATEFUL_DOMAINS` e o `SESSION_DOMAIN` de acordo.

## Comandos úteis

```bash
docker compose ps                    # status dos serviços
docker compose logs -f web           # logs do Apache/PHP (erros do Laravel aparecem aqui)
docker compose logs migrate          # resultado das migrations na última subida
docker compose logs -f db            # logs do MySQL
docker compose restart web           # reinicia só o servidor web
docker compose exec web bash         # shell dentro do container web
docker compose exec web php artisan route:list        # lista as rotas da API
docker compose exec web php artisan migrate           # roda as migrations manualmente
docker compose exec web php artisan migrate:fresh --seed  # zera o banco e repopula
docker compose up -d --force-recreate migrate         # reexecuta as migrations
docker compose down                  # para os containers (dados do banco preservados)
docker compose down -v               # para e apaga o volume do banco (destrutivo!)
```

## Resolução de problemas

**Não consegue acessar `http://localhost`?**
- Confira se a porta 80 não está em uso: `docker compose ps` e `sudo lsof -i :80`.
- Se a porta 80 estiver ocupada, troque `"80:80"` para outra (ex.: `"8080:80"`) no `docker-compose.yml` e atualize `APP_URL`/`SANCTUM_STATEFUL_DOMAINS` de acordo.

**O serviço `web` não sobe?**
- Ele só inicia após o `migrate` concluir com sucesso. Verifique `docker compose logs migrate` — se houver erro, corrija e rode `docker compose up -d --force-recreate migrate web`.

**Erro de permissão de escrita no `laravel_core/storage`?**
- O Apache roda como `www-data` no container. Garanta permissão de escrita:
  ```bash
  chmod -R 777 laravel_core/storage
  ```

**Erro de conexão com o banco?**
- O `DB_HOST` precisa ser `db` (nome do serviço), nunca `127.0.0.1` — dentro do Compose cada serviço acessa os outros pelo nome.

**`vendor/` ausente (clonou sem os diretórios grandes)?**
- Instale as dependências dentro do container:
  ```bash
  docker compose exec web composer install
  ```

**Login não persiste / "Não autenticado" mesmo logado?**
- Confira se `SANCTUM_STATEFUL_DOMAINS` inclui a origem exata usada no navegador (porta incluída).

## Produção (InfinityFree)

O `laravel_core/.env` aponta para o MySQL da InfinityFree. **Nunca** deixe credenciais reais de produção nos arquivos de configuração locais; no servidor, o `.env` é gerenciado pelo painel da hospedagem e está fora do controle de versão (ignorado pelo `.gitignore`).

> ⚠️ O `docker-compose.yml` é exclusivamente para desenvolvimento local. O ambiente de produção usa Apache/LAMP da InfinityFree, onde as migrations são executadas pelo botão "Migrar Banco" do painel administrativo.

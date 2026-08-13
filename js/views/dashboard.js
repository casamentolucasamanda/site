import { API } from '../api.js';

const TEMPO_REFRESH_MS = 15000;

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor || 0);
}

function formatarHorario(data) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(data);
}

// Iniciais do nome para o avatar do perfil em destaque
function getInitials(nome) {
    if (!nome) return '?';
    const partes = String(nome).trim().split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }
    return (partes[0] || '?').slice(0, 2).toUpperCase();
}

export default function DashboardView() {
    let intervalo = null;
    let redirecionando = false;

    // Busca e renderiza os dados em tempo real após a casca ser injetada
    setTimeout(() => {
        carregarDados();
        carregarPerfil();
        intervalo = setInterval(carregarDados, TEMPO_REFRESH_MS);

        const btnRefresh = document.getElementById('btn-refresh');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', () => {
                btnRefresh.disabled = true;
                carregarDados();
            });
        }

        // Formulário administrativo para cadastrar novos convidados
        const formCadastrar = document.getElementById('form-cadastrar-convidado');
        if (formCadastrar) {
            formCadastrar.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = document.getElementById('btn-cadastrar-convidado');
                const nome = document.getElementById('novo-convidado-nome').value.trim();
                const usuario = document.getElementById('novo-convidado-usuario').value.trim();
                const senha = document.getElementById('novo-convidado-senha').value;

                btn.disabled = true;
                btn.innerText = 'Cadastrando...';
                try {
                    await API.cadastrarConvidado(nome, usuario, senha);
                    alert('Convidado cadastrado com sucesso!');
                    formCadastrar.reset();
                    carregarDados();
                } catch (err) {
                    alert(err.message || 'Erro ao cadastrar convidado.');
                } finally {
                    btn.disabled = false;
                    btn.innerText = 'Cadastrar';
                }
            });
        }

        // Botão para os noivos executarem as migrations do banco
        const btnMigrate = document.getElementById('btn-migrate');
        if (btnMigrate) {
            btnMigrate.addEventListener('click', async () => {
                if (!confirm('Executar as migrations do banco de dados agora?')) return;
                btnMigrate.disabled = true;
                btnMigrate.innerText = 'Migrando...';
                try {
                    const dados = await API.migrarBanco();
                    alert('Migrations executadas com sucesso!\n\n' + (dados.output || ''));
                    carregarDados();
                    carregarPerfil();
                } catch (err) {
                    alert(err.message || 'Erro ao executar migrate.');
                } finally {
                    btnMigrate.disabled = false;
                    btnMigrate.innerText = 'Migrar Banco';
                }
            });
        }
    }, 100);

    async function carregarDados() {
        const statusEl = document.getElementById('dashboard-status');
        const btnRefresh = document.getElementById('btn-refresh');

        try {
            const dados = await API.getDashboardNoivos();

            document.getElementById('total-confirmados').innerText = dados.total_convidados_confirmados || 0;
            document.getElementById('total-aguardando').innerText = dados.total_aguardando_resposta || 0;
            document.getElementById('total-nao-confirmaram').innerText = dados.total_convidados_nao_confirmaram || 0;
            document.getElementById('total-convidados').innerText = dados.total_convidados || 0;
            document.getElementById('presentes-ganhos').innerText = dados.presentes_ganhos || 0;
            document.getElementById('presentes-disponiveis').innerText = dados.presentes_disponiveis || 0;
            document.getElementById('valor-presentes').innerText = formatarMoeda(dados.valor_total_presentes);

            const lista = document.getElementById('lista-confirmados');
            const confirmados = dados.lista_confirmados || [];
            if (confirmados.length === 0) {
                lista.innerHTML = '<div class="text-muted">Nenhum convidado confirmou presença ainda.</div>';
            } else {
                lista.innerHTML = confirmados.map(conv => `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>${conv.nome}</span>
                        <span class="badge bg-secondary rounded-pill">
                            ${conv.acompanhantes} acompanhante${conv.acompanhantes === 1 ? '' : 's'}
                        </span>
                    </li>
                `).join('');
            }

            const totalPessoas = confirmados.reduce((soma, conv) => soma + 1 + conv.acompanhantes, 0);
            document.getElementById('total-pessoas').innerText = totalPessoas;

            if (statusEl) {
                statusEl.innerHTML = `Atualizado em ${formatarHorario(new Date())} <span class="badge bg-success ms-1">● Online</span>`;
            }
            if (btnRefresh) btnRefresh.disabled = false;
        } catch (err) {
            if (statusEl) {
                statusEl.innerHTML = `<span class="text-danger">Falha ao atualizar dados: ${err.message}</span>`;
            }
            if (btnRefresh) btnRefresh.disabled = false;

            // Se o Laravel responder 401, para o refresh e joga o usuário para o login
            if (!redirecionando && (err.message.includes('401') || err.message.includes('Não autenticado'))) {
                redirecionando = true;
                if (intervalo) clearInterval(intervalo);
                window.history.pushState({}, '', '/login');
                window.dispatchEvent(new Event('popstate'));
            }
        }
    }

    // Exibe o perfil do usuário noivo em destaque no topo do Painel
    async function carregarPerfil() {
        try {
            const usuario = await API.testarLogin();
            const set = (id, valor) => {
                const el = document.getElementById(id);
                if (el) el.innerText = valor;
            };
            set('perfil-iniciais', getInitials(usuario.name));
            set('perfil-nome', usuario.name || '');
            set('perfil-username', usuario.username ? '@' + usuario.username : '');
            set('perfil-email', usuario.email || '');
            set('perfil-role', usuario.role === 'noivos' ? 'Noivos' : (usuario.role || ''));
        } catch (err) {
            // Perfil indisponível; mantém os placeholders exibidos
        }
    }

    return `
        <div class="card shadow-sm p-4 bg-white">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-4">
                <h2 class="text-success mb-0">Painel de Controle do Casamento</h2>
                <div class="d-flex align-items-center gap-2">
                    <a class="btn btn-success btn-sm text-nowrap" href="/painel-presentes" data-link>Gerenciar Presentes</a>
                    <small id="dashboard-status" class="text-muted"></small>
                    <button id="btn-refresh" class="btn btn-casamento btn-sm">Atualizar</button>
                    <button id="btn-migrate" class="btn btn-outline-danger btn-sm text-nowrap">Migrar Banco</button>
                </div>
            </div>

            <div class="mb-4 p-3 rounded-3 shadow-sm" style="background: linear-gradient(135deg, var(--rosa-pastel), #fcdbd5); border: 1px solid rgba(212, 175, 55, 0.25);">
                <div class="d-flex flex-wrap align-items-center gap-3">
                    <span class="avatar-casamento" id="perfil-iniciais" style="width:58px;height:58px;font-size:1.15rem;border:2px solid rgba(255,255,255,0.8);">…</span>
                    <div class="flex-grow-1">
                        <h4 class="mb-0" id="perfil-nome">Carregando perfil...</h4>
                        <small class="text-muted" id="perfil-username"></small>
                    </div>
                    <div class="text-end">
                        <span class="badge bg-success" id="perfil-role">Noivos</span>
                        <div class="small text-muted" id="perfil-email"></div>
                    </div>
                </div>
            </div>

            <div class="row text-center g-3 mb-4">
                <div class="col-md-3 col-sm-6">
                    <div class="p-3 border rounded bg-light">
                        <h6 class="text-muted">Convidados Confirmados</h6>
                        <h2 id="total-confirmados" class="text-primary">...</h2>
                        <small id="total-pessoas" class="text-muted">...</small>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="p-3 border rounded bg-light">
                        <h6 class="text-muted">Aguardando Resposta</h6>
                        <h2 id="total-aguardando" class="text-warning">...</h2>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="p-3 border rounded bg-light">
                        <h6 class="text-muted">Presentes Ganhos</h6>
                        <h2 id="presentes-ganhos" class="text-success">...</h2>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="p-3 border rounded bg-light">
                        <h6 class="text-muted">Valor dos Presentes</h6>
                        <h2 id="valor-presentes" class="text-dark" style="font-size:1.5rem;">...</h2>
                    </div>
                </div>
            </div>

            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <div class="p-3 border rounded bg-light text-center">
                        <h6 class="text-muted">Total de Convidados</h6>
                        <h2 id="total-convidados" class="text-secondary">...</h2>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-3 border rounded bg-light text-center">
                        <h6 class="text-muted">Não Comparecerão</h6>
                        <h2 id="total-nao-confirmaram" class="text-danger">...</h2>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-3 border rounded bg-light text-center">
                        <h6 class="text-muted">Presentes Disponíveis</h6>
                        <h2 id="presentes-disponiveis" class="text-info">...</h2>
                    </div>
                </div>
            </div>

            <div class="mb-4">
                <h5 class="mb-3">Convidados Confirmados</h5>
                <ul id="lista-confirmados" class="list-group"></ul>
            </div>

            <div class="mb-4 p-3 border rounded bg-white">
                <h5 class="mb-3">Cadastrar Convidado</h5>
                <p class="text-muted small mb-3">Crie o acesso de um novo convidado para confirmar presença e reservar presentes.</p>
                <form id="form-cadastrar-convidado" class="row g-2 align-items-end">
                    <div class="col-md-4">
                        <label class="form-label small mb-1" for="novo-convidado-nome">Nome Completo *</label>
                        <input type="text" id="novo-convidado-nome" class="form-control" required maxlength="255" placeholder="Ex: Maria da Silva">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small mb-1" for="novo-convidado-usuario">Usuário de Acesso *</label>
                        <input type="text" id="novo-convidado-usuario" class="form-control" required maxlength="255" placeholder="Ex: maria_silva">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small mb-1" for="novo-convidado-senha">Senha * (mín. 6)</label>
                        <input type="password" id="novo-convidado-senha" class="form-control" required minlength="6" autocomplete="new-password">
                    </div>
                    <div class="col-md-2 d-grid">
                        <button type="submit" id="btn-cadastrar-convidado" class="btn btn-casamento">Cadastrar</button>
                    </div>
                </form>
            </div>

            <div class="text-center border rounded p-4 bg-light">
                <h5 class="mb-2">Gerenciamento de Presentes</h5>
                <p class="text-muted small mb-3">Adicione novos presentes e acompanhe os reservados, recebimentos e mensagens dos convidados.</p>
                <a class="btn btn-success" href="/painel-presentes" data-link>Ir para Gerenciar Presentes</a>
            </div>
        </div>
    `;
}

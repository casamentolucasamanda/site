// Function to retrieve a cookie by its name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop().split(';').shift());
    }
    return '';
}

function getFetchOptions(extraHeaders = {}) {
    const headers = {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        ...extraHeaders
    };
    const xsrfToken = getCookie('XSRF-TOKEN');
    if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
    }
    return {
        credentials: 'include',
        headers
    };
}

// Evita múltiplos redirecionamentos em rajadas de 401 (ex.: refresh do dashboard)
let redirecionandoLogin = false;

// Remove a sessão do navegador e volta para o login quando o servidor responder 401
function encerrarSessaoPor401() {
    localStorage.removeItem('is_logged');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');

    if (redirecionandoLogin) return;
    redirecionandoLogin = true;

    if (window.location.pathname !== '/login') {
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new Event('popstate'));
    }
}

// Checa se a resposta foi 401 e, se sim, limpa a sessão local do navegador
function verificar401(response) {
    if (response.status === 401) {
        encerrarSessaoPor401();
        return true;
    }
    return false;
}

export const API = {
    // Inicializa o cookie CSRF do Laravel caso ainda não exista no navegador
    async initCsrf() {
        if (!getCookie('XSRF-TOKEN')) {
            await fetch('/sanctum/csrf-cookie', {
                credentials: 'include',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });
        }
    },
    
    // Método para os noivos registrarem novos convidados (rota administrativa)
    async cadastrarConvidado(nome, usuario, senha) {
        const options = getFetchOptions({ 'Content-Type': 'application/json' });
        const response = await fetch('/api/usuarios/cadastrar', {
            ...options,
            method: 'POST',
            body: JSON.stringify({ name: nome, username: usuario, password: senha, role: 'convidado' })
        });

        if (verificar401(response)) throw new Error('Não autenticado');
        if (response.status === 403) throw new Error('Acesso restrito apenas aos noivos');

        const data = await response.json();

        if (!response.ok) {
            const erros = data.errors ? Object.values(data.errors).flat().join(' ') : (data.mensagem || 'Erro ao cadastrar convidado.');
            throw new Error(erros);
        }

        return data;
    },

    // Autentica o usuário (convidados ou noivos)
    async login(username, password) {
        await this.initCsrf();
        const options = getFetchOptions({ 'Content-Type': 'application/json' });
        const response = await fetch('/api/login', {
            ...options,
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (verificar401(response)) throw new Error('Não autenticado');

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.message || 'Falha na autenticação');
        }

        // Sessão renovada com sucesso: permite novos redirecionamentos por 401
        redirecionandoLogin = false;

        return response.json();
    },
    
    // Finaliza a sessão no servidor
    async logout() {
        const options = getFetchOptions({ 'Content-Type': 'application/json' });
        const response = await fetch('/api/logout', { ...options, method: 'POST' });
        localStorage.removeItem('is_logged');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        return response.json();
    },
    
    // Busca resposta atual da presença do usuário logado
    async getPresenca() {
        const options = getFetchOptions();
        const response = await fetch('/api/presenca', { ...options, method: 'GET' });
        if (verificar401(response)) throw new Error('Não autenticado');
        return response.json();
    },

    // Confirma ou atualiza a presença (sem acompanhantes)
    async confirmarPresenca(confirmado, observacoes) {
        const options = getFetchOptions({ 'Content-Type': 'application/json' });
        const response = await fetch('/api/confirmar-presenca', {
            ...options,
            method: 'POST',
            body: JSON.stringify({ confirmado, observacoes })
        });
        if (verificar401(response)) throw new Error('Não autenticado');
        return response.json();
    },

    // Busca a lista de presentes cadastrada no banco de dados
    async getPresentes() {
        const options = getFetchOptions();
        const response = await fetch('/api/presentes', { ...options, method: 'GET' });
        if (verificar401(response)) throw new Error('Não autenticado');
        return response.json();
    },

    // Reserva presente e retorna dados para pagamento via PIX (QR Code)
    async escolherPresente(presenteId) {
        const options = getFetchOptions({ 'Content-Type': 'application/json' });
        const response = await fetch('/api/escolher-presente', {
            ...options,
            method: 'POST',
            body: JSON.stringify({ presente_id: presenteId })
        });
        if (verificar401(response)) throw new Error('Não autenticado');
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.mensagem || 'Erro ao reservar presente.');
        }
        return data;
    },

    // Lista todos os convidados cadastrados (somente noivos)
    async getConvidados() {
        const options = getFetchOptions();
        const response = await fetch('/api/painel-noivos/convidados', { ...options, method: 'GET' });
        if (verificar401(response)) throw new Error('Não autenticado');
        if (response.status === 403) throw new Error('Acesso restrito apenas aos noivos');
        return response.json();
    },

    // Atualiza os dados de um convidado (somente noivos)
    async atualizarConvidado(convidadoId, name, username, password, role) {
        const options = getFetchOptions({ 'Content-Type': 'application/json' });
        const response = await fetch(`/api/convidados/${convidadoId}`, {
            ...options,
            method: 'PUT',
            body: JSON.stringify({
                name,
                username,
                password: password || null,
                role
            })
        });
        if (verificar401(response)) throw new Error('Não autenticado');
        if (response.status === 403) throw new Error('Acesso restrito apenas aos noivos');
        const data = await response.json();
        if (!response.ok) {
            const erros = data.errors ? Object.values(data.errors).flat().join('; ') : (data.mensagem || 'Erro ao atualizar convidado.');
            throw new Error(erros);
        }
        return data;
    },

    // Remove um convidado (somente noivos)
    async removerConvidado(convidadoId) {
        const options = getFetchOptions();
        const response = await fetch(`/api/convidados/${convidadoId}`, {
            ...options,
            method: 'DELETE'
        });
        if (verificar401(response)) throw new Error('Não autenticado');
        if (response.status === 403) throw new Error('Acesso restrito apenas aos noivos');
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.mensagem || 'Erro ao remover convidado.');
        }
        return data;
    },

    // Salva a configuração PIX (somente noivos)
    async salvarPixConfig(dados) {
        const options = getFetchOptions({ 'Content-Type': 'application/json' });
        const response = await fetch('/api/pix-config', {
            ...options,
            method: 'PUT',
            body: JSON.stringify(dados)
        });
        if (verificar401(response)) throw new Error('Não autenticado');
        if (response.status === 403) throw new Error('Acesso restrito apenas aos noivos');
        const data = await response.json();
        if (!response.ok) {
            const erros = data.errors ? Object.values(data.errors).flat().join('; ') : (data.mensagem || 'Erro ao salvar configuração PIX.');
            throw new Error(erros);
        }
        return data;
    },

    // Resumo exclusivo dos noivos (inclui perfil do usuário logado)
    async getDashboardNoivos() {
        const options = getFetchOptions();
        const response = await fetch('/api/painel-noivos/resumo', { ...options, method: 'GET' });
        if (verificar401(response)) throw new Error('Não autenticado');
        if (response.status === 403) throw new Error('Acesso restrito apenas aos noivos');
        return response.json();
    },

    // Lista de presentes para gestão dos noivos (inclui configuração PIX)
    async getPainelNoivosPresentes() {
        const options = getFetchOptions();
        const response = await fetch('/api/painel-noivos/presentes', { ...options, method: 'GET' });
        if (verificar401(response)) throw new Error('Não autenticado');
        if (response.status === 403) throw new Error('Acesso restrito apenas aos noivos');
        return response.json();
    },

    // Cadastra um novo presente na lista de presentes (somente noivos)
    async cadastrarPresente(nome, descricao, valorEstimado) {
        const options = getFetchOptions({ 'Content-Type': 'application/json' });
        const response = await fetch('/api/presentes', {
            ...options,
            method: 'POST',
            body: JSON.stringify({
                nome,
                descricao: descricao || null,
                valor_estimado: valorEstimado ?? null
            })
        });
        if (verificar401(response)) throw new Error('Não autenticado');
        if (response.status === 403) throw new Error('Acesso restrito apenas aos noivos');
        const data = await response.json();
        if (!response.ok) {
            const erros = data.errors ? Object.values(data.errors).flat().join('; ') : (data.mensagem || 'Erro ao adicionar presente.');
            throw new Error(erros);
        }
        return data;
    },

    // Atualiza os dados de um presente existente (somente noivos)
    async atualizarPresente(presenteId, nome, descricao, valorEstimado) {
        const options = getFetchOptions({ 'Content-Type': 'application/json' });
        const response = await fetch(`/api/presentes/${presenteId}`, {
            ...options,
            method: 'PUT',
            body: JSON.stringify({
                nome,
                descricao: descricao || null,
                valor_estimado: valorEstimado ?? null
            })
        });
        if (verificar401(response)) throw new Error('Não autenticado');
        if (response.status === 403) throw new Error('Acesso restrito apenas aos noivos');
        const data = await response.json();
        if (!response.ok) {
            const erros = data.errors ? Object.values(data.errors).flat().join('; ') : (data.mensagem || 'Erro ao atualizar presente.');
            throw new Error(erros);
        }
        return data;
    },

    // Confirma o recebimento físico de um presente
    async confirmarRecebimentoPresente(presenteId) {
        const options = getFetchOptions({ 'Content-Type': 'application/json' });
        const response = await fetch(`/api/presentes/${presenteId}/receber`, {
            ...options,
            method: 'POST'
        });
        if (verificar401(response)) throw new Error('Não autenticado');
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.mensagem || 'Erro ao confirmar recebimento.');
        }
        return data;
    },

    // Envia mensagem dos noivos ao convidado que reservou o presente
    async enviarMensagemPresente(presenteId, mensagem) {
        const options = getFetchOptions({ 'Content-Type': 'application/json' });
        const response = await fetch(`/api/presentes/${presenteId}/mensagem`, {
            ...options,
            method: 'POST',
            body: JSON.stringify({ mensagem })
        });
        if (verificar401(response)) throw new Error('Não autenticado');
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.mensagem || 'Erro ao enviar mensagem.');
        }
        return data;
    },

    // Executa as migrations do banco de dados (somente noivos)
    async migrarBanco() {
        const options = getFetchOptions();
        const response = await fetch('/api/admin/migrate', { ...options, method: 'GET' });
        if (verificar401(response)) throw new Error('Não autenticado');
        if (response.status === 403) throw new Error('Acesso restrito apenas aos noivos');
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.mensagem || 'Erro ao executar migrate.');
        }
        return data;
    },

    // Informações do local da recepção
    async getLocal() {
        const options = getFetchOptions();
        const response = await fetch('/api/local', { ...options, method: 'GET' });
        if (!response.ok) {
            throw new Error('Erro ao carregar as informações do local');
        }
        return response.json();
    }
};

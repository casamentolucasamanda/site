// Helper para obter valor de cookie por nome
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

let redirecionandoLogin = false;

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

function verificar401(response) {
    if (response.status === 401) {
        encerrarSessaoPor401();
        return true;
    }
    return false;
}

// Helper para realizar requisições à API garantindo validação de erro e respostas JSON
async function safeJsonFetch(url, options = {}) {
    const defaultOptions = getFetchOptions();
    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...(options.headers || {})
        }
    };

    const response = await fetch(url, finalOptions);

    if (verificar401(response)) {
        throw new Error('Não autenticado');
    }
    if (response.status === 403) {
        throw new Error('Acesso restrito apenas aos noivos');
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
            const erros = data.errors
                ? Object.values(data.errors).flat().join('; ')
                : (data.mensagem || data.message || 'Erro na requisição.');
            throw new Error(erros);
        }
        return data;
    }

    if (!response.ok) {
        throw new Error(`Erro na API (${response.status})`);
    }

    return null;
}

export const API = {
    async initCsrf() {
        if (!getCookie('XSRF-TOKEN')) {
            try {
                await fetch('/sanctum/csrf-cookie', {
                    credentials: 'include',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json'
                    }
                });
            } catch (e) {}
        }
    },

    async getMe() {
        return await safeJsonFetch('/api/me');
    },

    async cadastrarConvidado(nome, usuario, senha) {
        return await safeJsonFetch('/api/usuarios/cadastrar', {
            method: 'POST',
            body: JSON.stringify({ name: nome, username: usuario, password: senha, role: 'convidado' }),
            headers: { 'Content-Type': 'application/json' }
        });
    },

    async login(username, password) {
        await this.initCsrf();
        const data = await safeJsonFetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: { 'Content-Type': 'application/json' }
        });
        redirecionandoLogin = false;
        return data;
    },

    async logout() {
        try {
            await safeJsonFetch('/api/logout', { method: 'POST' });
        } catch (e) {}
        localStorage.removeItem('is_logged');
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_name');
        return { status: 'sucesso' };
    },

    async getPresenca() {
        return await safeJsonFetch('/api/presenca');
    },

    async confirmarPresenca(confirmado, observacoes) {
        return await safeJsonFetch('/api/confirmar-presenca', {
            method: 'POST',
            body: JSON.stringify({ confirmado, observacoes }),
            headers: { 'Content-Type': 'application/json' }
        });
    },

    async getPresentes() {
        return await safeJsonFetch('/api/presentes');
    },

    async escolherPresente(presenteId) {
        return await safeJsonFetch('/api/escolher-presente', {
            method: 'POST',
            body: JSON.stringify({ presente_id: presenteId }),
            headers: { 'Content-Type': 'application/json' }
        });
    },

    async getConvidados() {
        return await safeJsonFetch('/api/painel-noivos/convidados');
    },

    async atualizarConvidado(convidadoId, name, username, password, role) {
        return await safeJsonFetch(`/api/convidados/${convidadoId}`, {
            method: 'PUT',
            body: JSON.stringify({ name, username, password: password || null, role }),
            headers: { 'Content-Type': 'application/json' }
        });
    },

    async removerConvidado(convidadoId) {
        return await safeJsonFetch(`/api/convidados/${convidadoId}`, {
            method: 'DELETE'
        });
    },

    async salvarPixConfig(dados) {
        return await safeJsonFetch('/api/pix-config', {
            method: 'PUT',
            body: JSON.stringify(dados),
            headers: { 'Content-Type': 'application/json' }
        });
    },

    async getDashboardNoivos() {
        return await safeJsonFetch('/api/painel-noivos/resumo');
    },

    async getPainelNoivosPresentes() {
        return await safeJsonFetch('/api/painel-noivos/presentes');
    },

    async cadastrarPresente(nome, descricao, valorEstimado, imagemUrl) {
        return await safeJsonFetch('/api/presentes', {
            method: 'POST',
            body: JSON.stringify({ nome, descricao: descricao || null, valor_estimado: valorEstimado ?? null, imagem_url: imagemUrl || null }),
            headers: { 'Content-Type': 'application/json' }
        });
    },

    async atualizarPresente(presenteId, nome, descricao, valorEstimado, imagemUrl) {
        return await safeJsonFetch(`/api/presentes/${presenteId}`, {
            method: 'PUT',
            body: JSON.stringify({ nome, descricao: descricao || null, valor_estimado: valorEstimado ?? null, imagem_url: imagemUrl || null }),
            headers: { 'Content-Type': 'application/json' }
        });
    },

    async confirmarRecebimentoPresente(presenteId) {
        return await safeJsonFetch(`/api/presentes/${presenteId}/receber`, {
            method: 'POST'
        });
    },

    async enviarMensagemPresente(presenteId, mensagem) {
        return await safeJsonFetch(`/api/presentes/${presenteId}/mensagem`, {
            method: 'POST',
            body: JSON.stringify({ mensagem }),
            headers: { 'Content-Type': 'application/json' }
        });
    },

    async migrarBanco() {
        return await safeJsonFetch('/api/admin/migrate');
    },

    async getLocal() {
        return await safeJsonFetch('/api/local');
    }
};

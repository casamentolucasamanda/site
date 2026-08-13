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
    
    // Método para os noivos registrarem novos convidados
    async cadastrarConvidado(nome, usuario, senha) {
        const options = getFetchOptions({ 'Content-Type': 'application/json' });
        const response = await fetch('/api/usuarios/cadastrar', {
            ...options,
            method: 'POST',
            body: JSON.stringify({ name: nome, username: usuario, password: senha, role: 'convidado' })
        });
        return response.json();
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
        
        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.message || 'Falha na autenticação');
        }
        
        return response.json();
    },
    
    // Finaliza a sessão no servidor
    async logout() {
        const options = getFetchOptions({ 'Content-Type': 'application/json' });
        const response = await fetch('/api/logout', { ...options, method: 'POST' });
        localStorage.removeItem('is_logged');
        return response.json();
    },
    
    // Busca resposta atual da presença do usuário logado
    async getPresenca() {
        const options = getFetchOptions();
        const response = await fetch('/api/presenca', { ...options, method: 'GET' });
        if (response.status === 401) throw new Error('Não autenticado');
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
        if (response.status === 401) throw new Error('Não autenticado');
        return response.json();
    },

    // Busca a lista de presentes cadastrada no banco de dados
    async getPresentes() {
        const options = getFetchOptions();
        const response = await fetch('/api/presentes', { ...options, method: 'GET' });
        if (response.status === 401) throw new Error('Não autenticado');
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
        if (response.status === 401) throw new Error('Não autenticado');
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.mensagem || 'Erro ao reservar presente.');
        }
        return data;
    },

    // Resumo exclusivo dos noivos
    async getDashboardNoivos() {
        const options = getFetchOptions();
        const response = await fetch('/api/painel-noivos/resumo', { ...options, method: 'GET' });
        if (response.status === 401) throw new Error('Não autenticado');
        if (response.status === 403) throw new Error('Acesso restrito apenas aos noivos');
        return response.json();
    },

    // Dados de votos/presença
    async getDashboardData() {
        const options = getFetchOptions();
        const response = await fetch('/api/votos', { ...options, method: 'GET' });
        if (response.status === 401) throw new Error('Não autenticado');
        return response.json();
    },

    // Informações do local da recepção
    async getLocal() {
        const options = getFetchOptions();
        const response = await fetch('/api/local', { ...options, method: 'GET' });
        if (!response.ok) {
            throw new Error('Erro ao carregar as informações do local');
        }
        return response.json();
    },

    // Checagem de usuário logado
    async testarLogin() {
        const options = getFetchOptions();
        const response = await fetch('/api/user', {
            ...options,
            method: 'GET'
        });

        if (response.status === 401) {
            throw new Error('Não autenticado (401 Unauthorized)');
        }

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }

        return response.json();
    }
};

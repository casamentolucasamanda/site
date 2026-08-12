// Function to retrieve a cookie by its name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop().split(';').shift());
    }
    return '';
}

// Objeto global de opções (let para permitir reatribuição)
let fetchOptions = {
    credentials: 'include',
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
};

export const API = {
    // 0. Atualiza o objeto fetchOptions com o token atualizado do cookie
    buildFetchOptions() {
        fetchOptions = {
            credentials: 'include',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') // Busca o token atualizado
            }
        };
    },

    // 1. Inicializa o cookie CSRF do Laravel (Obrigatório antes do Login)
    async initCsrf() {
        // Usa o fetchOptions padrão inicial sem token, pois o cookie ainda não existe
        await fetch('/sanctum/csrf-cookie', { method: 'GET', ...fetchOptions });
        // Sincroniza o token logo após receber o cookie do Laravel
        this.buildFetchOptions();
    },
    
    // Método novo que os noivos usarão a partir do painel para gerar convidados
    async cadastrarConvidado(nome, usuario, senha) {
        await this.initCsrf();
        const response = await fetch('/api/usuarios/cadastrar', {
            ...fetchOptions,
            method: 'POST',
            body: JSON.stringify({ name: nome, username: usuario, password: senha, role: 'convidado' })
        });
        return response.json();
    },

    // 2. Realiza o Login
    async login(username, password) {
        await this.initCsrf();
        const response = await fetch('/api/login', {
            ...fetchOptions,
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.message || 'Falha na autenticação');
        }
        
        return response.json();
    },
    
    // 3. Finaliza a sessão do usuário no servidor
    async logout() {
        await this.initCsrf();
        const response = await fetch('/api/logout', { ...fetchOptions, method: 'POST' });
        localStorage.removeItem('is_logged'); // Limpa o estado local da SPA
        return response.json();
    },
    
    // 4. Salva a confirmação de presença do convidado logado
    async confirmarPresenca(acompanhantes, observacoes) {
        await this.initCsrf();
        const response = await fetch('/api/confirmar-presenca', {
            ...fetchOptions,
            method: 'POST',
            body: JSON.stringify({ acompanhantes, observacoes })
        });
        if (response.status === 401) throw new Error('Não autenticado');
        return response.json();
    },

    // 5. Reserva um item da lista de presentes para o convidado logado
    async escolherPresente(presenteId) {
        await this.initCsrf();
        const response = await fetch('/api/escolher-presente', {
            ...fetchOptions,
            method: 'POST',
            body: JSON.stringify({ presente_id: presenteId })
        });
        if (response.status === 401) throw new Error('Não autenticado');
        return response.json();
    },

    // 6. Busca os dados consolidados do painel exclusivo dos noivos (Lucas & Amanda)
    async getDashboardNoivos() {
        await this.initCsrf();
        const response = await fetch('/api/painel-noivos/resumo', { ...fetchOptions, method: 'GET' });
        if (response.status === 401) throw new Error('Não autenticado');
        if (response.status === 403) throw new Error('Acesso restrito apenas aos noivos');
        return response.json();
    },

    // 7. Busca os dados de uma rota protegida (Ex: Lista de Presentes/Dashboard)
    async getDashboardData() {
        await this.initCsrf();
        const response = await fetch('/api/votos', { ...fetchOptions, method: 'GET' });
        if (response.status === 401) throw new Error('Não autenticado');
        return response.json();
    }
};

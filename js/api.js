// Configuração base para o Fetch API enviar cookies de sessão
const fetchOptions = {
    credentials: 'include',
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

export const API = {
    // 1. Inicializa o cookie CSRF do Laravel (Obrigatório antes do Login)
    async initCsrf() {
        //await fetch('/sanctum/csrf-cookie', { method: 'GET', ...fetchOptions });
    },
    
    // Método novo que os noivos usarão a partir do painel para gerar convidados
    async cadastrarConvidado(nome, usuario, senha) {
        await this.initCsrf();
        const response = await fetch('/api/usuarios/cadastrar', {
            method: 'POST',
            ...fetchOptions,
            body: JSON.stringify({ name: nome, username: usuario, password: senha, role: 'convidado' })
        });
        return response.json();
    },

    // 2. Realiza o Login
    async login(username, password) {
        await this.initCsrf();
        const response = await fetch('/api/login', {
            method: 'POST',
            ...fetchOptions,
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
        const response = await fetch('/api/logout', { method: 'POST', ...fetchOptions });
        localStorage.removeItem('is_logged'); // Limpa o estado local da SPA
        return response.json();
    },
    
    // 4. Salva a confirmação de presença do convidado logado
    async confirmarPresenca(acompanhantes, observacoes) {
        await this.initCsrf();
        const response = await fetch('/api/confirmar-presenca', {
            method: 'POST',
            ...fetchOptions,
            body: JSON.stringify({ acompanhantes, observacoes })
        });
        if (response.status === 401) throw new Error('Não autenticado');
        return response.json();
    },

    // 5. Reserva um item da lista de presentes para o convidado logado
    async escolherPresente(presenteId) {
        await this.initCsrf();
        const response = await fetch('/api/escolher-presente', {
            method: 'POST',
            ...fetchOptions,
            body: JSON.stringify({ presente_id: presenteId })
        });
        if (response.status === 401) throw new Error('Não autenticado');
        return response.json();
    },

    // 6. Busca os dados consolidados do painel exclusivo dos noivos (Lucas & Amanda)
    async getDashboardNoivos() {
        const response = await fetch('/api/painel-noivos/resumo', { method: 'GET', ...fetchOptions });
        if (response.status === 401) throw new Error('Não autenticado');
        if (response.status === 403) throw new Error('Acesso restrito apenas aos noivos');
        return response.json();
    },

    // 3. Busca os dados de uma rota protegida (Ex: Lista de Presentes/Dashboard)
    async getDashboardData() {
        const response = await fetch('/api/votos', { method: 'GET', ...fetchOptions });
        if (response.status === 401) throw new Error('Não autenticado');
        return response.json();
    }
};

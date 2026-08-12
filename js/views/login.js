import { API } from '../api.js';

export default function LoginView() {
    // Escuta o evento de submit após o HTML ser injetado na tela
    setTimeout(() => {
        const form = document.getElementById('login-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value; // Captura o usuário
            const password = document.getElementById('password').value;
            
            try {
                // Modificado no api.js para enviar o username
                const dados = await API.login(username, password);
                // Grava localmente que o usuário está autenticado para liberar as rotas da SPA
                localStorage.setItem('is_logged', 'true');

                // Se for o casal Lucas e Amanda, redireciona para o painel de administração
                if (dados.usuario.role === 'noivos') {
                    window.history.pushState({}, '', '/dashboard'); // Se possuir uma view dashboard
                } else {
                    window.history.pushState({}, '', '/confirmar-presenca');
                }

            } catch (err) {
                alert('Erro ao realizar login. Verifique as credenciais.');
            }
        });
    }, 100);

    return `
        <div class="row justify-content-center">
            <div class="col-md-5 card shadow-sm p-4 bg-white">
                <h3 class="card-title mb-4 text-center">Área dos Noivos</h3>
                <form id="login-form">
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Usuário de Acesso</label>
                        <input type="text" id="username" class="form-control" required placeholder="Ex: familiasilva">
                        <div class="form-text small text-muted">Insira o código ou nome de usuário enviado no seu convite.</div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Senha</label>
                        <input type="password" id="password" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-casamento w-100 py-2 mt-2">Entrar</button>
                </form>
            </div>
        </div>
    `;
}

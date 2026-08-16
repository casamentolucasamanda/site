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
            const btn = form.querySelector('button[type="submit"]');

            btn.disabled = true;
            btn.innerText = 'Verificando...';

            try {
                // Modificado no api.js para enviar o username
                const dados = await API.login(username, password);
                // Grava localmente que o usuário está autenticado para liberar as rotas da SPA
                localStorage.setItem('is_logged', 'true');
                // Guarda a role e o nome para controlar a navbar (avatar + submenus)
                localStorage.setItem('user_role', dados.usuario.role);
                localStorage.setItem('user_name', dados.usuario.name);

                const redirectPath = sessionStorage.getItem('redirect_after_login');
                sessionStorage.removeItem('redirect_after_login');

                // Se for o casal Amanda e Lucas, redireciona para o painel de administração ou rota solicitada
                if (dados.usuario.role === 'noivos') {
                    window.history.pushState({}, '', redirectPath || '/dashboard');
                } else {
                    window.history.pushState({}, '', redirectPath || '/local');
                }

                // 3. ATENÇÃO: Força o disparo do roteador do app.js de forma imediata
                window.dispatchEvent(new Event('popstate'));

            } catch (err) {
                alert(err.message || 'Erro ao realizar login. Verifique as credenciais.');
                btn.disabled = false;
                btn.innerText = 'Entrar no Casamento';
            }
        });
    }, 100);

    return `
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5 card-casamento p-4 p-md-5 bg-white shadow-sm text-center">
                <div class="mb-4">
                    <img src="https://casamentolucasamanda.github.io/site/images/icone-aliancas.png" alt="Alianças" class="navbar-icon-aliancas mb-2" style="height: 42px;">
                    <h3 class="serif-font mb-2 text-success fw-bold">Acesso Restrito</h3>
                    <p class="text-muted small">Insira os dados informados no seu convite para acessar os locais, confirmar presença e ver a lista de presentes.</p>
                </div>

                <form id="login-form" class="text-start">
                    <div class="mb-3">
                        <label class="form-label fw-semibold small text-secondary">Usuário de Acesso</label>
                        <input type="text" id="username" class="form-control py-2" required placeholder="Ex: familiasilva">
                        <div class="form-text extra-small text-muted">Nome de usuário que consta no seu convite.</div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label fw-semibold small text-secondary">Senha</label>
                        <input type="password" id="password" class="form-control py-2" required placeholder="Sua senha de acesso">
                    </div>
                    <button type="submit" class="btn btn-casamento w-100 py-2 mt-3 fw-semibold">Entrar no Casamento</button>
                </form>
            </div>
        </div>
    `;
}

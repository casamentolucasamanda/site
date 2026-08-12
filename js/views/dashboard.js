import { API } from '../api.js';

export default function DashboardView() {
    // Busca dados do backend assincronamente após renderizar a casca do painel
    setTimeout(async () => {
        try {
            const dados = await API.getDashboardData();
            document.getElementById('total-confirmados').innerText = dados.total_convidados || 0;
        } catch (err) {
            // Se o Laravel responder 401, joga o usuário para o login
            window.history.pushState({}, '', '/login');
            window.dispatchEvent(new Event('popstate'));
        }
    }, 100);

    return `
        <div class="card shadow-sm p-4 bg-white">
            <h2 class="text-success mb-4">Painel de Controle do Casamento</h2>
            <div class="row text-center">
                <div class="col-md-4 mb-3">
                    <div class="p-3 border rounded bg-light">
                        <h5>Convidados Confirmados</h5>
                        <h2 id="total-confirmados" class="text-primary">...</h2>
                    </div>
                </div>
            </div>
        </div>
    `;
}

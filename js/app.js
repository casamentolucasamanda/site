import HomeView from './views/home.js';
import LoginView from './views/login.js';
import PresencaView from './views/presenca.js';
import PresentesView from './views/presentes.js';
import LocalView from './views/local.js';
import DashboardView from './views/dashboard.js';
import { API } from './api.js';

const routes = {
    '/': HomeView,
    '/login': LoginView,
    '/confirmar-presenca': PresencaView,
    '/lista-de-presentes': PresentesView,
    '/local': LocalView,
    '/dashboard': DashboardView
};

function isAuthenticated() {
    return localStorage.getItem('is_logged') === 'true';
}

// Atualiza dinamicamente o botão de Login/Logout na Navbar baseada no estado
function atualizarMenu() {
    const loginBtnContainer = document.getElementById('nav-login-container');
    if (!loginBtnContainer) return;

    if (isAuthenticated()) {
        loginBtnContainer.innerHTML = `
            <button id="btn-logout" class="btn btn-outline-danger btn-sm px-3 rounded-pill">Sair</button>
        `;
    } else {
        loginBtnContainer.innerHTML = `
            <a class="btn btn-casamento px-4 text-dark ms-lg-2" href="/login" data-link>Entrar</a>
        `;
    }
}

const router = async () => {
    const path = window.location.pathname;
    const rotasProtegidas = ['/confirmar-presenca', '/lista-de-presentes', '/local', '/dashboard'];
    
    if (rotasProtegidas.includes(path) && !isAuthenticated()) {
        window.history.pushState({}, '', '/login');
        router();
        return;
    }

    const view = routes[path] || (() => '<h2 class="text-center mt-5">Página não encontrada</h2>');
    const htmlContent = await view();
    document.getElementById('app').innerHTML = htmlContent;
    atualizarMenu(); // Ajusta os botões após a troca de tela
};

// Captura cliques globais (Links normais e o botão dinâmico de Logout)
document.addEventListener('click', async e => {
    if (e.target.matches('[data-link]')) {
        e.preventDefault();
        window.history.pushState({}, '', e.target.href);
        router();
    }
    
    if (e.target.id === 'btn-logout') {
        try {
            await API.logout();
            window.history.pushState({}, '', '/');
            router();
        } catch (err) {
            // Se houver falha de rede, limpa localmente de qualquer forma
            localStorage.removeItem('is_logged');
            window.history.pushState({}, '', '/login');
            router();
        }
    }
});

window.addEventListener('popstate', router);
document.addEventListener('DOMContentLoaded', router);

import HomeView from './views/home.js';
import LoginView from './views/login.js';
import PresencaView from './views/presenca.js';
import PresentesView from './views/presentes.js';
import LocalView from './views/local.js';
import CerimoniaView from './views/cerimonia.js';
import RecepcaoView from './views/recepcao.js';
import DashboardView from './views/dashboard.js';
import PresentesNoivosView from './views/presentesNoivos.js';
import ConvidadosView from './views/convidados.js';
import { API } from './api.js';

const routes = {
    '/': HomeView,
    '/login': LoginView,
    '/confirmar-presenca': PresencaView,
    '/lista-de-presentes': PresentesView,
    '/local': LocalView,
    '/cerimonia': CerimoniaView,
    '/recepcao': RecepcaoView,
    '/dashboard': DashboardView,
    '/painel-presentes': PresentesNoivosView,
    '/gerenciar-convidados': ConvidadosView
};

function isAuthenticated() {
    return localStorage.getItem('is_logged') === 'true';
}

// Iniciais do nome para o avatar (ex.: "Amanda e Lucas" -> "AL")
function getInitials(nome) {
    if (!nome) return '?';
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    if (partes.length >= 2) {
        return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }
    return (partes[0] || '?').slice(0, 2).toUpperCase();
}

// Atualiza dinamicamente a navbar baseada no estado de autenticação
function atualizarMenu() {
    const loginBtnContainer = document.getElementById('nav-login-container');
    const noivosContainer = document.getElementById('nav-noivos-container');
    const autenticado = isAuthenticated();

    // Submenu administrativo visível apenas para os noivos
    if (noivosContainer) {
        noivosContainer.innerHTML = (autenticado && localStorage.getItem('user_role') === 'noivos')
            ? `
            <div class="dropdown">
                <a class="nav-link py-2 px-3 text-secondary fw-semibold text-nowrap dropdown-toggle" href="#" data-bs-toggle="dropdown" role="button" aria-expanded="false">Área dos Noivos</a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="/dashboard" data-link>Painel de Controle</a></li>
                    <li><a class="dropdown-item" href="/painel-presentes" data-link>Gerenciar Presentes</a></li>
                    <li><a class="dropdown-item" href="/gerenciar-convidados" data-link>Gerenciar Convidados</a></li>
                </ul>
            </div>`
            : '';
    }

    if (!loginBtnContainer) return;

    if (autenticado) {
        const nome = localStorage.getItem('user_name') || 'Usuário';
        loginBtnContainer.innerHTML = `
            <div class="dropdown">
                <a class="nav-link py-2 px-2 d-flex align-items-center gap-2 text-nowrap" href="#" data-bs-toggle="dropdown" role="button" aria-expanded="false" title="${nome}">
                    <span class="avatar-casamento">${getInitials(nome)}</span>
                    <span class="text-secondary fw-semibold small">${nome}</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><span class="dropdown-item-text small text-muted">Logado como ${nome}</span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item text-danger" id="btn-logout">Sair</button></li>
                </ul>
            </div>`;
    } else {
        loginBtnContainer.innerHTML = `
            <a class="btn btn-casamento px-4 text-dark ms-lg-2 text-nowrap" href="/login" data-link>Entrar</a>`;
    }
}

let sessaoVerificada = false;

const router = async () => {
    const path = window.location.pathname;
    const rotasProtegidas = ['/confirmar-presenca', '/lista-de-presentes', '/local', '/cerimonia', '/recepcao', '/dashboard', '/painel-presentes', '/gerenciar-convidados'];

    if (!sessaoVerificada && (isAuthenticated() || rotasProtegidas.includes(path))) {
        try {
            const dataMe = await API.getMe();
            if (dataMe && dataMe.usuario) {
                localStorage.setItem('is_logged', 'true');
                localStorage.setItem('user_role', dataMe.usuario.role);
                localStorage.setItem('user_name', dataMe.usuario.name);
            }
            sessaoVerificada = true;
        } catch (e) {
            sessaoVerificada = true;
            if (rotasProtegidas.includes(path)) {
                sessionStorage.setItem('redirect_after_login', path);
                window.history.pushState({}, '', '/login');
                const loginView = routes['/login'];
                document.getElementById('app').innerHTML = await loginView();
                atualizarMenu();
                return;
            }
        }
    }
    
    if (rotasProtegidas.includes(path) && !isAuthenticated()) {
        sessionStorage.setItem('redirect_after_login', path);
        window.history.pushState({}, '', '/login');
        const loginView = routes['/login'];
        document.getElementById('app').innerHTML = await loginView();
        atualizarMenu();
        return;
    }

    // Painel e gestão de presentes são exclusivos dos noivos
    const rotasNoivos = ['/dashboard', '/painel-presentes', '/gerenciar-convidados'];
    if (rotasNoivos.includes(path) && localStorage.getItem('user_role') !== 'noivos') {
        window.history.pushState({}, '', '/');
        const homeView = routes['/'];
        document.getElementById('app').innerHTML = await homeView();
        atualizarMenu();
        return;
    }

    const view = routes[path] || (() => '<h2 class="text-center mt-5">Página não encontrada</h2>');
    const htmlContent = await view();
    document.getElementById('app').innerHTML = htmlContent;
    atualizarMenu(); // Ajusta os botões após a troca de tela
};

// Fecha todos os dropdowns abertos
function fecharDropdowns() {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
        const toggle = menu.previousElementSibling;
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
}

// Fecha o menu mobile (navbar collapse)
function fecharNavbar() {
    const navbar = document.getElementById('navbarNav');
    if (navbar && navbar.classList.contains('show')) {
        const toggler = document.querySelector('.navbar-toggler');
        if (toggler) toggler.click();
    }
}

// Captura cliques globais (Links normais e o botão dinâmico de Logout)
document.addEventListener('click', async e => {
    const link = e.target.closest('[data-link]');
    if (link) {
        e.preventDefault();
        fecharDropdowns();
        fecharNavbar();
        window.history.pushState({}, '', link.href);
        router();
        return;
    }

    // Fecha dropdowns e navbar ao clicar fora
    if (!e.target.closest('.navbar')) {
        fecharDropdowns();
        fecharNavbar();
    } else if (!e.target.closest('.dropdown')) {
        fecharDropdowns();
    }
    
    if (e.target.id === 'btn-logout') {
        try {
            await API.logout();
            window.history.pushState({}, '', '/');
            router();
        } catch (err) {
            // Se houver falha de rede, limpa localmente de qualquer forma
            localStorage.removeItem('is_logged');
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_name');
            window.history.pushState({}, '', '/login');
            router();
        }
    }
});

window.addEventListener('popstate', router);
document.addEventListener('DOMContentLoaded', router);

import { API } from '../api.js';

// Lista simulada de presentes com IDs baseados no padrão UUID gerado pelo banco
const listaPresentes = [
    { id: '11111111-2222-3333-4444-555555555555', nome: 'Cotas para Lua de Mel', desc: 'Ajude os noivos a curtirem a viagem dos sonhos.', valor: 'R$ 250,00' },
    { id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', nome: 'Jogo de Panelas Antiaderentes', desc: 'Para os jantares especiais na casa nova.', valor: 'R$ 380,00' },
    { id: '99999999-8888-7777-6663-555555555555', nome: 'Cafeteira Elétrica', desc: 'Garantia de café fresquinho todas as manhãs.', valor: 'R$ 190,00' }
];

export default function PresentesView() {
    setTimeout(() => {
        const container = document.getElementById('lista-presentes-container');
        if (!container) return;

        // Escuta os cliques em botões de presentear de forma dinâmica
        container.addEventListener('click', async (e) => {
            if (e.target.matches('.btn-presentear')) {
                const btn = e.target;
                const presenteId = btn.getAttribute('data-id');
                
                btn.disabled = true;
                btn.innerText = 'Reservando...';

                try {
                    await API.escolherPresente(presenteId);
                    
                    // Modifica o botão visualmente para indicar sucesso sem recarregar a página
                    btn.classList.replace('btn-casamento', 'btn-success');
                    btn.innerText = '🎁 Reservado com Sucesso!';
                    alert('Muito obrigado! O item foi reservado em seu nome.');
                } catch (err) {
                    alert('Sessão expirada. Faça login para escolher um presente.');
                    window.history.pushState({}, '', '/login');
                    window.dispatchEvent(new Event('popstate'));
                }
            }
        });
    }, 50);

    // Gera o HTML dos cartões de presentes dinamicamente mapeando o array
    const cardsHtml = listaPresentes.map(item => `
        <div class="col-md-4">
            <div class="card h-100 border-0 shadow-sm bg-white p-2" style="border-radius: 12px;">
                <div class="card-body text-center d-flex flex-column justify-content-between">
                    <div>
                        <h5 class="card-title fw-bold text-secondary mb-2">${item.nome}</h5>
                        <p class="card-text text-muted small mb-3">${item.desc}</p>
                    </div>
                    <div>
                        <span class="d-block fw-bold text-dark fs-5 mb-3">${item.valor}</span>
                        <button class="btn btn-casamento btn-sm w-100 btn-presentear" data-id="${item.id}">
                            Presentear
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    return `
        <div class="card-casamento p-4">
            <h3 class="mb-3 text-center" style="font-family: Georgia, serif;">Lista de Presentes Virtuais</h3>
            <p class="text-muted text-center mb-5">Sua presença é o nosso maior presente, mas se desejar nos abençoar, escolha uma das opções abaixo:</p>
            
            <div id="lista-presentes-container" class="row g-4">
                ${cardsHtml}
            </div>
        </div>
    `;
}

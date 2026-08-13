import { API } from '../api.js';

export default function PresentesNoivosView() {
    setTimeout(() => {
        carregarPresentes();

        // Formulário para os noivos cadastrarem um novo presente
        const formNovoPresente = document.getElementById('form-novo-presente');
        if (formNovoPresente) {
            formNovoPresente.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = formNovoPresente.querySelector('button[type="submit"]');
                const nome = document.getElementById('novo-presente-nome').value.trim();
                const descricao = document.getElementById('novo-presente-descricao').value.trim();
                const valorRaw = document.getElementById('novo-presente-valor').value;
                const valor = valorRaw !== '' ? parseFloat(valorRaw) : null;

                btn.disabled = true;
                try {
                    await API.cadastrarPresente(nome, descricao, valor);
                    formNovoPresente.reset();
                    alert('Presente adicionado com sucesso!');
                } catch (err) {
                    alert(err.message || 'Erro ao adicionar presente.');
                } finally {
                    btn.disabled = false;
                }
            });
        }

        // Delegação de eventos para a seção de presentes reservados
        const container = document.getElementById('lista-presentes-noivos');
        if (container) {
            container.addEventListener('click', async (e) => {
                if (e.target.matches('.btn-confirmar-recebido')) {
                    const btn = e.target;
                    btn.disabled = true;
                    btn.innerText = 'Confirmando...';
                    try {
                        await API.confirmarRecebimentoPresente(btn.getAttribute('data-presente-id'));
                        carregarPresentes();
                    } catch (err) {
                        alert(err.message || 'Erro ao confirmar recebimento.');
                        btn.disabled = false;
                        btn.innerText = 'Confirmar Recebimento';
                    }
                }

                if (e.target.matches('.btn-enviar-msg')) {
                    const id = e.target.getAttribute('data-presente-id');
                    const textarea = container.querySelector(`[data-presente-msg="${id}"]`);
                    const texto = textarea ? textarea.value.trim() : '';
                    if (!texto) {
                        alert('Escreva uma mensagem antes de enviar.');
                        return;
                    }
                    e.target.disabled = true;
                    e.target.innerText = 'Enviando...';
                    try {
                        await API.enviarMensagemPresente(id, texto);
                        carregarPresentes();
                    } catch (err) {
                        alert(err.message || 'Erro ao enviar mensagem.');
                        e.target.disabled = false;
                        e.target.innerText = 'Enviar Mensagem';
                    }
                }
            });
        }
    }, 100);

    async function carregarPresentes() {
        const container = document.getElementById('lista-presentes-noivos');
        if (!container) return;

        try {
            const presentes = await API.getPainelNoivosPresentes();

            if (presentes.length === 0) {
                container.innerHTML = '<div class="text-muted">Nenhum presente foi reservado ainda.</div>';
                return;
            }

            container.innerHTML = presentes.map(item => {
                const mensagens = (item.mensagens || []).map(m => `
                    <div class="border rounded p-2 mb-1 bg-light small">
                        <div class="text-muted" style="font-size:0.75rem;">${m.criado_em}</div>
                        ${m.mensagem}
                    </div>
                `).join('');

                const badgeRecebido = item.recebido
                    ? '<span class="badge bg-success">Recebido ✓</span>'
                    : '<span class="badge bg-warning text-dark">Aguardando recebimento</span>';

                const btnRecebido = item.recebido
                    ? '<button class="btn btn-outline-secondary btn-sm" disabled>Recebimento Confirmado</button>'
                    : '<button class="btn btn-success btn-sm btn-confirmar-recebido" data-presente-id="' + item.id + '">Confirmar Recebimento</button>';

                return `
                    <div class="card mb-3 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
                                <div>
                                    <h6 class="mb-1">${item.nome} <span class="text-muted fw-normal">(${item.valor_formatado})</span></h6>
                                    <small class="text-muted">Doador: ${item.comprador ? item.comprador.name : '—'}</small>
                                </div>
                                <div class="d-flex gap-2 align-items-center">
                                    ${badgeRecebido}
                                    ${btnRecebido}
                                </div>
                            </div>

                            ${mensagens ? `<div class="mt-3"><strong class="small d-block mb-1">Conversa:</strong>${mensagens}</div>` : ''}

                            <div class="mt-3 d-flex gap-2">
                                <textarea class="form-control form-control-sm" data-presente-msg="${item.id}" rows="2" placeholder="Escreva uma mensagem para ${item.comprador ? item.comprador.name : 'o convidado'}..."></textarea>
                                <button class="btn btn-casamento btn-sm btn-enviar-msg text-nowrap" data-presente-id="${item.id}">Enviar Mensagem</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            container.innerHTML = `<span class="text-danger">Erro ao carregar presentes: ${err.message}</span>`;
        }
    }

    return `
        <div class="card shadow-sm p-4 bg-white">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-4">
                <h2 class="text-success mb-0">Gerenciar Presentes</h2>
                <a class="btn btn-outline-secondary btn-sm" href="/dashboard" data-link>← Voltar ao Painel</a>
            </div>

            <div class="mb-4">
                <h5 class="mb-3">Adicionar Novo Presente</h5>
                <form id="form-novo-presente" class="row g-2 align-items-end">
                    <div class="col-md-4">
                        <label class="form-label small mb-1">Nome do Presente *</label>
                        <input type="text" id="novo-presente-nome" class="form-control" required maxlength="255" placeholder="Ex: Jogo de Panelas">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label small mb-1">Valor (R$)</label>
                        <input type="number" id="novo-presente-valor" class="form-control" min="0" step="0.01" placeholder="Ex: 250,00">
                    </div>
                    <div class="col-md-5">
                        <label class="form-label small mb-1">Descrição (opcional)</label>
                        <input type="text" id="novo-presente-descricao" class="form-control" maxlength="500" placeholder="Ex: Conjunto completo de panelas">
                    </div>
                    <div class="col-md-1 d-grid">
                        <button type="submit" class="btn btn-casamento" title="Adicionar presente">+</button>
                    </div>
                </form>
            </div>

            <div>
                <h5 class="mb-3">Presentes Reservados</h5>
                <div id="lista-presentes-noivos"></div>
            </div>
        </div>
    `;
}

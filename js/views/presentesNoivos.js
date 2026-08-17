import { API } from '../api.js';

// Exibe um valor monetário em formato brasileiro para preencher os inputs
function formatarValorInput(valor) {
    if (valor === null || valor === undefined || valor === '') return '';
    return String(valor).replace('.', ',');
}

// Abre o modal de edição do presente selecionado
function abrirModalEdicao(presente, aoSalvar) {
    let modalEl = document.getElementById('modal-editar-presente');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'modal-editar-presente';
        modalEl.className = 'modal fade';
        modalEl.tabIndex = -1;
        document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px;">
                <div class="modal-header border-0 pb-0 position-relative">
                    <h5 class="modal-title serif-font fw-bold text-success">✏️ Editar Presente</h5>
                    <button type="button" class="btn-close position-absolute end-0 me-3" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <form id="form-editar-presente">
                    <div class="modal-body p-4">
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Nome do Presente *</label>
                            <input type="text" id="editar-presente-nome" class="form-control" required maxlength="255" value="${presente.nome}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Valor Estimado (R$)</label>
                            <input type="text" id="editar-presente-valor" class="form-control" inputmode="decimal" value="${formatarValorInput(presente.valor_estimado)}" placeholder="Ex: 250,00">
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Descrição</label>
                            <textarea id="editar-presente-descricao" class="form-control" maxlength="500" rows="2" placeholder="Ex: Conjunto completo de panelas">${presente.descricao || ''}</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Link da Imagem (URL)</label>
                            <input type="url" id="editar-presente-imagem" class="form-control" placeholder="https://exemplo.com/foto.jpg" value="${presente.imagem_url || ''}">
                        </div>
                    </div>
                    <div class="modal-footer border-0 justify-content-center pt-0 pb-4">
                        <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" id="btn-salvar-edicao" class="btn btn-casamento px-4">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    document.getElementById('form-editar-presente').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-salvar-edicao');
        const nome = document.getElementById('editar-presente-nome').value.trim();
        const descricao = document.getElementById('editar-presente-descricao').value.trim();
        const imagemUrl = document.getElementById('editar-presente-imagem').value.trim();
        const valorRaw = document.getElementById('editar-presente-valor').value.replace(',', '.');
        const valor = valorRaw !== '' ? parseFloat(valorRaw) : null;

        btn.disabled = true;
        btn.innerText = 'Salvando...';
        try {
            await aoSalvar(presente.id, nome, descricao, valor, imagemUrl);
            bsModal.hide();
        } catch (err) {
            alert(err.message || 'Erro ao salvar presente.');
            btn.disabled = false;
            btn.innerText = 'Salvar Alterações';
        }
    });
}

export default function PresentesNoivosView() {
    let presentesCache = [];

    setTimeout(() => {
        carregarPresentes();

        // Formulário de configuração do PIX
        const formPixConfig = document.getElementById('form-pix-config');
        if (formPixConfig) {
            formPixConfig.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = formPixConfig.querySelector('button[type="submit"]');
                const dados = {
                    chave_pix: document.getElementById('pix-config-chave').value.trim(),
                    nome_recebedor: document.getElementById('pix-config-nome').value.trim(),
                    cidade: document.getElementById('pix-config-cidade').value.trim(),
                    mcc: document.getElementById('pix-config-mcc').value.trim() || '0000',
                    txid: document.getElementById('pix-config-txid').value.trim() || '***'
                };

                btn.disabled = true;
                btn.innerText = 'Salvando...';
                try {
                    await API.salvarPixConfig(dados);
                    alert('Configuração PIX salva com sucesso!');
                    carregarPresentes();
                } catch (err) {
                    alert(err.message || 'Erro ao salvar configuração PIX.');
                } finally {
                    btn.disabled = false;
                    btn.innerText = 'Salvar Configuração';
                }
            });
        }

        // Formulário para os noivos cadastrarem um novo presente
        const formNovoPresente = document.getElementById('form-novo-presente');
        if (formNovoPresente) {
            formNovoPresente.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = formNovoPresente.querySelector('button[type="submit"]');
                const nome = document.getElementById('novo-presente-nome').value.trim();
                const descricao = document.getElementById('novo-presente-descricao').value.trim();
                const imagemUrl = document.getElementById('novo-presente-imagem').value.trim();
                const valorRaw = document.getElementById('novo-presente-valor').value.replace(',', '.');
                const valor = valorRaw !== '' ? parseFloat(valorRaw) : null;

                btn.disabled = true;
                btn.innerText = 'Adicionando...';
                try {
                    await API.cadastrarPresente(nome, descricao, valor, imagemUrl);
                    formNovoPresente.reset();
                    alert('Presente adicionado com sucesso!');
                    carregarPresentes();
                } catch (err) {
                    alert(err.message || 'Erro ao adicionar presente.');
                } finally {
                    btn.disabled = false;
                    btn.innerText = '+';
                }
            });
        }

        // Delegação de eventos para a lista de presentes
        const container = document.getElementById('lista-presentes-noivos');
        if (container) {
            container.addEventListener('click', async (e) => {
                if (e.target.matches('.btn-editar-presente')) {
                    const id = e.target.getAttribute('data-presente-id');
                    const item = presentesCache.find(p => p.id === id);
                    if (!item) return;
                    abrirModalEdicao(item, async (pid, nome, descricao, valor, imgUrl) => {
                        await API.atualizarPresente(pid, nome, descricao, valor, imgUrl);
                        alert('Presente atualizado com sucesso!');
                        carregarPresentes();
                    });
                }

                if (e.target.matches('.btn-duplicar-presente')) {
                    const btn = e.target;
                    btn.disabled = true;
                    btn.innerText = 'Duplicando...';
                    try {
                        await API.duplicarPresente(btn.getAttribute('data-presente-id'));
                        alert('Presente duplicado com sucesso!');
                        carregarPresentes();
                    } catch (err) {
                        alert(err.message || 'Erro ao duplicar presente.');
                        btn.disabled = false;
                        btn.innerText = '📋 Duplicar';
                    }
                }

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
                        e.target.innerText = 'Enviar';
                    }
                }
            });
        }
    }, 100);

    function preencherPixConfig(config) {
        const set = (id, valor) => {
            const el = document.getElementById(id);
            if (el) el.value = valor || '';
        };
        set('pix-config-chave', config.chave_pix);
        set('pix-config-nome', config.nome_recebedor);
        set('pix-config-cidade', config.cidade);
        set('pix-config-mcc', config.mcc);
        set('pix-config-txid', config.txid);
    }

    async function carregarPresentes() {
        const container = document.getElementById('lista-presentes-noivos');
        if (!container) return;

        try {
            const dados = await API.getPainelNoivosPresentes();
            const presentes = dados.presentes || [];
            presentesCache = presentes;

            preencherPixConfig(dados.pix_config || {});

            if (presentes.length === 0) {
                container.innerHTML = '<div class="text-muted">Nenhum presente cadastrado ainda.</div>';
                return;
            }

            const disponiveis = presentes.filter(p => !p.reservado);
            const reservados = presentes.filter(p => p.reservado);

            const montarCard = (item) => {
                const mensagens = (item.mensagens || []).map(m => `
                    <div class="border rounded p-2 mb-1 bg-light small">
                        <div class="text-muted" style="font-size:0.75rem;">${m.criado_em}</div>
                        ${m.mensagem}
                    </div>
                `).join('');

                const badgeStatus = item.recebido
                    ? '<span class="badge bg-success">Recebido ✓</span>'
                    : (item.reservado
                        ? '<span class="badge bg-warning text-dark">Aguardando Recebimento</span>'
                        : '<span class="badge bg-secondary">Disponível</span>');

                const btnRecebido = item.reservado && !item.recebido
                    ? `<button class="btn btn-success btn-sm btn-confirmar-recebido text-nowrap" data-presente-id="${item.id}">Confirmar Recebimento</button>`
                    : '';

                const areaConversa = item.reservado ? `
                    <div class="mt-3 border-top pt-3">
                        <strong class="small d-block mb-1">Conversa:</strong>
                        ${mensagens || '<div class="text-muted small">Nenhuma mensagem ainda.</div>'}
                        <div class="d-flex gap-2 mt-2">
                            <textarea class="form-control form-control-sm" data-presente-msg="${item.id}" rows="2" placeholder="Escreva uma mensagem para ${item.comprador ? item.comprador.name : 'o convidado'}..."></textarea>
                            <button class="btn btn-casamento btn-sm btn-enviar-msg text-nowrap" data-presente-id="${item.id}">Enviar</button>
                        </div>
                    </div>` : '';

                const thumbHtml = item.imagem_url
                    ? `<img src="${item.imagem_url}" alt="${item.nome}" class="rounded me-3 flex-shrink-0" style="width: 55px; height: 55px; object-fit: cover;" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<div class=\'rounded me-3 flex-shrink-0 bg-light d-flex align-items-center justify-content-center\' style=\'width: 55px; height: 55px;\'><span class=\'fs-5\'>🎁</span></div>';">`
                    : `<div class="rounded me-3 flex-shrink-0 bg-light d-flex align-items-center justify-content-center" style="width: 55px; height: 55px;"><span class="fs-5">🎁</span></div>`;

                return `
                    <div class="card mb-3 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
                                <div class="d-flex align-items-center">
                                    ${thumbHtml}
                                    <div>
                                        <h6 class="mb-1">${item.nome} <span class="text-muted fw-normal">(${item.valor_formatado})</span></h6>
                                        ${item.descricao ? `<small class="text-muted d-block">${item.descricao}</small>` : ''}
                                        <small class="text-muted">${item.reservado ? `Doador: ${item.comprador ? item.comprador.name : '—'}` : 'Aguardando presenteação'}</small>
                                    </div>
                                </div>
                                <div class="d-flex gap-2 align-items-center flex-wrap">
                                    ${badgeStatus}
                                    ${btnRecebido}
                                    <button class="btn btn-outline-primary btn-sm btn-editar-presente text-nowrap" data-presente-id="${item.id}">✏️ Editar</button>
                                    <button class="btn btn-outline-secondary btn-sm btn-duplicar-presente text-nowrap" data-presente-id="${item.id}">📋 Duplicar</button>
                                </div>
                            </div>
                            ${areaConversa}
                        </div>
                    </div>
                `;
            };

            container.innerHTML = `
                ${disponiveis.length ? `
                    <div class="d-flex align-items-center justify-content-between mb-2">
                        <h6 class="mb-0">Disponíveis (${disponiveis.length})</h6>
                    </div>
                    ${disponiveis.map(montarCard).join('')}
                ` : ''}
                ${reservados.length ? `
                    <div class="d-flex align-items-center justify-content-between mb-2 mt-4">
                        <h6 class="mb-0">Reservados (${reservados.length})</h6>
                    </div>
                    ${reservados.map(montarCard).join('')}
                ` : ''}
            `;
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

            <div class="mb-4 p-3 border rounded bg-light">
                <h5 class="mb-2">💳 Configuração do PIX</h5>
                <p class="text-muted small mb-3">Dados usados para gerar o QR Code PIX quando um convidado presenteia. A chave, o nome do recebedor e a cidade são incluídos no payload emitido aos convidados.</p>
                <form id="form-pix-config" class="row g-2 align-items-end">
                    <div class="col-md-4">
                        <label class="form-label small mb-1">Chave PIX *</label>
                        <input type="text" id="pix-config-chave" class="form-control" required maxlength="255" placeholder="Ex: noivos@casamento.com.br">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small mb-1">Nome do Recebedor *</label>
                        <input type="text" id="pix-config-nome" class="form-control" required maxlength="25" placeholder="Ex: Lucas e Amanda">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label small mb-1">Cidade *</label>
                        <input type="text" id="pix-config-cidade" class="form-control" required maxlength="15" placeholder="Ex: SAO PAULO">
                    </div>
                    <div class="col-md-1">
                        <label class="form-label small mb-1">MCC</label>
                        <input type="text" id="pix-config-mcc" class="form-control" maxlength="4" placeholder="0000">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label small mb-1">TXID</label>
                        <input type="text" id="pix-config-txid" class="form-control" maxlength="25" placeholder="***">
                    </div>
                    <div class="col-12 d-grid d-md-flex">
                        <button type="submit" class="btn btn-casamento">Salvar Configuração</button>
                    </div>
                </form>
            </div>

            <div class="mb-4">
                <h5 class="mb-3">Adicionar Novo Presente</h5>
                <form id="form-novo-presente" class="row g-2 align-items-end">
                    <div class="col-md-3">
                        <label class="form-label small mb-1">Nome do Presente *</label>
                        <input type="text" id="novo-presente-nome" class="form-control" required maxlength="255" placeholder="Ex: Jogo de Panelas">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label small mb-1">Valor (R$)</label>
                        <input type="text" id="novo-presente-valor" class="form-control" inputmode="decimal" placeholder="Ex: 250,00">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small mb-1">Link da Imagem (URL)</label>
                        <input type="url" id="novo-presente-imagem" class="form-control" placeholder="https://.../foto.jpg">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small mb-1">Descrição (opcional)</label>
                        <input type="text" id="novo-presente-descricao" class="form-control" maxlength="500" placeholder="Ex: 5 peças antiaderentes">
                    </div>
                    <div class="col-md-1 d-grid">
                        <button type="submit" class="btn btn-casamento" title="Adicionar presente">+</button>
                    </div>
                </form>
            </div>

            <div>
                <h5 class="mb-3">Todos os Presentes</h5>
                <div id="lista-presentes-noivos"></div>
            </div>
        </div>
    `;
}

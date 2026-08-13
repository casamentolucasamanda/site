import { API } from '../api.js';

// Abre o modal de edição do convidado selecionado
function abrirModalEdicao(convidado, aoSalvar) {
    let modalEl = document.getElementById('modal-editar-convidado');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'modal-editar-convidado';
        modalEl.className = 'modal fade';
        modalEl.tabIndex = -1;
        document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px;">
                <div class="modal-header border-0 pb-0 position-relative">
                    <h5 class="modal-title serif-font fw-bold text-success">✏️ Editar Convidado</h5>
                    <button type="button" class="btn-close position-absolute end-0 me-3" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <form id="form-editar-convidado">
                    <div class="modal-body p-4">
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Nome Completo *</label>
                            <input type="text" id="editar-convidado-nome" class="form-control" required maxlength="255" value="${convidado.name}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Usuário de Acesso *</label>
                            <input type="text" id="editar-convidado-username" class="form-control" required maxlength="255" value="${convidado.username}">
                            <div class="form-text small text-muted">Usado pelo convidado para entrar no site.</div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Nova Senha <span class="text-muted fw-normal">(deixe em branco para manter)</span></label>
                            <input type="password" id="editar-convidado-senha" class="form-control" minlength="6" autocomplete="new-password" placeholder="••••••">
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Função</label>
                            <select id="editar-convidado-role" class="form-select">
                                <option value="convidado" ${convidado.role === 'convidado' ? 'selected' : ''}>Convidado</option>
                                <option value="noivos" ${convidado.role === 'noivos' ? 'selected' : ''}>Noivos</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer border-0 justify-content-center pt-0 pb-4">
                        <button type="button" class="btn btn-outline-secondary px-4" data-bs-dismiss="modal">Cancelar</button>
                        <button type="submit" id="btn-salvar-convidado" class="btn btn-casamento px-4">Salvar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    document.getElementById('form-editar-convidado').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-salvar-convidado');
        const name = document.getElementById('editar-convidado-nome').value.trim();
        const username = document.getElementById('editar-convidado-username').value.trim();
        const senha = document.getElementById('editar-convidado-senha').value;
        const role = document.getElementById('editar-convidado-role').value;

        btn.disabled = true;
        btn.innerText = 'Salvando...';
        try {
            await aoSalvar(convidado.id, name, username, senha, role);
            bsModal.hide();
        } catch (err) {
            alert(err.message || 'Erro ao salvar convidado.');
            btn.disabled = false;
            btn.innerText = 'Salvar Alterações';
        }
    });
}

export default function ConvidadosView() {
    let convidadosCache = [];

    setTimeout(() => {
        carregarConvidados();

        // Formulário para os noivos cadastrarem um novo convidado
        const formNovoConvidado = document.getElementById('form-novo-convidado');
        if (formNovoConvidado) {
            formNovoConvidado.addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = formNovoConvidado.querySelector('button[type="submit"]');
                const name = document.getElementById('novo-convidado-nome').value.trim();
                const username = document.getElementById('novo-convidado-username').value.trim();
                const senha = document.getElementById('novo-convidado-senha').value;

                btn.disabled = true;
                btn.innerText = 'Cadastrando...';
                try {
                    await API.cadastrarConvidado(name, username, senha);
                    formNovoConvidado.reset();
                    alert('Convidado cadastrado com sucesso!');
                    carregarConvidados();
                } catch (err) {
                    alert(err.message || 'Erro ao cadastrar convidado.');
                } finally {
                    btn.disabled = false;
                    btn.innerText = '+';
                }
            });
        }

        // Delegação de eventos para a lista de convidados
        const container = document.getElementById('lista-convidados');
        if (container) {
            container.addEventListener('click', async (e) => {
                if (e.target.matches('.btn-editar-convidado')) {
                    const id = e.target.getAttribute('data-convidado-id');
                    const item = convidadosCache.find(c => c.id === id);
                    if (!item) return;
                    abrirModalEdicao(item, async (cid, name, username, senha, role) => {
                        await API.atualizarConvidado(cid, name, username, senha, role);
                        alert('Convidado atualizado com sucesso!');
                        carregarConvidados();
                    });
                }

                if (e.target.matches('.btn-excluir-convidado')) {
                    const id = e.target.getAttribute('data-convidado-id');
                    const item = convidadosCache.find(c => c.id === id);
                    if (!confirm(`Remover o convidado "${item ? item.name : ''}"?\nO acesso será encerrado e as presenças vinculadas serão apagadas.`)) return;

                    const btn = e.target;
                    btn.disabled = true;
                    btn.innerText = 'Excluindo...';
                    try {
                        await API.removerConvidado(id);
                        carregarConvidados();
                    } catch (err) {
                        alert(err.message || 'Erro ao remover convidado.');
                        btn.disabled = false;
                        btn.innerText = '🗑️ Excluir';
                    }
                }
            });
        }
    }, 100);

    function badgePresenca(p) {
        if (!p) return '<span class="badge bg-secondary">Sem resposta</span>';
        return p.confirmado
            ? `<span class="badge bg-success">Confirmado ✓${p.acompanhantes ? ` (+${p.acompanhantes})` : ''}</span>`
            : '<span class="badge bg-danger">Não comparecerá</span>';
    }

    async function carregarConvidados() {
        const container = document.getElementById('lista-convidados');
        if (!container) return;

        try {
            const convidados = await API.getConvidados();
            convidadosCache = convidados;

            if (convidados.length === 0) {
                container.innerHTML = '<div class="text-muted">Nenhum convidado cadastrado ainda.</div>';
                return;
            }

            container.innerHTML = convidados.map(item => `
                <div class="card mb-3 shadow-sm">
                    <div class="card-body">
                        <div class="d-flex flex-wrap justify-content-between align-items-start gap-2">
                            <div>
                                <h6 class="mb-1">${item.name}</h6>
                                <small class="text-muted d-block">Usuário: @${item.username}</small>
                                ${item.email ? `<small class="text-muted d-block">${item.email}</small>` : ''}
                                <small class="text-muted d-block">Presentes reservados: ${item.total_presentes}</small>
                            </div>
                            <div class="d-flex gap-2 align-items-center flex-wrap">
                                ${badgePresenca(item.presenca)}
                                <button class="btn btn-outline-primary btn-sm btn-editar-convidado text-nowrap" data-convidado-id="${item.id}">✏️ Editar</button>
                                <button class="btn btn-outline-danger btn-sm btn-excluir-convidado text-nowrap" data-convidado-id="${item.id}">🗑️ Excluir</button>
                            </div>
                        </div>
                        ${item.presenca && item.presenca.observacoes ? `<small class="text-muted d-block mt-2">📝 ${item.presenca.observacoes}</small>` : ''}
                    </div>
                </div>
            `).join('');
        } catch (err) {
            container.innerHTML = `<span class="text-danger">Erro ao carregar convidados: ${err.message}</span>`;
        }
    }

    return `
        <div class="card shadow-sm p-4 bg-white">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-4">
                <h2 class="text-success mb-0">Gerenciar Convidados</h2>
                <a class="btn btn-outline-secondary btn-sm" href="/dashboard" data-link>← Voltar ao Painel</a>
            </div>

            <div class="mb-4">
                <h5 class="mb-3">Adicionar Novo Convidado</h5>
                <form id="form-novo-convidado" class="row g-2 align-items-end">
                    <div class="col-md-4">
                        <label class="form-label small mb-1">Nome Completo *</label>
                        <input type="text" id="novo-convidado-nome" class="form-control" required maxlength="255" placeholder="Ex: Maria da Silva">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small mb-1">Usuário de Acesso *</label>
                        <input type="text" id="novo-convidado-username" class="form-control" required maxlength="255" placeholder="Ex: maria_silva">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label small mb-1">Senha * (mín. 6)</label>
                        <input type="password" id="novo-convidado-senha" class="form-control" required minlength="6" autocomplete="new-password">
                    </div>
                    <div class="col-md-2 d-grid">
                        <button type="submit" class="btn btn-casamento" title="Adicionar convidado">+</button>
                    </div>
                </form>
            </div>

            <div>
                <h5 class="mb-3">Convidados Cadastrados</h5>
                <div id="lista-convidados"></div>
            </div>
        </div>
    `;
}

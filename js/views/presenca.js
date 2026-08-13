import { API } from '../api.js';

export default async function PresencaView() {
    let presencaData = { ja_respondido: false, confirmado: null, observacoes: '' };

    try {
        presencaData = await API.getPresenca();
    } catch (err) {
        console.error('Erro ao carregar presença:', err);
    }

    setTimeout(() => {
        const form = document.getElementById('form-presenca');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const btnSubmit = form.querySelector('button[type="submit"]');
                btnSubmit.disabled = true;
                btnSubmit.innerText = 'Guardando resposta...';

                const confirmado = document.getElementById('confirmado-sim').checked;
                const observacoes = document.getElementById('observacoes').value;

                try {
                    const res = await API.confirmarPresenca(confirmado, observacoes);
                    
                    document.getElementById('app').innerHTML = `
                        <div class="row justify-content-center text-center">
                            <div class="col-md-6 card-casamento p-5">
                                <h2 class="serif-font ${confirmado ? 'text-success' : 'text-secondary'} mb-3">
                                    ${confirmado ? '✨ Presença Confirmada!' : '💌 Resposta Registrada'}
                                </h2>
                                <p class="lead text-muted fs-6 mb-4">${res.mensagem}</p>
                                ${observacoes ? `<p class="small text-muted border p-2 rounded bg-light">Sua observação: <em>"${observacoes}"</em></p>` : ''}
                                <div class="d-flex gap-2 justify-content-center mt-4">
                                    <a href="/presenca" data-link class="btn btn-outline-secondary rounded-pill px-4 btn-sm">Editar Resposta</a>
                                    <a href="/" data-link class="btn btn-casamento px-4 btn-sm">Voltar ao Início</a>
                                </div>
                            </div>
                        </div>
                    `;
                } catch (err) {
                    alert('Sua sessão expirou ou ocorreu um erro. Faça login novamente.');
                    window.history.pushState({}, '', '/login');
                    window.dispatchEvent(new Event('popstate'));
                }
            });
        }

        const btnRefazer = document.getElementById('btn-refazer-resposta');
        if (btnRefazer) {
            btnRefazer.addEventListener('click', () => {
                window.history.pushState({}, '', '/confirmar-presenca');
                window.dispatchEvent(new Event('popstate'));
            });
        }
    }, 50);

    if (presencaData.ja_respondido) {
        const statusText = presencaData.confirmado ? 'Presença Confirmada' : 'Ausência Registrada';
        const statusBadgeClass = presencaData.confirmado ? 'bg-success' : 'bg-secondary';

        return `
            <div class="row justify-content-center">
                <div class="col-md-6 card-casamento p-5 text-center">
                    <h3 class="serif-font mb-3">Confirmação de Presença</h3>
                    <p class="text-muted small mb-4">Você já respondeu à confirmação de presença para o grande dia.</p>
                    
                    <div class="p-4 border rounded-3 bg-white mb-4 shadow-sm">
                        <span class="badge ${statusBadgeClass} fs-6 px-3 py-2 rounded-pill mb-3">${statusText}</span>
                        ${presencaData.observacoes ? `<p class="text-muted mb-0 small"><strong>Sua observação:</strong> ${presencaData.observacoes}</p>` : ''}
                        ${presencaData.updated_at ? `<p class="text-muted small mt-2 mb-0" style="font-size: 0.8rem;">Registrado em ${presencaData.updated_at}</p>` : ''}
                    </div>

                    <form id="form-presenca" class="mt-4 text-start border-top pt-4">
                        <h5 class="serif-font mb-3 text-center">Deseja alterar sua resposta?</h5>
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Sua Presença</label>
                            <div class="d-flex gap-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="confirmado" id="confirmado-sim" value="1" ${presencaData.confirmado ? 'checked' : ''}>
                                    <label class="form-check-label" for="confirmado-sim">Sim, eu irei!</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="confirmado" id="confirmado-nao" value="0" ${!presencaData.confirmado ? 'checked' : ''}>
                                    <label class="form-check-label" for="confirmado-nao">Infelizmente não poderei ir</label>
                                </div>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label fw-semibold">Observações ou Restrições Alimentares (Opcional)</label>
                            <textarea id="observacoes" class="form-control" rows="2">${presencaData.observacoes || ''}</textarea>
                        </div>
                        <button type="submit" class="btn btn-casamento w-100 py-2">Atualizar Resposta</button>
                    </form>
                </div>
            </div>
        `;
    }

    return `
        <div class="row justify-content-center">
            <div class="col-md-6 card-casamento p-4">
                <h3 class="serif-font mb-3 text-center">Confirmar Presença</h3>
                <p class="text-center text-muted small mb-4">Confirme sua presença individual para celebrarmos juntos este momento especial.</p>
                
                <form id="form-presenca">
                    <div class="mb-4">
                        <label class="form-label fw-semibold d-block">Você comparecerá ao casamento?</label>
                        <div class="d-flex gap-4">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="confirmado" id="confirmado-sim" value="1" checked>
                                <label class="form-check-label fw-medium" for="confirmado-sim">Sim, com certeza!</label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="confirmado" id="confirmado-nao" value="0">
                                <label class="form-check-label text-muted" for="confirmado-nao">Infelizmente não poderei ir</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="form-label fw-semibold">Observações ou Restrições (Opcional)</label>
                        <textarea id="observacoes" class="form-control" rows="3" placeholder="Ex: Intolerância a lactose, alergias, recado para os noivos..."></textarea>
                    </div>
                    
                    <button type="submit" class="btn btn-casamento w-100 py-2 mt-2">Salvar Minha Resposta</button>
                </form>
            </div>
        </div>
    `;
}

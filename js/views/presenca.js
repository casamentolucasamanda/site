import { API } from '../api.js';

export default function PresencaView() {
    // Escuta o evento após o HTML ser desenhado na tela
    setTimeout(() => {
        const form = document.getElementById('form-presenca');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const btnSubmit = form.querySelector('button[type="submit"]');
            btnSubmit.disabled = true;
            btnSubmit.innerText = 'Confirmando...';

            const acompanhantes = document.getElementById('acompanhantes').value;
            const observacoes = document.getElementById('observacoes').value;

            try {
                await API.confirmarPresenca(acompanhantes, observacoes);
                
                // Mensagem de sucesso visual usando Bootstrap
                document.getElementById('app').innerHTML = `
                    <div class="row justify-content-center text-center">
                        <div class="col-md-6 card-casamento p-5">
                            <h2 class="text-success mb-3">✨ Presença Confirmada!</h2>
                            <p class="lead">Obrigado por confirmar. Lucas e Amanda aguardam você com muito carinho!</p>
                            <a href="/" data-link class="btn btn-casamento mt-3 px-4">Voltar para o início</a>
                        </div>
                    </div>
                `;
            } catch (err) {
                alert('Sua sessão expirou ou ocorreu um erro. Por favor, faça login novamente.');
                window.history.pushState({}, '', '/login');
                window.dispatchEvent(new Event('popstate'));
            }
        });
    }, 50);

    return `
        <div class="row justify-content-center">
            <div class="col-md-6 card-casamento p-4">
                <h3 class="mb-3 text-center" style="font-family: Georgia, serif;">Confirmar Presença</h3>
                <p class="text-center text-muted small mb-4">Confirme sua presença e de seus acompanhantes para o grande dia.</p>
                
                <form id="form-presenca">
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Quantidade de Acompanhantes</label>
                        <select id="acompanhantes" class="form-select" required>
                            <option value="0">Apenas eu (0 acompanhantes)</option>
                            <option value="1">1 Acompanhante</option>
                            <option value="2">2 Acompanhantes</option>
                            <option value="3">3 Acompanhantes</option>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label fw-semibold">Observações ou Restrições (Opcional)</label>
                        <textarea id="observacoes" class="form-control" rows="3" placeholder="Ex: Intolerância a glúten, alergias, etc..."></textarea>
                    </div>
                    
                    <button type="submit" class="btn btn-casamento w-100 py-2 mt-2">Confirmar Minha Presença</button>
                </form>
            </div>
        </div>
    `;
}

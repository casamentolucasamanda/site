export default function LocalView() {
    return `
        <div class="row justify-content-center">
            <div class="col-md-8 card-casamento p-4">
                <h3 class="mb-3 text-center">Local da Recepção</h3>
                <p class="text-center text-muted">A nossa comemoração acontecerá em um espaço reservado e aconchegante:</p>
                <div class="border rounded p-3 bg-white mb-4 text-center">
                    <h5>Espaço Jardim dos Sonhos</h5>
                    <p class="mb-1 text-muted">Avenida das Flores, nº 1500 - Bairro Primavera</p>
                    <p class="text-muted small">Cidade do Casamento - UF</p>
                </div>
                <div class="ratio ratio-21x9 bg-light rounded border text-center d-flex align-items-center justify-content-center text-muted">
                    <span>[ Mapa do Google Maps Incorporado via Iframe aqui ]</span>
                </div>
            </div>
        </div>
    `;
}

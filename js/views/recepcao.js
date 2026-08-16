import { API } from '../api.js';

const recepcao = {
    tipo: '',
    horario: '',
    nome: '',
    endereco: '',
    cidadeUf: '',
    mapsUrl: '',
    mapaIframe: ''
};

export default async function RecepcaoView() {

    try {
        const localData = await API.getLocal('RECEPCAO');
        if (localData && localData.nome) {
            recepcao.nome = localData.nome || recepcao.nome;
            recepcao.endereco = localData.endereco || recepcao.endereco;
            recepcao.cidadeUf = localData.cidade_uf || recepcao.cidadeUf;
            if (localData.horario) recepcao.horario = localData.horario;
            const enderecoCompleto = [localData.endereco, localData.cidade_uf].filter(Boolean).join(', ');
            if (enderecoCompleto) recepcao.mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(enderecoCompleto)}`;
            if (localData.mapa_iframe) recepcao.mapaIframe = localData.mapa_iframe;
        }
    } catch (error) {
        console.log('Exibindo informações padrão da recepção.');
    }

    return `
        <div class="row justify-content-center">
            <div class="col-md-9 col-lg-8 card-casamento p-4 p-md-5 text-center">
                <div class="mb-4">
                    <img src="/images/icone-recepcao.png" alt="Recepção" class="badge-icon-local mb-3" style="height: 52px; filter: invert(31%) sepia(26%) saturate(1061%) hue-rotate(95deg) brightness(96%) contrast(92%);">
                    <h2 class="serif-font mb-2">Recepção dos Noivos</h2>
                    <p class="text-muted">Após a cerimônia civil, venha comemorar conosco! Confira abaixo a localização da recepção:</p>
                </div>

                <div class="border rounded-3 p-4 bg-white mb-4 shadow-sm text-center">
                    <div class="d-flex justify-content-center gap-2 mb-3">
                        <span class="badge bg-light text-dark border px-3 py-2 rounded-pill fs-6">${recepcao.tipo}</span>
                        <span class="badge bg-success text-white px-3 py-2 rounded-pill fs-6 fw-semibold">⏰ Horário: ${recepcao.horario}</span>
                    </div>

                    <h3 class="serif-font fw-bold text-success mb-2">${recepcao.nome}</h3>
                    <p class="mb-1 text-dark fs-5 fw-medium">${recepcao.endereco}</p>
                    <p class="text-muted small mb-3">${recepcao.cidadeUf}</p>
                    
                    <a href="${recepcao.mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success rounded-pill px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2">
                        <img src="/images/icone-local.png" alt="Local" class="badge-icon-verde"> Abrir no Google Maps
                    </a>
                </div>

                <div class="ratio ratio-16x9 bg-light rounded border overflow-hidden shadow-sm mb-4">
                    ${recepcao.mapaIframe}
                </div>

                <div class="d-flex justify-content-center gap-3 flex-wrap mt-4">
                    <a href="/cerimonia" data-link class="btn btn-outline-secondary rounded-pill px-4 py-2 d-inline-flex align-items-center gap-2">Ver Cerimônia Civil <img src="/images/icone-local.png" alt="Cerimônia" class="badge-icon-verde"></a>
                    <a href="/" data-link class="btn btn-casamento px-4 py-2">Voltar ao Início</a>
                </div>
            </div>
        </div>
    `;
}

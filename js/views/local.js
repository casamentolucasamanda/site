import { API } from '../api.js';

const cerimonia = {
    horario: '',
    nome: '',
    endereco: '',
    cidadeUf: '',
    mapsUrl: '',
    mapaIframe: ''
};

const recepcao = {
    horario: '',
    nome: '',
    endereco: '',
    cidadeUf: '',
    mapsUrl: '',
    mapaIframe: ''
};

function buildMapsUrl(endereco, cidadeUf) {
    const enderecoCompleto = [endereco, cidadeUf].filter(Boolean).join(', ');
    return enderecoCompleto ? `https://maps.google.com/maps?q=${encodeURIComponent(enderecoCompleto)}` : 'https://maps.google.com';
}

export default async function LocalView() {

    try {
        const locais = await API.getLocal();

        const cerimoniaData = locais.find(l => l.tipo === 'CERIMONIA');
        const recepcaoData = locais.find(l => l.tipo === 'RECEPCAO');

        if (cerimoniaData && cerimoniaData.nome) {
            cerimonia.nome = cerimoniaData.nome || cerimonia.nome;
            cerimonia.endereco = cerimoniaData.endereco || cerimonia.endereco;
            cerimonia.cidadeUf = cerimoniaData.cidade_uf || cerimonia.cidadeUf;
            cerimonia.mapsUrl = buildMapsUrl(cerimoniaData.endereco, cerimoniaData.cidade_uf);
            if (cerimoniaData.mapa_iframe) cerimonia.mapaIframe = cerimoniaData.mapa_iframe;
        }

        if (recepcaoData && recepcaoData.nome) {
            recepcao.nome = recepcaoData.nome || recepcao.nome;
            recepcao.endereco = recepcaoData.endereco || recepcao.endereco;
            recepcao.cidadeUf = recepcaoData.cidade_uf || recepcao.cidadeUf;
            recepcao.mapsUrl = buildMapsUrl(recepcaoData.endereco, recepcaoData.cidade_uf);
            if (recepcaoData.mapa_iframe) recepcao.mapaIframe = recepcaoData.mapa_iframe;
        }
    } catch (error) {
        console.log('Exibindo informações dos locais do casamento.');
    }

    return `
        <div class="row justify-content-center">
            <div class="col-12 text-center mb-4">
                <h2 class="serif-font display-6">Locais do Casamento</h2>
                
            </div>

            <!-- Card Cerimônia Civil -->
            <div class="col-lg-6 mb-4">
                <div class="card-casamento h-100 p-4 p-md-4 text-center d-flex flex-column justify-content-between">
                    <div>
                        <div class="mb-3">
                            <img src="/images/icone-local.png" alt="Cerimônia" class="badge-icon-local mb-2" style="height: 46px; filter: invert(31%) sepia(26%) saturate(1061%) hue-rotate(95deg) brightness(96%) contrast(92%);">
                            <h3 class="serif-font fw-bold text-success h4 mb-1">Cerimônia Civil</h3>
                            <div class="d-flex justify-content-center gap-2 mt-2">
                                <span class="badge bg-light text-dark border px-3 py-1 rounded-pill">Cartório</span>
                                <span class="badge bg-success text-white px-3 py-1 rounded-pill fw-semibold">⏰ ${cerimonia.horario}</span>
                            </div>
                        </div>

                        <div class="border rounded-3 p-3 bg-white mb-3 shadow-sm text-center">
                            <h4 class="fs-6 fw-bold text-dark mb-1">${cerimonia.nome}</h4>
                            <p class="mb-1 text-secondary small">${cerimonia.endereco}</p>
                            <p class="text-muted extra-small mb-2">${cerimonia.cidadeUf}</p>
                            
                            <a href="${cerimonia.mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-success rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1">
                                <img src="/images/icone-local.png" alt="Local" class="badge-icon-verde"> Abrir no Google Maps
                            </a>
                        </div>
                    </div>

                    <div class="ratio ratio-16x9 bg-light rounded border overflow-hidden shadow-sm">
                        ${cerimonia.mapaIframe}
                    </div>
                </div>
            </div>

            <!-- Card Recepção -->
            <div class="col-lg-6 mb-4">
                <div class="card-casamento h-100 p-4 p-md-4 text-center d-flex flex-column justify-content-between">
                    <div>
                        <div class="mb-3">
                            <img src="/images/icone-recepcao.png" alt="Recepção" class="badge-icon-local mb-2" style="height: 46px; filter: invert(31%) sepia(26%) saturate(1061%) hue-rotate(95deg) brightness(96%) contrast(92%);">
                            <h3 class="serif-font fw-bold text-success h4 mb-1">Recepção</h3>
                            <div class="d-flex justify-content-center gap-2 mt-2">
                                <span class="badge bg-light text-dark border px-3 py-1 rounded-pill">Salão de Festas</span>
                                <span class="badge bg-success text-white px-3 py-1 rounded-pill fw-semibold">⏰ ${recepcao.horario}</span>
                            </div>
                        </div>

                        <div class="border rounded-3 p-3 bg-white mb-3 shadow-sm text-center">
                            <h4 class="fs-6 fw-bold text-dark mb-1">${recepcao.nome}</h4>
                            <p class="mb-1 text-secondary small">${recepcao.endereco}</p>
                            <p class="text-muted extra-small mb-2">${recepcao.cidadeUf}</p>
                            
                            <a href="${recepcao.mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-success rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1">
                                <img src="/images/icone-local.png" alt="Local" class="badge-icon-verde"> Abrir no Google Maps
                            </a>
                        </div>
                    </div>

                    <div class="ratio ratio-16x9 bg-light rounded border overflow-hidden shadow-sm">
                        ${recepcao.mapaIframe}
                    </div>
                </div>
            </div>

            <div class="col-12 text-center mt-3">
                <a href="/" data-link class="btn btn-casamento px-4 py-2">Voltar ao Início</a>
            </div>
        </div>
    `;
}
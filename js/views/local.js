import { API } from '../api.js';

export default async function LocalView() {
    try {
        // Busca os dados dinâmicos do backend
        const localData = await API.getLocal();

        // Extrai as variáveis retornadas do backend (com fallbacks de segurança)
        const nome = localData.nome || 'Espaço a definir';
        const endereco = localData.endereco || '';
        const cidadeUf = localData.cidade_uf || '';
        const mapaIframe = localData.mapa_iframe || '';

        return `
            <div class="row justify-content-center">
                <div class="col-md-8 card-casamento p-4">
                    <h3 class="mb-3 text-center">Local da Recepção</h3>
                    <p class="text-center text-muted">A nossa comemoração acontecerá em um espaço reservado e aconchegante:</p>
                    <div class="border rounded p-3 bg-white mb-4 text-center">
                        <h5>${nome}</h5>
                        <p class="mb-1 text-muted">${endereco}</p>
                        <p class="text-muted small">${cidadeUf}</p>
                    </div>
                    <div class="ratio ratio-21x9 bg-light rounded border text-center d-flex align-items-center justify-content-center text-muted">
                        ${mapaIframe ? mapaIframe : '<span>[ Mapa indisponível ]</span>'}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Erro no LocalView:', error);
        return `
            <div class="row justify-content-center">
                <div class="col-md-8 card-casamento p-4 text-center">
                    <h3 class="mb-3">Local da Recepção</h3>
                    <div class="alert alert-danger" role="alert">
                        Não foi possível carregar as informações do local no momento. Tente novamente mais tarde.
                    </div>
                </div>
            </div>
        `;
    }
}
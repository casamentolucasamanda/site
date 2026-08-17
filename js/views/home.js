// Garante o dia 01 de Outubro de 2026 (casamento)
function proximaDataCasamento() {
    const agora = new Date();
    let alvo = new Date(2026, 9, 1, 0, 0, 0);
    if (agora > alvo) {
        alvo = new Date(agora.getFullYear() + 1, 9, 1, 0, 0, 0);
    }
    return alvo;
}

// Atualiza o contador regressivo exibido na home
function iniciarCountdown() {
    const container = document.getElementById('countdown');
    if (!container) return;

    const atualizar = () => {
        const agora = new Date();
        const alvo = proximaDataCasamento();
        const dif = Math.max(0, alvo - agora);

        const dias = Math.floor(dif / 86400000);
        const horas = Math.floor((dif % 86400000) / 3600000);
        const minutos = Math.floor((dif % 3600000) / 60000);
        const segundos = Math.floor((dif % 60000) / 1000);

        container.innerHTML = `
            <div class="countdown-item">
                <span class="countdown-numero">${dias}</span>
                <span class="countdown-rotulo">Dias</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-numero">${horas}</span>
                <span class="countdown-rotulo">Horas</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-numero">${minutos}</span>
                <span class="countdown-rotulo">Minutos</span>
            </div>
            <div class="countdown-item">
                <span class="countdown-numero">${segundos}</span>
                <span class="countdown-rotulo">Segundos</span>
            </div>
        `;
    };

    atualizar();
    setInterval(atualizar, 1000);
}

export default function HomeView() {
    setTimeout(iniciarCountdown, 100);

    return `
        <div class="row justify-content-center text-center">
            <div class="col-lg-9">
                <div class="card-casamento p-5 home-hero">
                    <p class="home-eyebrow mb-2">Com imensa alegria, convidamos você para celebrar o nosso casamento</p>
                    <h1 class="display-4 mb-1 serif-font">Amanda & Lucas</h1>
                    <div class="brand-cursive mb-3">Vamos nos casar!</div>

                    <div class="d-flex justify-content-center align-items-center gap-3 my-3">
                        <span class="divider-dourado-home"></span>
                        <span class="fs-5 fw-semibold text-uppercase text-secondary" style="letter-spacing: 3px;">01 de Outubro de 2026</span>
                        <span class="divider-dourado-home"></span>
                    </div>

                    <div id="countdown" class="countdown d-flex justify-content-center align-items-center my-4"></div>

                    <div class="d-flex justify-content-center gap-2 my-4 flex-wrap align-items-center">
                        <a href="/cerimonia" data-link class="badge badge-verde badge-link p-2 px-3 m-1 d-inline-flex align-items-center gap-2 text-decoration-none">
                            <img src="https://casamentolucasamanda.github.io/site/images/icone-local.png" alt="Cerimônia" class="badge-icon-local">
                            <span>Cerimônia Civil (11h)</span>
                        </a>
                        <a href="/recepcao" data-link class="badge badge-verde badge-link p-2 px-3 m-1 d-inline-flex align-items-center gap-2 text-decoration-none">
                            <img src="https://casamentolucasamanda.github.io/site/images/icone-recepcao.png" alt="Recepção" class="badge-icon-local">
                            <span>Recepção (12h30)</span>
                        </a>
                    </div>

                    <hr class="my-4" style="opacity: 0.1;">
                    <p class="mb-4 text-muted">Faça login com os dados do seu convite para confirmar sua presença, acessar a lista de presentes e conferir todos os detalhes da festa.</p>
                    <div class="d-grid gap-3 d-sm-flex justify-content-sm-center">
                        <a href="/login" class="btn btn-casamento btn-lg px-4" data-link>Acessar Área Restrita</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

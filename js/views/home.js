// Garante o próximo dia 17 de Outubro (casamento) a partir de hoje
function proximaDataCasamento() {
    const agora = new Date();
    let alvo = new Date(agora.getFullYear(), 9, 17, 0, 0, 0);
    if (agora > alvo) {
        alvo = new Date(agora.getFullYear() + 1, 9, 17, 0, 0, 0);
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
                    <p class="home-eyebrow mb-2">Com imensa alegria, convidamos você a celebrar conosco</p>
                    <h1 class="display-4 mb-1 serif-font">Lucas & Amanda</h1>
                    <div class="brand-cursive mb-3">estamos nos casando!</div>

                    <div class="d-flex justify-content-center align-items-center gap-3 my-3">
                        <span class="divider-dourado-home"></span>
                        <span class="fs-5 fw-semibold text-uppercase text-secondary" style="letter-spacing: 3px;">17 de Outubro</span>
                        <span class="divider-dourado-home"></span>
                    </div>

                    <p class="lead fs-6 text-muted mx-auto mb-4 home-mensagem">
                        "Que o nosso amor seja como um jardim que floresce a cada estação: regado
                        com carinho, cuidado com paciência e iluminado pela bênção de Deus. Este é
                        um dos dias mais felizes das nossas vidas, e não seria completo sem a
                        presença de pessoas tão queridas. Vem celebrar esse momento com a gente!"
                    </p>

                    <div id="countdown" class="countdown d-flex justify-content-center align-items-center my-4"></div>

                    <div class="d-flex justify-content-center gap-2 my-4 flex-wrap">
                        <span class="badge bg-secondary p-2 px-3 m-1">💒 Cerimônia & Recepção</span>
                        <span class="badge bg-secondary p-2 px-3 m-1">📍 Recepção Privada</span>
                        <span class="badge bg-secondary p-2 px-3 m-1">⏰ A partir das 19h</span>
                    </div>

                    <hr class="my-4" style="opacity: 0.1;">
                    <p class="mb-4 text-muted">Para acessar a lista de presentes, confirmar presença e conferir o endereço do local, faça login com os dados enviados no seu convite.</p>
                    <div class="d-grid gap-3 d-sm-flex justify-content-sm-center">
                        <a href="/login" class="btn btn-casamento btn-lg px-4" data-link>Acessar Área Restrita</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

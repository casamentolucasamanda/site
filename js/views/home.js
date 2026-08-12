export default function HomeView() {
    return `
        <div class="row justify-content-center text-center">
            <div class="col-md-8 card-casamento p-5">
                <h1 class="display-4 mb-3" style="font-family: Georgia, serif;">Lucas & Amanda</h1>
                <p class="lead fs-4">Sejam bem-vindos ao nosso site de casamento!</p>
                <div class="my-4">
                    <span class="badge bg-secondary p-2 px-3 m-1">📅 17 de Outubro</span>
                    <span class="badge bg-secondary p-2 px-3 m-1">📍 Recepção Privada</span>
                </div>
                <hr class="my-4" style="opacity: 0.1;">
                <p class="mb-4 text-muted">Para acessar a lista de presentes, confirmação de presença e endereço do local, por favor faça login com seus dados de convidado.</p>
                <div class="d-grid gap-3 d-sm-flex justify-content-sm-center">
                    <a href="/login" class="btn btn-casamento btn-lg px-4" data-link>Acessar Área Restrita</a>
                </div>
            </div>
        </div>
    `;
}

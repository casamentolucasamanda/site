import { API } from '../api.js';

function abrirModalPix(dados) {
    let modalEl = document.getElementById('modal-pix');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'modal-pix';
        modalEl.className = 'modal fade';
        modalEl.tabIndex = -1;
        document.body.appendChild(modalEl);
    }

    modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg" style="border-radius: 20px;">
                <div class="modal-header border-0 pb-0 text-center position-relative">
                    <h5 class="modal-title w-100 serif-font fw-bold text-success">🎁 Pagamento do Presente via PIX</h5>
                    <button type="button" class="btn-close position-absolute end-0 me-3" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body text-center p-4">
                    <p class="text-muted mb-1 fs-6">Você reservou:</p>
                    <h5 class="fw-bold text-dark mb-1">${dados.presente.nome}</h5>
                    <span class="badge bg-light text-dark border fs-6 px-3 py-2 rounded-pill mb-3">${dados.presente.valor}</span>
                    
                    <div class="my-3 p-3 bg-light rounded-3 d-inline-block border">
                        <div id="pix-qrcode"></div>
                    </div>

                    <div class="text-start mt-3">
                        <label class="form-label fw-semibold small text-muted">Chave PIX (E-mail):</label>
                        <input type="text" readonly class="form-control form-control-sm mb-3 bg-white" value="${dados.pix.chave}">
                        
                        <label class="form-label fw-semibold small text-muted">Código PIX Copia e Cola:</label>
                        <div class="input-group">
                            <textarea id="pix-copia-cola" readonly class="form-control form-control-sm bg-white" rows="2" style="font-size: 0.8rem;">${dados.pix.payload}</textarea>
                            <button id="btn-copiar-pix" class="btn btn-outline-secondary btn-sm px-3" type="button">Copiar</button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer border-0 justify-content-center pt-0 pb-4">
                    <button type="button" class="btn btn-casamento px-5" data-bs-dismiss="modal">Concluído</button>
                </div>
            </div>
        </div>
    `;

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    setTimeout(() => {
        const qrcodeEl = document.getElementById('pix-qrcode');
        if (qrcodeEl && typeof QRCode !== 'undefined') {
            qrcodeEl.innerHTML = '';
            new QRCode(qrcodeEl, {
                text: dados.pix.payload,
                width: 220,
                height: 220,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        }

        const btnCopiar = document.getElementById('btn-copiar-pix');
        const txtPix = document.getElementById('pix-copia-cola');
        if (btnCopiar && txtPix) {
            btnCopiar.addEventListener('click', () => {
                txtPix.select();
                navigator.clipboard.writeText(txtPix.value).then(() => {
                    btnCopiar.innerText = 'Copiado! ✓';
                    btnCopiar.classList.replace('btn-outline-secondary', 'btn-success');
                    setTimeout(() => {
                        btnCopiar.innerText = 'Copiar';
                        btnCopiar.classList.replace('btn-success', 'btn-outline-secondary');
                    }, 3000);
                });
            });
        }
    }, 100);
}
function crc16(payload) {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j++) {
      crc =
        crc & 0x8000
          ? ((crc << 1) ^ 0x1021)
          : (crc << 1);

      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function toPascalCase(str) {
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function gerarPix(chavePix, valor, nomeRecebedor, cidade, txid = '***') {
  const merchantAccount =
    "0014BR.GOV.BCB.PIX" +
    "01" +
    chavePix.length.toString().padStart(2, "0") +
    chavePix;

  const txidFormatado = toPascalCase(txid);
  const additionalData =
    "05" +
    txidFormatado.length.toString().padStart(2, "0") +
    txidFormatado;

  const valorFormatado = Number(valor).toFixed(2);

  const payloadSemCRC =
    "000201" +
    "26" +
    merchantAccount.length.toString().padStart(2, "0") +
    merchantAccount +
    "52040000" +
    "5303986" +
    "54" +
    valorFormatado.length.toString().padStart(2, "0") +
    valorFormatado +
    "5802BR" +
    "59" + nomeRecebedor.length.toString().padStart(2, "0") + nomeRecebedor +
    "60" + cidade.length.toString().padStart(2, "0") + cidade +
    "62" +
    additionalData.length.toString().padStart(2, "0") +
    additionalData +
    "6304";

  const crc = crc16(payloadSemCRC);

  return payloadSemCRC + crc;
}

export default async function PresentesView() {
    let presentes = [];
    let mensagens = [];
    try {
        const dados = await API.getPresentes();
        presentes = dados.presentes || [];
        mensagens = dados.mensagens || [];
    } catch (err) {
        console.error('Erro ao buscar lista de presentes:', err);
    }

    setTimeout(() => {
        const container = document.getElementById('lista-presentes-container');
        if (!container) return;

        container.addEventListener('click', async (e) => {
            if (e.target.matches('.btn-presentear')) {
                const btn = e.target;
                const presenteId = btn.getAttribute('data-id');
                
                const originalText = btn.innerText;
                btn.disabled = true;
                btn.innerText = 'Gerando PIX...';

                try {
                    const dados = await API.escolherPresente(presenteId);
                    
                    const valorNumerico = dados.presente.valor.replace(/[^\d,]/g, '').replace(',', '.');
                    dados.pix.payload = gerarPix(
                        dados.pix.chave,
                        valorNumerico,
                        'LUCAS GABRIEL',
                        'SAO PAULO',
                        dados.presente.nome
                    );
                    
                    // Atualiza visualmente o card
                    btn.classList.replace('btn-casamento', 'btn-success');
                    btn.innerText = '🎁 Ver QR Code PIX';
                    btn.disabled = false;
                    
                    // Abre a tela de pagamento por QR Code PIX
                    abrirModalPix(dados);

                } catch (err) {
                    alert(err.message || 'Sessão expirada. Faça login para escolher um presente.');
                    btn.disabled = false;
                    btn.innerText = originalText;
                }
            }
        });
    }, 50);

    const cardsHtml = presentes.length ? presentes.map(item => {
        let botaoHtml = '';
        if (item.reservado_por_mim) {
            botaoHtml = item.recebido
                ? `
                    <button class="btn btn-success btn-sm w-100" disabled>
                        🎁 Recebido com muito carinho!
                    </button>
                `
                : `
                    <button class="btn btn-success btn-sm w-100 btn-presentear" data-id="${item.id}">
                        🎁 Ver QR Code PIX
                    </button>
                `;
        } else if (item.reservado) {
            botaoHtml = `
                <button class="btn btn-secondary btn-sm w-100" disabled>
                    🔒 Reservado por ${item.comprador || 'um convidado'}
                </button>
            `;
        } else {
            botaoHtml = `
                <button class="btn btn-casamento btn-sm w-100 btn-presentear" data-id="${item.id}">
                    Presentear via PIX
                </button>
            `;
        }

        const imagemHtml = item.imagem_url 
            ? `<div class="position-relative overflow-hidden rounded mb-3" style="height: 180px;">
                    <img src="${item.imagem_url}" alt="${item.nome}" class="w-100 h-100" style="object-fit: cover;" referrerpolicy="no-referrer" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'p-3 bg-light rounded text-center text-muted d-flex align-items-center justify-content-center\' style=\'height: 140px;\'><span class=\'fs-1\'>🎁</span></div>';">
               </div>`
            : `<div class="p-3 bg-light rounded text-center mb-3 text-muted d-flex align-items-center justify-content-center" style="height: 140px;">
                    <span class="fs-1">🎁</span>
               </div>`;

        return `
            <div class="col-md-4 mb-4">
                <div class="card h-100 border-0 shadow-sm bg-white p-3 card-casamento">
                    ${imagemHtml}
                    <div class="card-body text-center d-flex flex-column justify-content-between p-2">
                        <div>
                            <h5 class="card-title serif-font fw-bold text-dark mb-2">${item.nome}</h5>
                            <p class="card-text text-muted small mb-3">${item.descricao || ''}</p>
                        </div>
                        <div>
                            <span class="d-block fw-bold text-dark fs-5 mb-3">${item.valor_formatado}</span>
                            ${botaoHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('') : `<div class="col-12 text-center text-muted"><p>Nenhum presente disponível no momento.</p></div>`;

    const mensagensHtml = mensagens.length ? `
        <div class="card-casamento p-4 mb-5">
            <h3 class="serif-font mb-4 text-center">💌 Mensagens dos Noivos</h3>
            ${mensagens.map(m => `
                <div class="border rounded p-3 mb-2 bg-white shadow-sm">
                    <div class="text-muted small mb-1">
                        ${m.criado_em}${m.presente ? ` · sobre o presente: <strong>${m.presente}</strong>` : ''}
                    </div>
                    ${m.mensagem}
                </div>
            `).join('')}
        </div>
    ` : '';

    return `
        <div class="card-casamento p-4">
            ${mensagensHtml}

            <h3 class="serif-font mb-2 text-center">Lista de Presentes Virtuais</h3>
            <p class="text-muted text-center mb-5 small">Sua presença é o nosso maior presente! Se desejar nos abençoar, escolha um item abaixo para contribuição via PIX.</p>
            
            <div id="lista-presentes-container" class="row g-3">
                ${cardsHtml}
            </div>
        </div>
    `;
}

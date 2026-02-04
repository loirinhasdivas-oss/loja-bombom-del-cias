let carrinho = JSON.parse(localStorage.getItem("bombom_carrinho")) || [];
let descontoCupom = 0;

// Adiciona item ao carrinho
function adicionarItem(nome, preco) {
    const item = carrinho.find(i => i.nome === nome);
    if (item) item.qtd++;
    else carrinho.push({ nome, preco, qtd: 1 });
    salvarESincronizar();
}

// Altera a quantidade (botões + e -)
function mudarQtd(nome, delta) {
    const item = carrinho.find(i => i.nome === nome);
    if (item) {
        item.qtd += delta;
        if (item.qtd <= 0) carrinho = carrinho.filter(i => i.nome !== nome);
    }
    salvarESincronizar();
}

// Salva no LocalStorage e atualiza a interface
function salvarESincronizar() {
    localStorage.setItem("bombom_carrinho", JSON.stringify(carrinho));
    atualizarTela();
}

// Atualiza o carrinho visual e os cálculos
function atualizarTela() {
    const lista = document.getElementById("lista-pedido");
    lista.innerHTML = "";
    let subtotal = 0;

    // Resetar badges (bolinhas de quantidade nas imagens)
    document.querySelectorAll(".badge").forEach(b => { b.style.visibility = "hidden"; });

    if (carrinho.length === 0) {
        lista.innerHTML = "<p style='text-align:center; color:#999'>Carrinho vazio...</p>";
    }

    carrinho.forEach(item => {
        subtotal += item.preco * item.qtd;
        
        // Atualizar Badge - Trata o ID para bater com o HTML (remove espaços e barras)
        const badgeId = `badge-${item.nome.replace(/\s+/g, '-').replace(/\//g, '-')}`;
        const badge = document.getElementById(badgeId);
        if (badge) {
            badge.innerText = item.qtd;
            badge.style.visibility = "visible";
        }

        lista.innerHTML += `
            <div class="cart-line">
                <span>${item.nome}</span>
                <div class="qty-btns">
                    <button onclick="event.stopPropagation(); mudarQtd('${item.nome}', -1)">-</button>
                    <b>${item.qtd}</b>
                    <button onclick="event.stopPropagation(); mudarQtd('${item.nome}', 1)">+</button>
                </div>
            </div>`;
    });

    // Cálculos de descontos (Pix 10% e Cupom Fixo)
    const descPix = document.getElementById("pagamento-metodo").value === "Pix" ? subtotal * 0.1 : 0;
    const total = subtotal - descontoCupom - descPix;

    document.getElementById("subtotal").innerText = subtotal.toFixed(2);
    document.getElementById("descontos").innerText = (descontoCupom + descPix).toFixed(2);
    document.getElementById("total").innerText = (total < 0 ? 0 : total).toFixed(2);
}

// Mostra/Esconde campo de troco se for dinheiro
function toggleTroco() {
    const pag = document.getElementById("pagamento-metodo").value;
    const campoTroco = document.getElementById("campo-troco");
    if(campoTroco) {
        campoTroco.classList.toggle("hidden", pag !== "Dinheiro");
    }
    atualizarTela();
}

// Aplica cupom DOCE10
function aplicarCupom() {
    const cupom = document.getElementById("cupom-input").value.toUpperCase();
    descontoCupom = (cupom === "DOCE10") ? 10 : 0;
    document.getElementById("msg-cupom").innerText = descontoCupom > 0 ? "Cupom OK!" : "Inválido";
    atualizarTela();
}

// Finaliza o pedido e gera a Nota Fiscal
function finalizarPedido() {
    const nome = document.getElementById("cliente-nome").value;
    const end = document.getElementById("cliente-endereco").value;
    const pag = document.getElementById("pagamento-metodo").value;
    const obs = document.getElementById("cliente-obs").value; // Nova linha: captura observação

    if (carrinho.length === 0 || !nome || !end || !pag) {
        alert("Preencha o Nome, Endereço e Pagamento!");
        return;
    }

    // Preencher Dados da Nota Fiscal
    document.getElementById("nf-nome").innerText = nome;
    document.getElementById("nf-endereco").innerText = end;
    document.getElementById("nf-pagamento").innerText = pag;
    
    // Mostra a observação na nota se existir
    const nfObs = document.getElementById("nf-obs");
    if(nfObs) nfObs.innerText = obs || "Nenhuma";

    const trocoVal = document.getElementById("troco-para").value;
    document.getElementById("nf-troco-txt").innerText = trocoVal ? `Troco para: R$ ${trocoVal}` : "";

    // LÓGICA WHILE (Gera a lista de itens na nota)
    let nfItens = document.getElementById("nf-itens");
    nfItens.innerHTML = "";
    let i = 0;
    while (i < carrinho.length) {
        let item = carrinho[i];
        nfItens.innerHTML += `
        <p style="display:flex; justify-content:space-between; margin: 5px 0;">
            <span>${item.nome} x${item.qtd}</span>
            <span>R$ ${(item.preco * item.qtd).toFixed(2)}</span>
        </p>`;
        i++;
    }

    // Preencher valores finais na nota
    document.getElementById("nf-subtotal").innerText = document.getElementById("subtotal").innerText;
    document.getElementById("nf-descontos").innerText = document.getElementById("descontos").innerText;
    document.getElementById("nf-total").innerText = document.getElementById("total").innerText;

    // Mostrar o Overlay da Nota
    document.getElementById("nota-fiscal-overlay").classList.remove("hidden");
}

// Fecha a nota e limpa o formulário/carrinho
function fecharNota() {
    document.getElementById("nota-fiscal-overlay").classList.add("hidden");
    
    // Resetar variáveis e campos
    carrinho = [];
    descontoCupom = 0;
    document.getElementById("cliente-nome").value = "";
    document.getElementById("cliente-endereco").value = "";
    document.getElementById("cliente-obs").value = ""; // Limpa observação
    document.getElementById("pagamento-metodo").value = "";
    document.getElementById("cupom-input").value = "";
    if(document.getElementById("troco-para")) document.getElementById("troco-para").value = "";
    
    document.getElementById("msg-cupom").innerText = "";
    
    salvarESincronizar();
}

// Inicializa a tela ao carregar
atualizarTela();
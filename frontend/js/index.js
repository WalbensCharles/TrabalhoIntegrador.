  // Configurações do Axios
axios.defaults.baseURL = "http://localhost:3000/";
axios.defaults.headers.common["Content-Type"] = "application/json;charset=utf-8";

//pagina inaicial usuarios

async function carregarProdutos() {
  const container = document.getElementById('produtos-lista');
  container.innerHTML = '<div class="col">Carregando produtos...</div>';
  try {
    const resp = await axios.get('/produtos');
    const produtos = resp.data;
    if (!produtos.length) {
      container.innerHTML = `
        <div class="col">
          <div class="alert alert-warning text-center">Nenhum produto cadastrado.</div>
        </div>
      `;
      return;
    }
    container.innerHTML = '';
    produtos.forEach(produto => {
      container.innerHTML += `
        <div class="col">
          <div class="card h-100">
            <img src="${produto.imagem}" class="card-img-top" alt="${produto.nome}">
            <div class="card-body">
              <h5 class="card-title">${produto.nome}</h5>
              <p class="card-text">${produto.descricao}</p>
              <p class="product-price">R$ ${Number(produto.preco).toFixed(2)}</p>
              <button class="buy-btn btn btn-primary w-100"
                      data-id="${produto.id}"
                      data-nome="${produto.nome}"
                      data-imagem="${produto.imagem}"
                      data-descricao="${produto.descricao}"
                      data-preco="${produto.preco}">
                Comprar
              </button>
            </div>
          </div>
        </div>
      `;
    });

    // Tratamento do evento de clique no botão Comprar
    document.querySelectorAll('.buy-btn').forEach(btn => {
      btn.onclick = function () {
        try {
          const usuarioLogado = localStorage.getItem('usuarioLogado') === 'true';
          const produto = {
            id: btn.dataset.id,
            nome: btn.dataset.nome,
            imagem: btn.dataset.imagem,
            descricao: btn.dataset.descricao,
            preco: btn.dataset.preco
          };
          localStorage.setItem('produtoCheckout', JSON.stringify(produto));
          if (usuarioLogado) {
            window.location.href = 'checkout.html';
          } else {
            window.location.href = 'login2.html?redirect=checkout';
          }
        } catch (erroBotao) {
          alert('Erro ao processar o pedido de compra. Tente novamente.');
        }
      };
    });

  } catch (err) {
    container.innerHTML = `
      <div class="col">
        <div class="alert alert-danger text-center">Erro ao carregar produtos. Tente atualizar a página.</div>
      </div>
    `;
    console.error('Erro ao buscar produtos:', err);
  }
}
window.onload = carregarProdutos;
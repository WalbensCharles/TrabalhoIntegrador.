$(function() {
  console.log("checkout.js carregado!");

  // Mostrar dados do produto selecionado
  var produtoCheckout = localStorage.getItem('produtoCheckout');
  if (produtoCheckout) {
    var produto = JSON.parse(produtoCheckout);
    $('#product-info').html(`
      <div class="card mb-3" style="max-width: 400px;">
        <div class="row g-0">
          <div class="col-md-4">
            <img src="${produto.imagem}" class="img-fluid rounded-start" alt="${produto.nome}">
          </div>
          <div class="col-md-8">
            <div class="card-body">
              <h5 class="card-title">${produto.nome}</h5>
              <p class="card-text">${produto.descricao}</p>
              <p class="card-text"><strong>R$ ${Number(produto.preco).toFixed(2)}</strong></p>
            </div>
          </div>
        </div>
      </div>
    `);
  } else {
    $('#product-info').html(`
      <div class="alert alert-warning text-center">Nenhum produto selecionado.</div>
    `);
    setTimeout(function() {
      window.location.href = 'index.html';
    }, 2000);
  }

  // Envio do formulário de checkout - só UM handler!
  $('#checkout-form').on('submit', async function(e) {
    e.preventDefault();

    // Dados do produto
    var produtoCheckout = localStorage.getItem('produtoCheckout');
    if (!produtoCheckout) return;

    var produto = JSON.parse(produtoCheckout);

    // Recupera dados do usuário logado
    var usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) {
      alert("Usuário não encontrado. Faça login novamente.");
      window.location.href = 'login2.html';
      return;
    }

    // Dados do formulário
    var endereco = $('#address').val();
    var preco = produto.preco;

    try {
      await axios.post('/checkout', {
        usuario_id: usuarioId,
        produto_id: produto.id,
        preco: preco,
        endereco: endereco
      });

      $('main').html(`
        <div class="alert alert-success mt-4 text-center">
          Compra realizada com sucesso!<br>
          Você será redirecionado para a página inicial em 3 segundos...
        </div>
      `);

      localStorage.removeItem('produtoCheckout');
      setTimeout(function() {
        window.location.href = 'index.html';
      }, 3000);

    } catch (err) {
      alert('Erro ao registrar o pedido: ' + (err.response?.data?.error || err.message));
    }
  });
});

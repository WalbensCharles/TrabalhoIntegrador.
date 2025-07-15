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
    return; // Não tenta registrar pedido se não tem produto
  }

  // Envio do formulário de checkout
  $('#checkout-form').on('submit', async function(e) {
    e.preventDefault();

    var produtoCheckout = localStorage.getItem('produtoCheckout');
    if (!produtoCheckout) return;

    var produto = JSON.parse(produtoCheckout);

    // O backend já pega o userId do token, não precisa enviar usuario_id no body!
    var endereco = $('#address').val();
    var preco = produto.preco;

    // Recupera token
    var token = localStorage.getItem('token');
    if (!token) {
      alert("Você precisa estar logado para finalizar a compra.");
      window.location.href = 'login2.html';
      return;
    }

    try {
      await axios.post('/checkout', {
        produto_id: produto.id,
        preco: preco,
        endereco: endereco
      }, {
        headers: { Authorization: "Bearer " + token }
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
      let msg = 'Erro ao registrar o pedido.';
      if (err.response && err.response.data && (err.response.data.error || err.response.data.mensagem)) {
        msg += ' ' + (err.response.data.error || err.response.data.mensagem);
      }
      alert(msg);
    }
  });
});

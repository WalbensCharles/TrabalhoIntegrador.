//axios

axios.defaults.baseURL = "http://localhost:3000/";
axios.defaults.headers.common["Content-Type"] = "application/json;charset=utf-8";

//verificar se é admin

const isAdminPage = window.location.pathname.includes('admin');

//cadastrar usuario

$(function() {
    if ($('#form-cadastrar').length) {
        $('#form-cadastrar').validate({
            rules: {
                nome: { required: true, minlength: 3, maxlength: 50 },
                email: { required: true, email: true, minlength: 3, maxlength: 50 },
                senha: { required: true, minlength: 6 },
                confirmarSenha: { required: true, equalTo: "#senha-register" }
            },
            messages: {
                nome: { required: 'Informe o nome', minlength: 'Nome deve conter pelo menos 3 caracteres.', maxlength: 'Nome deve conter no máximo 50 caracteres.' },
                email: { required: 'Informe o e-mail', email: 'E-mail inválido', minlength: 'E-mail deve conter pelo menos 3 caracteres.', maxlength: 'E-mail deve conter no máximo 50 caracteres.' },
                senha: { required: 'Informe a senha', minlength: 'A senha deve ter no mínimo 6 caracteres.' },
                confirmarSenha: { required: 'Confirme a senha', equalTo: 'As senhas não coincidem.' }
            },
            submitHandler: createAjaxPost
        });

        function createAjaxPost() {
            const nome = $('#nome').val();
            const email = $('#email-register').val();
            const senha = $('#senha-register').val();
            if (senha !== $('#senha-c-register').val()) {
                alert("As senhas não coincidem.");
                return;
            }
            axios.post('/register', { nome, email, senha })
                .then(function(response) {
                    alert("Cadastro bem-sucedido!");
                    const role = response.data.role;
                    if (role === "admin") {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                })
                .catch(function(error) {
                    const resposta = error.response?.data || {};
                    alert(resposta.mensagem || "Erro ao cadastrar usuário.");
                });
        }
    }
});

// função para decodificar JWT 
function parseJwt (token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}
//login
$(function() {
    $('#login-form').on('submit', function(event) {
        event.preventDefault();
        const email = $('#email').val();
        const senha = $('#senha').val();

        axios.post('/login', { email, senha })
            .then(function(response) {
                alert("Login bem-sucedido!");
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("usuarioLogado", "true");
                const role = response.data.role;

                // Tenta salvar o usuarioId da resposta do backend
                if (response.data.userId) {
                    localStorage.setItem("usuarioId", response.data.userId);
                } else {
                    // Se não veio do backend, extrai do JWT
                    const decoded = parseJwt(response.data.token);
                    if (decoded && decoded.userId) {
                        localStorage.setItem("usuarioId", decoded.userId);
                    }
                }

                if (role === "admin") {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            })
            .catch(function(error) {
                const resposta = error.response?.data || {};
                alert(resposta.mensagem || "Erro ao fazer login.");
            });
    });
});


//logout 

$(function() {
    // Exibir o botão  logout se estiver logado
    if (localStorage.getItem("usuarioLogado") === "true" || localStorage.getItem("token")) {
        $("#logout").show();
    } else {
        $("#logout").hide();
    }

    // Ao clicar no botão, faz logout
    $("#logout").on("click", function() {
        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem('token');
        alert("Logout realizado com sucesso!");
        window.location.href = 'login2.html';
    });
});

//interface admin e usuarios
//crud --read
function carregarProdutos() {
    const $container = $('#produtos-lista');
    if (!$container.length) return; // Protege páginas sem a div

    $container.html('<div class="col">Carregando produtos...</div>');
    axios.get('/produtos')
        .then(function(resp) {
            const produtos = resp.data;
            if (!produtos.length) {
                $container.html(`
                    <div class="col">
                        <div class="alert alert-warning text-center">Nenhum produto cadastrado.</div>
                    </div>
                `);
                return;
            }
            $container.html('');
            produtos.forEach(produto => {
                // Cria os botões conforme a página
                let acoesHtml = '';
                if (isAdminPage) {
                    acoesHtml = `
                        <div class="d-flex gap-2 mt-2">
                            <button class="btn btn-warning btn-editar w-50" data-id="${produto.id}">Editar</button>
                            <button class="btn btn-danger btn-remover w-50" data-id="${produto.id}">Deletar</button>
                        </div>
                    `;
                } else {
                    acoesHtml = `
                        <button class="buy-btn btn btn-primary w-100 mt-2"
                            data-id="${produto.id}"
                            data-nome="${produto.nome}"
                            data-imagem="${produto.imagem}"
                            data-descricao="${produto.descricao}"
                            data-preco="${produto.preco}">
                            Comprar
                        </button>
                    `;
                }

                $container.append(`
                    <div class="col">
                        <div class="card h-100">
                            <img src="${produto.imagem}" class="card-img-top" alt="${produto.nome}">
                            <div class="card-body">
                                <h5 class="card-title">${produto.nome}</h5>
                                <p class="card-text">${produto.descricao}</p>
                                <p class="product-price">R$ ${Number(produto.preco).toFixed(2)}</p>
                                ${acoesHtml}
                            </div>
                        </div>
                    </div>
                `);
            });

            //  editar/deletar
            if (isAdminPage) {
                $('.btn-editar').off('click').on('click', function() {
                    editarProdutoForm($(this).data('id'));
                });
                $('.btn-remover').off('click').on('click', function() {
                    removerProduto($(this).data('id'));
                });
            } else {

                // usuario comprar
                $('.buy-btn').off('click').on('click', function() {
                    try {
                        const usuarioLogado = localStorage.getItem('usuarioLogado') === 'true';
                        const produto = {
                            id: $(this).data('id'),
                            nome: $(this).data('nome'),
                            imagem: $(this).data('imagem'),
                            descricao: $(this).data('descricao'),
                            preco: $(this).data('preco')
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
                });
            }

        })
        .catch(function(err) {
            $container.html(`
                <div class="col">
                    <div class="alert alert-danger text-center">Erro ao carregar produtos. Tente atualizar a página.</div>
                </div>
            `);
            console.error('Erro ao buscar produtos:', err);
        });
}

// se existir  produtos carregar os produtos
$(function() {
    if ($('#produtos-lista').length) {
        carregarProdutos();
    }
});

//crud
$(function() {
    //criar  novo produtos  
    $('#novo-produto').on('submit', async function(e) {
        e.preventDefault();
        const id = $('#produto-id').val();
        const produto = {
            nome: $('#produto-nome').val(),
            descricao: $('#produto-descricao').val(),
            preco: parseFloat($('#produto-preco').val()),
            imagem: $('#produto-imagem').val()
        };
        try {
            if (id) {
                await axios.put(`/produto/${id}`, produto);
                mostrarMensagem('Produto atualizado com sucesso!');
            } else {
                await axios.post('/produto', produto);
                mostrarMensagem('Produto cadastrado com sucesso!');
            }
            this.reset();
            $('#produto-id').val('');
            $('#btn-salvar').text('Cadastrar');
            $('#btn-cancelar').hide();
            carregarProdutos();
        } catch (err) {
            mostrarMensagem('Erro ao salvar produto!', 'danger');
        }
    });

    // Botão cancelar edição
    $('#btn-cancelar').on('click', function() {
        $('#novo-produto')[0].reset();
        $('#produto-id').val('');
        $('#btn-salvar').text('Cadastrar');
        $('#btn-cancelar').hide();
    });
});

// Editar produto (admin)
function editarProdutoForm(id) {
    axios.get(`/produto/${id}`)
        .then(function(resp) {
            const produto = resp.data;
            $('#produto-id').val(produto.id);
            $('#produto-nome').val(produto.nome);
            $('#produto-descricao').val(produto.descricao);
            $('#produto-preco').val(produto.preco);
            $('#produto-imagem').val(produto.imagem);
            $('#btn-salvar').text('Atualizar');
            $('#btn-cancelar').show();
            window.scrollTo({top: 0, behavior: 'smooth'});
        })
        .catch(function(err) {
            mostrarMensagem('Erro ao carregar produto para edição!', 'danger');
        });
}

// Remover produto
function removerProduto(id) {
    if (!confirm('Deseja remover este produto?')) return;
    axios.delete(`/produto/${id}`)
        .then(function() {
            carregarProdutos();
            mostrarMensagem('Produto removido com sucesso!', 'success');
        })
        .catch(function() {
            mostrarMensagem('Erro ao remover produto!', 'danger');
        });
}

// Mensagens de feedback (admin)
function mostrarMensagem(msg, tipo='success') {
    const $msgDiv = $('#mensagem-produto');
    if ($msgDiv.length) {
        $msgDiv.html(`<div class="alert alert-${tipo}">${msg}</div>`);
        setTimeout(() => $msgDiv.html(''), 3000);
    }
}


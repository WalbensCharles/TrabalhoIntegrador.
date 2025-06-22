/*cor e font do body */

$('body').css({
    'background-color':'lightgray',
    'font-family': 'Arial, sans-serif'
});
// Função para alternar entre o formulário de login e cadastro
$(document).ready(function() {
    $("#show-register").click(function() {
        $("#login-form").hide(); // Esconde o formulário de login
        $("#register-form").show(); // Exibe o formulário de cadastro
    });
});

//LOGIN 
$(document).ready(function() {
    $("#login-form").submit(function(e) {
        e.preventDefault(); // Evita o comportamento padrão de envio do formulário

        const email = $("#email").val();
        const password = $("#senha").val();

        // Enviar dados de login para o backend (supondo que você tenha um endpoint de login)
        $.ajax({
            url: "/api/login",  // Endpoint de login no backend
            type: "POST",
            data: { email, password },
            success: function(response) {
                // Salvar o token JWT no localStorage
                localStorage.setItem("authToken", response.token);

                // Redirecionar para a página de produtos após o login bem-sucedido
                window.location.href = "produtos.html";
            },
            error: function(err) {
                alert("Erro ao fazer login. Verifique suas credenciais.");
            }
        });
    });
});


//finalizar 


$(document).ready(function() {
    $(".buy-btn").click(function() {
        // Verificar se o usuário está autenticado (token presente no localStorage)
        const token = localStorage.getItem("authToken");

        if (!token) {
            // Se não estiver logado, redirecionar para a página de login
            window.location.href = "../views/login2.html"; // Página de login
            return; // Interromper a execução, não permitir o redirecionamento para checkout
        }

        // Se estiver logado, pegar os dados do produto
        const productId = $(this).data("id");
        const productName = $(this).data("name");
        const productPrice = $(this).data("price");

        // Salvar os dados do produto no localStorage
        const productData = {
            id: productId,
            name: productName,
            price: productPrice,
            quantity: 1
        };

        // Salvar o produto no localStorage
        localStorage.setItem("product", JSON.stringify(productData));

        // Redirecionar para a página de checkout
        window.location.href = "checkout.html";
    });
});


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

// Logout
$('#logout').on('click', function() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'login2.html';
});

// Atualiza os cards do dashboard
function atualizarDashboard() {
    const token = localStorage.getItem("token");
    const headers = { Authorization: "Bearer " + token };

    // Total de usuários
    axios.get('/dashboard/total-users', {headers})
        .then(resp => $('#total-users').text(resp.data.total ?? 0))
        .catch(() => $('#total-users').text('Erro'));

    // Usuários ativos
    axios.get('/dashboard/active-users', {headers})
        .then(resp => $('#active-users').text(resp.data.ativos ?? 0))
        .catch(() => $('#active-users').text('Erro'));

    // total de pedidos
    axios.get('/dashboard/total-orders', {headers})
        .then(resp => $('#total-orders').text(resp.data.pedidos ?? 0))
        .catch(() => $('#total-orders').text('Erro'));

    // total de produtos
    axios.get('/dashboard/total-products', {headers})
        .then(resp => $('#total-products').text(resp.data.produtos ?? 0))
        .catch(() => $('#total-products').text('Erro'));
}

// inicializa dashboard ao carregar a página
$(function() {
    atualizarDashboard();
    setInterval(atualizarDashboard, 30000); // atualiza a cada 30 segundos
});
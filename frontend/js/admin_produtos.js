$(document).ready(function() {
    // Carregar lista de produtos ao carregar a página
    loadProducts();

    // Adicionar um novo produto
    $("#add-product-btn").click(function() {
        $('#productModalLabel').text("Adicionar Produto");
        $('#product-form')[0].reset();
        $('#product-id').val('');
        $('#productModal').modal('show');
    });

    // Submeter o formulário para adicionar ou editar um produto
    $("#product-form").submit(function(e) {
        e.preventDefault();

        const productId = $("#product-id").val();
        const name = $("#product-name").val();
        const price = parseFloat($("#product-price").val());
        const description = $("#product-description").val();
        const imageFile = $("#product-image")[0].files[0];  // Pega o arquivo da imagem

        const formData = new FormData();
        formData.append('name', name);
        formData.append('price', price);
        formData.append('description', description);
        formData.append('image', imageFile);  // Adiciona a imagem

        if (productId) {
            // Atualizar produto existente
            $.ajax({
                url: `/api/admin/products/${productId}`,
                type: "PUT",
                data: formData,
                processData: false, // Impede o jQuery de processar os dados
                contentType: false, // Impede o jQuery de configurar o tipo de conteúdo automaticamente
                success: function(response) {
                    alert("Produto atualizado com sucesso!");
                    $('#productModal').modal('hide');
                    loadProducts();
                },
                error: function(err) {
                    alert("Erro ao atualizar produto.");
                }
            });
        } else {
            // Criar um novo produto
            $.ajax({
                url: "/api/admin/products",
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    alert("Produto adicionado com sucesso!");
                    $('#productModal').modal('hide');
                    loadProducts();
                },
                error: function(err) {
                    alert("Erro ao adicionar produto.");
                }
            });
        }
    });

    // Carregar produtos do backend
    function loadProducts() {
        $.ajax({
            url: "/api/admin/products", // Endpoint para buscar todos os produtos
            type: "GET",
            success: function(response) {
                let productListHtml = '';
                response.forEach(product => {
                    productListHtml += `
                        <tr>
                            <td>${product._id}</td>
                            <td>${product.name}</td>
                            <td><img src="/uploads/${product.image}" alt="${product.name}" style="width: 50px; height: 50px;"></td>
                            <td>R$ ${product.price.toFixed(2)}</td>
                            <td>
                                <button class="btn btn-info edit-btn" data-id="${product._id}">Editar</button>
                                <button class="btn btn-danger delete-btn" data-id="${product._id}">Excluir</button>
                            </td>
                        </tr>
                    `;
                });
                $('#product-list').html(productListHtml);
            }
        });
    }

    // Editar produto
    $(document).on('click', '.edit-btn', function() {
        const productId = $(this).data("id");

        // Carregar dados do produto para edição
        $.ajax({
            url: `/api/admin/products/${productId}`,
            type: "GET",
            success: function(product) {
                $('#productModalLabel').text("Editar Produto");
                $('#product-id').val(product._id);
                $('#product-name').val(product.name);
                $('#product-price').val(product.price);
                $('#product-description').val(product.description);
                $('#productModal').modal('show');
            }
        });
    });

    // Excluir produto
    $(document).on('click', '.delete-btn', function() {
        const productId = $(this).data("id");

        if (confirm("Tem certeza que deseja excluir este produto?")) {
            $.ajax({
                url: `/api/admin/products/${productId}`,
                type: "DELETE",
                success: function(response) {
                    alert("Produto excluído com sucesso!");
                    loadProducts();
                },
                error: function(err) {
                    alert("Erro ao excluir produto.");
                }
            });
        }
    });
});

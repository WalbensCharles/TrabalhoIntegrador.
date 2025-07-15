Primeira parte do projeto: O Front-end contém três pastas: assets, css, js e views.

Dentro da pasta assets, há um arquivo favicon, que é estático, e uma pasta images, que contém as imagens dos produtos.

A pasta css contém um arquivo style.css, que possui alguns estilos das páginas.

A pasta js contém dois arquivos: admin_produtos.js que tem as funções crud e outros arquivos.js têm algumas funções, uma para a tela login que usuei no mesmo arquivo html fiz uma função para login e o cadastrar aparece se clicar nele .

A pasta views contém as páginas HTML.


uso de postgreSQL como banco de dados
o projeto tem quatro tabelas : usuarios , produtos, pedidos e pedidos_itens

para criar usuarios:

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(200) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    ativo BOOLEAN DEFAULT TRUE
);


para criar tabela produtos:
CREATE TABLE produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(200),
    preco NUMERIC(10,2) NOT NULL,
    imagem VARCHAR(200)
);



para criar a tabela pedidos:

CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pendente',
    produto_id INTEGER NOT NULL,
    preco NUMERIC(10,2) NOT NULL,
    endereco VARCHAR(200) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);


para criar pedidos_itens:
CREATE TABLE pedido_itens (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL,
    preco_unitario NUMERIC(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);


Dependencias para rodar o projeto:

npm install -g yarn
yarn init -y     # cria o package.json direto
yarn add express # instala pacotes
yarn add express-validator
yarn add bcrypt
yarn add body parser
yarn add jsonwebtoken
yarn add pg-promise

para conseguir roda o codigo sem modificar 
dever o banco de dados chama :trabalhointegrador
usuarios : postgres
senha : postgres

ou mudar para sua preferencia 
 
Primeira parte do projeto: O Front-end contém três pastas: assets, css, js e views.

Dentro da pasta assets, há um arquivo favicon, que é estático, e uma pasta images, que contém as imagens dos produtos.

A pasta css contém um arquivo style.css, que possui alguns estilos das páginas.

A pasta js contém dois arquivos: admin_produtos.js que tem as funções crud e outros arquivos.js têm algumas funções, uma para a tela login que usuei no mesmo arquivo html fiz uma função para login e o cadastrar aparece se clicar nele .

A pasta views contém as páginas HTML.


uso de postgreSQL como banco de dados
o projeto tem quatro tabelas : usuarios , produtos, pedidos e pedidos_itens

Dependencias para rodar o projeto:

npm install -g yarn
yarn init -y     # cria o package.json direto
yarn add express # instala pacotes
yarn add express-validator
npm install bcrypt
yarn add body parser
yarn add jsonwebtoken
yarn add multer
yarn add pg-promise

para conseguir roda o codigo sem modificar 
dever o banco de dados chama :trabalhointegrador
usuarios : postgres
senha : postgres

ou mudar para sua preferencia 

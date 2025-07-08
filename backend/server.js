const express = require("express");
const { body, validationResult } = require('express-validator');
const pgp = require("pg-promise")({});
const path = require("path");
const multer = require("multer");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
// Middleware para lidar com JSON
app.use(express.json());
app.use(bodyParser.json());

const usuarios = "postgres";
const senha = "postgres";
const db = pgp('postgres://postgres:postgres@localhost:5432/trabalhointegrador');

// busca os arquivos JS e CSS
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.static(path.join(__dirname, "../frontend/views")));


// configuração Multer
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

//register
app.post("/register", async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
    // verificar se o email já existe no banco
    const usuarioExistente = await db.oneOrNone("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (usuarioExistente) {
      return res.status(400).json({ mensagem: "E-mail já cadastrado." });
    }

    // verifica se o email pertence a um administrador

    // definir o role padrão
    let role = "user"; 
    // lista de emails de administradores
    const adminEmails = ["admin@empresa.com", "superadmin@empresa.com"];  
    if (adminEmails.includes(email)) {
      role = "admin";  // se o e-mail estiver na lista, o usuário é admin
    }

    // Criptografar a senha com bcrypt
    const saltRounds = 10;
    const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

    // Salvar o usuário no banco de dados
    await db.none("INSERT INTO usuarios (nome, email, senha, role) VALUES ($1, $2, $3, $4)", [nome, email, senhaCriptografada, role]);

    res.status(200).json({ mensagem: "Cadastro bem-sucedido!", role: role });  // Retorna o role para o frontend
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    res.status(500).json({ mensagem: "Erro ao cadastrar usuário.", error: error.message });
  }
});


// Rota de login de usuário
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    // verificar se o usuário existe no banco
    const usuario = await db.oneOrNone("SELECT * FROM usuarios WHERE email = $1", [email]);
    if (!usuario) {
      return res.status(400).json({ mensagem: "Usuário não encontrado." });
    }

    // comparar a senha fornecida com a senha criptografada
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(400).json({ mensagem: "Senha incorreta." });
    }

    // gerar o token JWT
    const token = jwt.sign({ 
      userId: usuario.id, role: usuario.role }, // Inclui o id e o papel
      "sua_chave_secreta",
      { expiresIn: '1h' }
    );

    // agora retorna também o id do usuário
    res.status(200).json({
      mensagem: "Login bem-sucedido!",
      token,
      role: usuario.role,
      userId: usuario.id  
    });
  } catch (error) {
    console.error("Erro ao realizar login:", error);
    res.status(500).json({ mensagem: "Erro ao realizar login.", error: error.message });
  }
});


// middleware para verificar o token JWT para verificar se usuario loggin
const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ mensagem: 'Token não fornecido' });
    }

    jwt.verify(token, 'sua_chave_secreta', (err, decoded) => {
        if (err) {
            return res.status(401).json({ mensagem: 'Token inválido' });
        }

        req.userId = decoded.userId;  
        req.role = decoded.role;       
        next();  
    });
};


//criar 

app.post("/produto", [
    body('nome').isLength({ min: 3, max: 100 }),
    body('descricao').isLength({ min: 3, max: 200 }),
    body('preco').isFloat({ min: 0 }),
    body('imagem').isLength({ min: 3, max: 200 }) 
], async (req, res) => {
    try {
        const { nome, descricao, preco, imagem } = req.body;

        const novoProduto = await db.one(
            "INSERT INTO produtos (nome, descricao, preco, imagem) VALUES ($1, $2, $3, $4) RETURNING id, nome, descricao, preco, imagem",
            [nome, descricao, preco, imagem]
        );
        res.status(201).json(novoProduto);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

//protudos criar

app.get("/produtos", async (req, res) => {
  try {
    const produtos = await db.any("SELECT * FROM produtos ORDER BY id DESC;");
    res.status(200).json(produtos);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//editar 
app.put("/produto/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nome, descricao, preco, imagem } = req.body;
    await db.none(
      "UPDATE produtos SET nome=$1, descricao=$2, preco=$3, imagem=$4 WHERE id=$5",
      [nome, descricao, preco, imagem, id]
    );
    res.sendStatus(204); // No Content
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//excluir
app.delete("/produto/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.none("DELETE FROM produtos WHERE id=$1", [id]);
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
 //buscar
 app.get("/produto/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const produto = await db.one("SELECT * FROM produtos WHERE id=$1", [id]);
    res.status(200).json(produto);
  } catch (error) {
    res.status(404).json({ error: "Produto não encontrado" });
  }
});


// usuários ativos 
app.get('/dashboard/active-users', async (req, res) => {
  try {
    const { ativos } = await db.one('SELECT COUNT(*) as ativos FROM usuarios WHERE ativo = true');
    res.json({ ativos: Number(ativos) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários ativos' });
  }
});


// total de usuários
app.get('/dashboard/total-users', async (req, res) => {
  try {
    const { total } = await db.one('SELECT COUNT(*) as total FROM usuarios');
    res.json({ total: Number(total) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});



// total de pedidos
app.get('/dashboard/total-orders', async (req, res) => {
  try {
    const { pedidos } = await db.one('SELECT COUNT(*) as pedidos FROM pedidos');
    res.json({ pedidos: Number(pedidos) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// total de produtos
app.get('/dashboard/total-products', async (req, res) => {
  try {
    const { produtos } = await db.one('SELECT COUNT(*) as produtos FROM produtos');
    res.json({ produtos: Number(produtos) });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

//pedidos
app.post('/checkout', async (req, res) => {
  try {
    // Recebe infos do pedido
    const { usuario_id, produto_id, preco, endereco } = req.body;
    // Insere na tabela pedidos
    const pedido = await db.one(
      'INSERT INTO pedidos (usuario_id, produto_id, preco, endereco) VALUES ($1, $2, $3, $4) RETURNING *',
      [usuario_id, produto_id, preco, endereco]
    );
    res.status(201).json(pedido);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
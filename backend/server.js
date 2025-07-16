const express = require("express");
const { body, validationResult } = require('express-validator');
const pgp = require("pg-promise")({});
const path = require("path");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

const app = express();
// Middleware para lidar com JSON
app.use(express.json());
app.use(bodyParser.json());

const db = pgp('postgres://postgres:postgres@localhost:5432/programa');

// busca os arquivos JS e CSS
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.static(path.join(__dirname, "../frontend/views")));


const JWT_SECRET = "sua_chave_secreta"; //  variáveis de ambiente na produção

// Middleware para verificar JWT
const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ mensagem: 'Token não fornecido' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ mensagem: 'Token mal formatado' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ mensagem: 'Token inválido' });
        req.userId = decoded.userId;
        req.role = decoded.role;
        next();
    });
};

// middleware  para admin
const soAdmin = (req, res, next) => {
    if (req.role !== "admin") {
        return res.status(403).json({ mensagem: "Acesso restrito a administradores" });
    }
    next();
};

// cadastro de usuário
app.post("/register", async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        const usuarioExistente = await db.oneOrNone("SELECT * FROM usuarios WHERE email = $1", [email]);
        if (usuarioExistente) {
            return res.status(400).json({ mensagem: "E-mail já cadastrado." });
        }

        // definir o role padrão
        let role = "user";
        const adminEmails = ["admin@empresa.com", "admin@loja.com"];
        if (adminEmails.includes(email)) {
            role = "admin";
        }

        // criptografar a senha com bcrypt
        const saltRounds = 10;
        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);

        await db.none("INSERT INTO usuarios (nome, email, senha, role) VALUES ($1, $2, $3, $4)",
            [nome, email, senhaCriptografada, role]
        );

        res.status(200).json({ mensagem: "Cadastro bem-sucedido!", role: role });
    } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        res.status(500).json({ mensagem: "Erro ao cadastrar usuário.", error: error.message });
    }
});

// login de usuário
app.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    try {
        const usuario = await db.oneOrNone("SELECT * FROM usuarios WHERE email = $1", [email]);
        if (!usuario) {
            return res.status(400).json({ mensagem: "Usuário não encontrado." });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(400).json({ mensagem: "Senha incorreta." });
        }

        const token = jwt.sign(
            { userId: usuario.id, role: usuario.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

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

// criar produto 
app.post("/produto",
    verificarToken,
    soAdmin,
    [
        body('nome').isLength({ min: 3, max: 100 }).withMessage("nome do produto deve ter entre 3 e 100 caracteres."),
        body('descricao').isLength({ min: 3, max: 200 }).withMessage("descrição do produto deve ter entre 3 e 200 caracteres."),
        body('preco').isFloat({ min: 0 }).withMessage("preço do produto deve ser um valor numérico maior que 0."),
        body('imagem').isLength({ min: 3, max: 200 }).withMessage("imagem do produto deve ter entre 3 e 200 caracteres.")
    ],
    async (req, res) => {
        const erros = validationResult(req);
        if (!erros.isEmpty()) {
            return res.status(400).json({ erros: erros.array() });
        }
        try {
            const { nome, descricao, preco, imagem } = req.body;
            const novoProduto = await db.one(
                "INSERT INTO produtos (nome, descricao, preco, imagem) VALUES ($1, $2, $3, $4) RETURNING id, nome, descricao, preco, imagem",
                [nome, descricao, preco, imagem]
            );
            res.status(201).json(novoProduto);
        } catch (error) {
            if (error.message.includes("duplicate key")) {
                res.status(400).json({ error: "Produto já existe com esse nome." });
            } else if (error.message.includes("connection")) {
                res.status(500).json({ error: "Erro de conexão com o banco de dados. Verifique a configuração." });
            } else {
                res.status(400).json({ error: "Erro ao inserir produto no banco de dados. Tente novamente mais tarde." });
            }
        }
    }
);

// listar produtos 
app.get("/produtos", async (req, res) => {
    try {
        const produtos = await db.any("SELECT * FROM produtos ORDER BY id DESC;");
        res.status(200).json(produtos);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// editar produto 
app.put("/produto/:id", verificarToken, soAdmin, async (req, res) => {
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

// excluir produto 
app.delete("/produto/:id", verificarToken, soAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await db.none("DELETE FROM produtos WHERE id=$1", [id]);
        res.sendStatus(204);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// buscar produto por id para fazer crud
app.get("/produto/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const produto = await db.one("SELECT * FROM produtos WHERE id=$1", [id]);
        res.status(200).json(produto);
    } catch (error) {
        res.status(404).json({ error: "Produto não encontrado" });
    }
});

// para ver os usuários ativos
app.get('/dashboard/active-users', verificarToken, soAdmin, async (req, res) => {
    try {
        const { ativos } = await db.one('SELECT COUNT(*) as ativos FROM usuarios WHERE ativo = true');
        res.json({ ativos: Number(ativos) });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar usuários ativos' });
    }
});

// total de usuários 
app.get('/dashboard/total-users', verificarToken, soAdmin, async (req, res) => {
    try {
        const { total } = await db.one('SELECT COUNT(*) as total FROM usuarios');
        res.json({ total: Number(total) });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
});

// total de pedidos
app.get('/dashboard/total-orders', verificarToken, soAdmin, async (req, res) => {
    try {
        const { pedidos } = await db.one('SELECT COUNT(*) as pedidos FROM pedidos');
        res.json({ pedidos: Number(pedidos) });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar pedidos' });
    }
});

// total de produtos 
app.get('/dashboard/total-products', verificarToken, soAdmin, async (req, res) => {
    try {
        const { produtos } = await db.one('SELECT COUNT(*) as produtos FROM produtos');
        res.json({ produtos: Number(produtos) });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar produtos' });
    }
});

// verificar usuário autenticado
app.post('/checkout', verificarToken, async (req, res) => {
    try {
        const { produto_id, preco, endereco } = req.body;
        // O usuário autenticado faz o pedido com seu próprio ID
        const usuario_id = req.userId;
        const pedido = await db.one(
            'INSERT INTO pedidos (usuario_id, produto_id, preco, endereco) VALUES ($1, $2, $3, $4) RETURNING *',
            [usuario_id, produto_id, preco, endereco]
        );
        res.status(201).json(pedido);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

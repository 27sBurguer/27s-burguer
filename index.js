const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const DB_FILE = './pedidos.json';

const lerPedidos = () => {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, '[]');
    }
    const dados = fs.readFileSync(DB_FILE);
    return JSON.parse(dados);
};

const salvarPedidos = (dados) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(dados, null, 2));
};

app.get('/', (req, res) => {
    res.send('API de pedidos funcionando ✅');
});

app.post('/pedido', (req, res) => {
    const pedido = req.body;
    const pedidos = lerPedidos();

    pedido.id = Date.now();
    pedido.status = 'pendente';

    pedidos.push(pedido);
    salvarPedidos(pedidos);

    res.status(201).json({ message: 'Pedido recebido!', pedido });
});

app.get('/pedidos', (req, res) => {
    const pedidos = lerPedidos();
    res.json(pedidos);
});

app.patch('/pedido/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const pedidos = lerPedidos();
    const index = pedidos.findIndex(p => p.id == id);

    if (index === -1) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    pedidos[index].status = status;
    salvarPedidos(pedidos);

    res.json({ message: 'Status atualizado!', pedido: pedidos[index] });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

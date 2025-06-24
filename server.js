const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let pedidos = [];

// 🛰️ WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// 🔊 Atualiza todos os clientes WebSocket
function broadcastAtualizacao() {
    const data = JSON.stringify({ tipo: 'atualizacao', pedidos });
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(data);
        }
    });
}

// 🚀 Recebe novo pedido
app.post('/pedidos', (req, res) => {
    const pedidoNovo = req.body;
    pedidoNovo.status = 'pendente';

    // 🔎 Procura se já existe um pedido com o mesmo nome (ignora espaços e maiúsculas)
    const pedidoExistente = pedidos.find(
        p => p.nome.trim().toLowerCase() === pedidoNovo.nome.trim().toLowerCase()
    );

    if (pedidoExistente) {
        // ➕ Junta os itens
        const itensAntigos = pedidoExistente.itens.map(item => ({
            ...item,
            produto: `${item.produto} (Antigo)`
        }));

        const itensNovos = pedidoNovo.itens.map(item => ({
            ...item,
            produto: `${item.produto} (Novo)`
        }));

        const itensCombinados = [...itensAntigos, ...itensNovos];

        // Soma os totais
        const totalCombinado = itensCombinados.reduce((sum, item) => sum + item.total, 0);

        const pedidoCombinado = {
            ...pedidoNovo,
            itens: itensCombinados,
            total: totalCombinado,
            status: 'pendente'
        };

        // Remove o pedido antigo
        pedidos = pedidos.filter(p => p !== pedidoExistente);

        // Adiciona no topo
        pedidos.unshift(pedidoCombinado);

    } else {
        // Se não existir, adiciona normalmente
        pedidos.unshift(pedidoNovo);
    }

    broadcastAtualizacao();
    res.status(201).send('Pedido registrado com sucesso');
});

// 🔄 Lista todos os pedidos
app.get('/pedidos', (req, res) => {
    res.json(pedidos);
});

// 🗑️ Exclui um pedido específico
app.delete('/pedidos/:id', (req, res) => {
    const id = req.params.id;
    pedidos = pedidos.filter(p => p.id !== id);

    broadcastAtualizacao();
    res.sendStatus(200);
});

// 🗑️ Limpa todos os pedidos (ex.: quando loja fecha)
app.delete('/pedidos', (req, res) => {
    pedidos = [];
    broadcastAtualizacao();
    res.sendStatus(200);
});

// 🔧 Atualiza status do pedido
app.patch('/pedidos/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const pedido = pedidos.find(p => p.id === id);
    if (!pedido) {
        return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    pedido.status = status;
    broadcastAtualizacao();
    res.json({ message: 'Status atualizado com sucesso' });
});

// 🌐 WebSocket
wss.on('connection', (ws) => {
    console.log('Cliente WebSocket conectado');
    ws.send(JSON.stringify({ tipo: 'atualizacao', pedidos }));

    ws.on('close', () => {
        console.log('Cliente WebSocket desconectado');
    });
});

// 🚀 Inicia servidor
server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

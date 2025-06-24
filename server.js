const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let pedidos = [];

// Configura WebSocket
const wss = new WebSocketServer({ noServer: true });
function broadcastAtualizacao() {
    const data = JSON.stringify({ tipo: 'atualizacao', pedidos });
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(data);
        }
    });
}

// 🚀 Recebe um novo pedido
app.post('/pedidos', (req, res) => {
    const pedido = req.body;
    pedido.status = 'pendente';
    pedidos.unshift(pedido);

    broadcastAtualizacao();
    res.status(201).send('Pedido recebido com sucesso');
});

// 🔄 Lista todos os pedidos
app.get('/pedidos', (req, res) => {
    res.json(pedidos);
});

// 🗑️ Exclui um pedido
app.delete('/pedidos/:id', (req, res) => {
    const id = req.params.id;
    pedidos = pedidos.filter(p => p.id !== id);

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

// Servidor HTTP + WebSocket
const server = app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, ws => {
        wss.emit('connection', ws, request);
    });
});

const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let pedidos = [];

// 🛰️ Configura WebSocket
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// 🔊 Função para atualizar todos os clientes WebSocket
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

    // 🔄 Verifica se já existe um pedido com o mesmo nome (ignora espaços e maiúsculas/minúsculas)
    const indexExistente = pedidos.findIndex(p => p.nome.trim().toLowerCase() === pedido.nome.trim().toLowerCase());

    if (indexExistente !== -1) {
        // 📝 Remove o pedido antigo
        pedidos.splice(indexExistente, 1);
    }

    // ⬆️ Coloca o pedido atualizado no topo
    pedidos.unshift(pedido);

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

// 🗑️ Limpa todos os pedidos (usado ao fechar a loja)
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

    // Envia os pedidos atuais assim que conecta
    ws.send(JSON.stringify({ tipo: 'atualizacao', pedidos }));

    ws.on('close', () => {
        console.log('Cliente WebSocket desconectado');
    });
});

// 🚀 Inicia servidor
server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

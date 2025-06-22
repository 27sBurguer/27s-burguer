const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let pedidos = [];

// 🚀 Recebe um novo pedido
app.post('/pedidos', (req, res) => {
    const pedido = req.body;
    pedido.status = 'pendente';

    const nomeFormatado = pedido.nome.trim().toLowerCase();

    // 🔍 Verifica se já existe um pedido com esse nome (independente do status)
    const pedidoExistente = pedidos.find(p =>
        p.nome.trim().toLowerCase() === nomeFormatado
    );

    if (pedidoExistente) {
        // 🔥 Volta pra pendente caso estivesse finalizado
        pedidoExistente.status = 'pendente';

        // 🧠 Junta os itens
        pedido.itens.forEach(itemNovo => {
            const itemExistente = pedidoExistente.itens.find(item =>
                item.produto === itemNovo.produto &&
                JSON.stringify(item.opcoes) === JSON.stringify(itemNovo.opcoes)
            );

            if (itemExistente) {
                itemExistente.quantidade += itemNovo.quantidade;
                itemExistente.total += itemNovo.total;
            } else {
                pedidoExistente.itens.push(itemNovo);
            }
        });

        // 🔗 Atualiza total e data
        pedidoExistente.total += pedido.total;
        pedidoExistente.data = pedido.data;

        // ⬆️ Move para o topo da lista
        pedidos = pedidos.filter(p => p !== pedidoExistente);
        pedidos.unshift(pedidoExistente);

    } else {
        // Se não existe, cria um novo pedido
        pedidos.unshift(pedido);
    }

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
    res.json({ message: 'Status atualizado com sucesso' });
});

// Teste de funcionamento
app.get('/', (req, res) => {
    res.send('🚀 API do gestor está online!');
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

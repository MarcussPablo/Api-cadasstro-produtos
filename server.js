import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const port = process.env.PORT || 3000;

// Função para criar a tabela ao iniciar
async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        preco NUMERIC NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela "produtos" verificada/criada com sucesso!');
  } catch (err) {
    console.error('❌ Erro ao criar tabela:', err);
  }
}

// Executa a criação da tabela antes de iniciar o servidor
createTable();

// Middleware de log simples
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('API com Neon rodando 🚀');
});

app.get('/teste', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0] });
  } catch (err) {
    console.error('Erro no /teste:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/produtos', async (req, res) => {
  const { nome, preco } = req.body;

  if (!nome || preco == null || isNaN(preco)) {
    return res.status(400).json({ error: 'Nome e preço são obrigatórios e preço deve ser número' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO produtos (nome, preco) VALUES ($1, $2) RETURNING *',
      [nome, preco]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro no POST /produtos:', err);
    res.status(500).json({ error: err.message || 'Erro ao inserir produto' });
  }
});

app.get('/produtos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM produtos');
    res.json(result.rows);
  } catch (err) {
    console.error('Erro no GET /produtos:', err);
    res.status(500).json({ error: err.message || 'Erro ao buscar produtos' });
  }
});

app.put('/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, preco } = req.body;

  if (!nome || preco == null || isNaN(preco)) {
    return res.status(400).json({ error: 'Nome e preço são obrigatórios e preço deve ser número' });
  }

  try {
    const result = await pool.query(
      'UPDATE produtos SET nome=$1, preco=$2 WHERE id=$3 RETURNING *',
      [nome, preco, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro no PUT /produtos/:id:', err);
    res.status(500).json({ error: err.message || 'Erro ao atualizar produto' });
  }
});

app.delete('/produtos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM produtos WHERE id=$1', [id]);
    res.send('Produto removido com sucesso');
  } catch (err) {
    console.error('Erro no DELETE /produtos/:id:', err);
    res.status(500).json({ error: err.message || 'Erro ao remover produto' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});

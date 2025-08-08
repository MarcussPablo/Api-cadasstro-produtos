import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import { Pool } from 'pg';
import cors from 'cors';




const app = express();
app.use(express.json());
app.use(cors());

// Conexão com Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Teste inicial
app.get('/', (req, res) => {
  res.send('API com Neon rodando 🚀');
});

// Criar tabela
app.get('/create-table', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        preco NUMERIC NOT NULL
      )
    `);
    res.send('Tabela criada com sucesso!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao criar tabela');
  }
});

// CREATE
app.post('/produtos', async (req, res) => {
  const { nome, preco } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO produtos (nome, preco) VALUES ($1, $2) RETURNING *',
      [nome, preco]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao inserir produto');
  }
});

// READ
app.get('/produtos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM produtos');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao buscar produtos');
  }
});

// UPDATE
app.put('/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, preco } = req.body;
  try {
    const result = await pool.query(
      'UPDATE produtos SET nome=$1, preco=$2 WHERE id=$3 RETURNING *',
      [nome, preco, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao atualizar produto');
  }
});

// DELETE
app.delete('/produtos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM produtos WHERE id=$1', [id]);
    res.send('Produto removido com sucesso');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao remover produto');
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${process.env.PORT}`);
});

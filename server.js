const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Підключення до БД береться зі змінних середовища (вимога лабораторної)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Автоматичне створення таблиці при запуску
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL
      );
    `);
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};
initDB();

// Ендпоінт для перевірки стану (Health Check - знадобиться для балансувальника)
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Отримання всіх користувачів
app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Додавання нового користувача
app.post('/api/users', async (req, res) => {
  const { name, email } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
const express = require('express');
const { Pool } = require('pg');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// PostgreSQL

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME || 'labdb',
  port: 5432,
  ssl: {
    rejectUnauthorized: false // <--- ДОДАЙТЕ ЦІ ТРИ РЯДКИ
  }
});

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


const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Lab 1 API', version: '1.0.0', description: 'API для лабораторної роботи' },
  },
  apis: ['./server.js'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));



function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.status(401).json({ error: "No token provided" }); 

  jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key', (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}


/**
 * @openapi
 * /api/health:
 *   get:
 *     description: Перевірка статусу сервера
 *     responses:
 *       200:
 *         description: OK
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

/**
 * @openapi
 * /api/users:
 *   get:
 *     description: Отримання всіх користувачів з бази даних
 *     responses:
 *       200:
 *         description: Масив користувачів
 */
app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/users:
 *   post:
 *     description: Додавання нового користувача
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Користувача створено
 */
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

/**
 * @openapi
 * /api/private:
 *   get:
 *     description: Секретний ендпоінт, що вимагає JWT токен
 *     responses:
 *       401:
 *         description: Немає токена
 *       200:
 *         description: Доступ дозволено
 */
app.get('/api/private', authenticateToken, (req, res) => {
  res.json({ message: "Ви успішно пройшли автентифікацію!" });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
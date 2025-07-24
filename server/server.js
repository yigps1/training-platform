const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware логване
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// CORS настройки
const corsOptions = {
  origin: 'https://training-platform-7znr.onrender.com',
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Преflight
app.options('*', cors(corsOptions), (req, res) => {
  res.sendStatus(200);
});

// Статични файлове от React build
app.use(express.static(path.join(__dirname, '../client/build')));

// PostgreSQL конфигурация
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// API health check
app.get('/api', (req, res) => {
  res.send('API работи 🟢');
});

// Events API
app.get('/api/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events');
    res.json(result.rows);
  } catch (err) {
    console.error('Грешка при четене на events:', err);
    res.status(500).send('Грешка при четене на събития');
  }
});

app.post('/api/events', async (req, res) => {
  const { title, start, end } = req.body;
  if (!title || !start || !end) return res.status(400).send('Липсват задължителни полета');

  try {
    const result = await pool.query(
      'INSERT INTO events (title, start, "end") VALUES ($1, $2, $3) RETURNING *',
      [title, start, end]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Грешка при запис на event:', err);
    res.status(500).send('Грешка при запис на събитие');
  }
});

// Trainees API
app.get('/api/trainees', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trainees');
    res.json(result.rows);
  } catch (err) {
    console.error('Грешка при четене на trainees:', err);
    res.status(500).send('Грешка при четене на обучаеми');
  }
});

app.post('/api/trainees', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send('Липсва задължително поле: name');

  try {
    const result = await pool.query('INSERT INTO trainees (name) VALUES ($1) RETURNING *', [name]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Грешка при запис на trainee:', err);
    res.status(500).send('Грешка при запис на обучаем');
  }
});

app.delete('/api/trainees/:name', async (req, res) => {
  const { name } = req.params;
  try {
    await pool.query('DELETE FROM events WHERE title ILIKE $1', [name + '%']);
    await pool.query('DELETE FROM trainees WHERE name = $1', [name]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Грешка при изтриване:', err);
    res.status(500).send('Грешка при изтриване');
  }
});

// Progress API
app.get('/api/progress', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM progress ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Грешка при четене на progress:', err);
    res.status(500).send('Грешка при четене на прогреса');
  }
});

app.post('/api/progress', async (req, res) => {
  const { user_id, stage } = req.body;
  console.log("POST /api/progress BODY:", req.body);

  if (!user_id || !stage) return res.status(400).send('Missing user_id or stage');

  try {
    const result = await pool.query(
      'INSERT INTO progress (user_id, stage, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [user_id, stage]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Грешка при запис на прогрес:', err);
    res.status(500).send('Грешка при запис на прогрес');
  }
});

// React SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Стартиране
app.listen(PORT, () => {
  console.log(`Сървърът работи на порт ${PORT}`);
});
const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS конфигурация – разрешени front-end домейни
const corsOptions = {
  origin: [
    'https://training-platform-4tn3.onrender.com',
    'https://training-platform-7znr.onrender.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.options('*', cors(corsOptions));

// 🧾 Логване на всички заявки
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// 📦 React build (ако е deploy-нат тук)
app.use(express.static(path.join(__dirname, 'build')));

// 🐘 PostgreSQL връзка
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ✅ Health check
app.get('/api', (req, res) => {
  res.send('✅ API работи');
});

// ===============================
// 🗓️ EVENTS
// ===============================
app.get('/api/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Грешка при четене на events:', err);
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
    console.error('❌ Грешка при запис на събитие:', err);
    res.status(500).send('Грешка при запис на събитие');
  }
});

// ===============================
// 👨‍🎓 TRAINEES
// ===============================
app.get('/api/trainees', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trainees');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Грешка при четене на trainees:', err);
    res.status(500).send('Грешка при четене на обучаеми');
  }
});

app.post('/api/trainees', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send('Липсва задължително поле: name');
  try {
    const result = await pool.query(
      'INSERT INTO trainees (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Грешка при запис на trainee:', err);
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
    console.error('❌ Грешка при изтриване:', err);
    res.status(500).send('Грешка при изтриване');
  }
});

// ===============================
// 📊 PROGRESS
// ===============================
app.get('/api/progress', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM progress ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Грешка при четене на progress:', err);
    res.status(500).send('Грешка при четене на прогреса');
  }
});

app.post('/api/progress', async (req, res) => {
  const { user_id, stage } = req.body;
  console.log('📩 POST /api/progress BODY:', req.body);

  if (!user_id || !stage) return res.status(400).send('Missing user_id or stage');

  try {
    const result = await pool.query(
      'INSERT INTO progress (user_id, stage) VALUES ($1, $2) RETURNING *',
      [user_id, stage]
    );
    console.log('✅ Прогрес записан:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Грешка при запис на прогрес:', err.message);
    res.status(500).send('Грешка при запис на прогрес');
  }
});

// ===============================
// SPA fallback (ако build е вътре)
// ===============================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// 🚀 Стартиране
app.listen(PORT, () => {
  console.log(`🚀 Сървърът работи на порт ${PORT}`);
});

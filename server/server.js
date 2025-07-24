const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS
const corsOptions = {
  origin: [
    'https://training-platform-4tn3.onrender.com',
    'https://training-platform-7znr.onrender.com',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.options('*', cors(corsOptions));

// 🧾 Logging middleware
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// 🐘 PostgreSQL connection
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
    console.error('❌ Events Error:', err);
    res.status(500).send('Грешка при четене на събития');
  }
});

app.post('/api/events', async (req, res) => {
  const { title, start, end } = req.body;
  if (!title || !start || !end) return res.status(400).send('Липсват задължителни полета');

  const nameMatch = title.match(/^(.+?)\s*\(/);
  const depotMatch = title.match(/\((.+?)\)/);
  const vehicleMatch = title.match(/\[(.+?)\]$/);

  const trainee_name = nameMatch ? nameMatch[1] : null;
  const depot = depotMatch ? depotMatch[1] : null;
  const vehicle = vehicleMatch ? vehicleMatch[1] : null;

  try {
    const result = await pool.query(
      `INSERT INTO events (title, start, "end", trainee_name, depot, vehicle)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, start, end, trainee_name, depot, vehicle]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Event Insert Error:', err);
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
    console.error('❌ Trainees Read Error:', err);
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
    console.error('❌ Trainee Insert Error:', err);
    res.status(500).send('Грешка при запис на обучаем');
  }
});

app.delete('/api/trainees/:name', async (req, res) => {
  const { name } = req.params;
  try {
    await pool.query('DELETE FROM events WHERE trainee_name = $1', [name]);
    await pool.query('DELETE FROM trainees WHERE name = $1', [name]);
    res.sendStatus(204);
  } catch (err) {
    console.error('❌ Delete Trainee Error:', err);
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
    console.error('❌ Progress Read Error:', err);
    res.status(500).send('Грешка при четене на прогреса');
  }
});

app.post('/api/progress', async (req, res) => {
  const { user_id, stage } = req.body;
  if (!user_id || !stage) return res.status(400).send('Missing user_id or stage');

  try {
    const result = await pool.query(
      'INSERT INTO progress (user_id, stage, created_at) VALUES ($1, $2, NOW()) RETURNING *',
      [user_id, stage]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Прогрес Insert Error:', err.message);
    res.status(500).send('Грешка при запис на прогрес');
  }
});

// 🚀 Стартиране на сървъра
app.listen(PORT, () => {
  console.log(`🚀 Сървърът работи на порт ${PORT}`);
});

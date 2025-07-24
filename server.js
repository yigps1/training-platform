const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve React build (увери се, че имаш build папка след npm run build)
app.use(express.static(path.join(__dirname, 'build')));

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // важно за Render
  },
});

// Health check
app.get('/api', (req, res) => {
  res.send('API работи 🟢');
});

// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events');
    res.json(result.rows);
  } catch (err) {
    console.error('Грешка при четене на events:', err);
    res.status(500).send('Грешка при четене на събития');
  }
});

// Add new event
app.post('/api/events', async (req, res) => {
  const { title, start, end } = req.body;
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

// Get all trainees
app.get('/api/trainees', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trainees');
    res.json(result.rows);
  } catch (err) {
    console.error('Грешка при четене на trainees:', err);
    res.status(500).send('Грешка при четене на обучаеми');
  }
});

// Add new trainee
app.post('/api/trainees', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO trainees (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Грешка при запис на trainee:', err);
    res.status(500).send('Грешка при запис на обучаем');
  }
});

// Delete trainee and related events
app.delete('/api/trainees/:name', async (req, res) => {
  const { name } = req.params;
  try {
    // Изтриваме събития, чиито заглавия започват с името (LIKE 'name%')
    await pool.query("DELETE FROM events WHERE title ILIKE $1", [name + '%']);
    await pool.query('DELETE FROM trainees WHERE name = $1', [name]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Грешка при изтриване:', err);
    res.status(500).send('Грешка при изтриване');
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Сървърът работи на порт ${PORT}`);
});

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

// Database connection
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
  if (err) {
    console.error('Ошибка подключения к БД:', err);
  } else {
    console.log('✅ Подключено к SQLite БД');
    initDatabase();
  }
});

// Initialize database
function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Ошибка создания таблицы:', err);
    } else {
      console.log('✅ Таблица todos готова');
    }
  });
}

// API Routes

// GET all todos
app.get('/api/todos', (req, res) => {
  db.all('SELECT * FROM todos ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET single todo
app.get('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }
    res.json(row);
  });
});

// POST new todo
app.post('/api/todos', (req, res) => {
  const { title } = req.body;
  
  if (!title || title.trim() === '') {
    res.status(400).json({ error: 'Название задачи обязательно' });
    return;
  }

  db.run(
    'INSERT INTO todos (title) VALUES (?)',
    [title.trim()],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({
        id: this.lastID,
        title: title.trim(),
        completed: 0,
        message: 'Задача создана'
      });
    }
  );
});

// PUT update todo
app.put('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  let updates = [];
  let params = [];

  if (title !== undefined) {
    updates.push('title = ?');
    params.push(title.trim());
  }

  if (completed !== undefined) {
    updates.push('completed = ?');
    params.push(completed ? 1 : 0);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'Нет данных для обновления' });
    return;
  }

  params.push(id);

  db.run(
    `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Задача не найдена' });
        return;
      }
      res.json({ message: 'Задача обновлена', changes: this.changes });
    }
  );
});

// DELETE todo
app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }
    res.json({ message: 'Задача удалена', id: parseInt(id) });
  });
});

// GET stats
app.get('/api/stats', (req, res) => {
  db.all(`
    SELECT 
      COUNT(*) as total,
      SUM(completed) as completed,
      COUNT(*) - SUM(completed) as active
    FROM todos
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows[0]);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📊 API доступен на http://localhost:${PORT}/api/todos`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('\n👋 Соединение с БД закрыто');
    process.exit(0);
  });
});


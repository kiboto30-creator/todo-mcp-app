const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Инициализация базы данных...');

db.serialize(() => {
  // Create todos table
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('❌ Ошибка создания таблицы:', err);
      return;
    }
    console.log('✅ Таблица todos создана');
  });

  // Insert sample data
  const sampleTodos = [
    'Изучить MCP протокол',
    'Настроить Cursor с MCP',
    'Создать TODO приложение',
    'Протестировать работу с БД через MCP',
    'Оптимизировать расход токенов'
  ];

  const stmt = db.prepare('INSERT INTO todos (title, completed) VALUES (?, ?)');
  
  sampleTodos.forEach((title, index) => {
    const completed = index < 2 ? 1 : 0; // First 2 are completed
    stmt.run(title, completed);
  });

  stmt.finalize((err) => {
    if (err) {
      console.error('❌ Ошибка добавления данных:', err);
      return;
    }
    console.log('✅ Тестовые данные добавлены');
    
    // Display all todos
    db.all('SELECT * FROM todos', [], (err, rows) => {
      if (err) {
        console.error('❌ Ошибка чтения данных:', err);
        return;
      }
      
      console.log('\n📋 Задачи в БД:');
      rows.forEach((row) => {
        const status = row.completed ? '✅' : '⬜';
        console.log(`  ${status} [${row.id}] ${row.title}`);
      });
      
      console.log('\n🎉 База данных готова к работе!');
      console.log('📍 Путь к БД:', dbPath);
      console.log('\n💡 Следующий шаг:');
      console.log('   1. Скопируй путь выше');
      console.log('   2. Вставь его в .cursor/mcp.json');
      console.log('   3. Перезапусти Cursor');
      console.log('   4. Проверь MCP в Settings → MCP\n');
    });
  });
});

db.close((err) => {
  if (err) {
    console.error('❌ Ошибка закрытия БД:', err);
  }
});

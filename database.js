const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 資料庫路徑
const DB_PATH = path.join(__dirname, 'auth.db');

// 建立資料庫連接
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('資料庫連接失敗:', err.message);
    process.exit(1);
  } else {
    console.log('成功連接到 SQLite 資料庫');
  }
});

// 啟用外鍵約束
db.run('PRAGMA foreign_keys = ON', (err) => {
  if (err) {
    console.error('啟用外鍵約束失敗:', err.message);
  } else {
    console.log('外鍵約束已啟用');
  }
});

/**
 * 初始化資料庫表格
 */
const initializeTables = () => {
  db.serialize(() => {
    // 建立使用者資料表
    createUsersTable();
    
    // 建立待辦事項資料表
    createTodosTable();
    
    // 建立團隊相關資料表
    createTeamsTable();
    createTeamMembersTable();
    createTodoAssignmentsTable();
  });
};

/**
 * 建立使用者資料表
 */
const createUsersTable = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, handleTableCreation('使用者'));
};

/**
 * 建立待辦事項資料表
 */
const createTodosTable = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      priority TEXT DEFAULT 'medium',
      completed INTEGER DEFAULT 0,
      team_id INTEGER DEFAULT NULL,
      start_date DATETIME DEFAULT NULL,
      due_date DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) {
      console.error('建立待辦事項資料表失敗:', err.message);
    } else {
      console.log('待辦事項資料表已就緒');
      addMissingColumnsToTodos();
    }
  });
};

/**
 * 建立團隊資料表
 */
const createTeamsTable = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      color TEXT DEFAULT '#667eea',
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `, handleTableCreation('團隊'));
};

/**
 * 建立團隊成員資料表
 */
const createTeamMembersTable = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(team_id, user_id)
    )
  `, handleTableCreation('團隊成員'));
};

/**
 * 建立待辦事項指派資料表
 */
const createTodoAssignmentsTable = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS todo_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      todo_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(todo_id, user_id)
    )
  `, handleTableCreation('待辦事項指派'));
};

/**
 * 表格建立回調處理
 */
const handleTableCreation = (tableName) => (err) => {
  if (err) {
    console.error(`建立${tableName}資料表失敗:`, err.message);
  } else {
    console.log(`${tableName}資料表已就緒`);
  }
};

/**
 * 為 todos 表格添加缺失的欄位（向後兼容）
 */
const addMissingColumnsToTodos = () => {
  db.all("PRAGMA table_info(todos)", (err, columns) => {
    if (err) {
      console.error('✗ 檢查資料表結構失敗:', err.message);
      return;
    }
    
    const columnNames = columns.map(col => col.name);
    const columnsToAdd = [
      { name: 'content', type: 'TEXT DEFAULT \'\'', description: 'content 欄位' },
      { name: 'team_id', type: 'INTEGER DEFAULT NULL', description: 'team_id 欄位' },
      { name: 'start_date', type: 'DATETIME DEFAULT NULL', description: 'start_date 欄位' },
      { name: 'due_date', type: 'DATETIME DEFAULT NULL', description: 'due_date 欄位' }
    ];
    
    columnsToAdd.forEach(({ name, type, description }) => {
      if (!columnNames.includes(name)) {
        db.run(`ALTER TABLE todos ADD COLUMN ${name} ${type}`, (err) => {
          if (err) {
            console.error(`添加 ${description} 失敗:`, err.message);
          } else {
            console.log(`已為 todos 資料表添加 ${description}`);
          }
        });
      }
    });
  });
};

// 初始化資料庫
initializeTables();

module.exports = db;

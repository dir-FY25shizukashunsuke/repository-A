const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath);

// データベース初期化
const initializeDatabase = () => {
  db.serialize(() => {
    // Users テーブルを作成
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
};

// ユーザーを登録
const registerUser = (username, email, password, callback) => {
  // パスワードをハッシュ化
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return callback(err);
    }

    const query = `
      INSERT INTO users (username, email, password)
      VALUES (?, ?, ?)
    `;

    db.run(query, [username, email, hashedPassword], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return callback(new Error('ユーザー名またはメールアドレスは既に登録されています'));
        }
        return callback(err);
      }
      callback(null, { id: this.lastID, username, email });
    });
  });
};

// ユーザーを取得
const getUserByUsername = (username, callback) => {
  const query = 'SELECT * FROM users WHERE username = ?';
  db.get(query, [username], (err, row) => {
    callback(err, row);
  });
};

// 全ユーザーを取得
const getAllUsers = (callback) => {
  const query = 'SELECT id, username, email, created_at FROM users';
  db.all(query, (err, rows) => {
    callback(err, rows);
  });
};

// パスワードを検証
const verifyPassword = (plainPassword, hashedPassword, callback) => {
  bcrypt.compare(plainPassword, hashedPassword, callback);
};

// ユーザーを削除（IDで）
const deleteUserById = (id, callback) => {
  const query = 'DELETE FROM users WHERE id = ?';
  db.run(query, [id], function (err) {
    if (err) return callback(err);
    if (this.changes === 0) return callback(new Error('ユーザーが見つかりません'));
    callback(null);
  });
};

// ユーザーをIDで取得
const getUserById = (id, callback) => {
  const query = 'SELECT id, username, email, created_at FROM users WHERE id = ?';
  db.get(query, [id], (err, row) => {
    if (err) return callback(err);
    if (!row) return callback(new Error('ユーザーが見つかりません'));
    callback(null, row);
  });
};

// ユーザーを更新
const updateUser = (id, updates, callback) => {
  const { username, email } = updates;
  let query = 'UPDATE users SET ';
  const params = [];
  const fields = [];

  if (username) {
    fields.push('username = ?');
    params.push(username);
  }
  if (email) {
    fields.push('email = ?');
    params.push(email);
  }

  if (fields.length === 0) {
    return callback(new Error('更新するフィールドが指定されていません'));
  }

  query += fields.join(', ') + ' WHERE id = ?';
  params.push(id);

  db.run(query, params, function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return callback(new Error('ユーザー名またはメールアドレスは既に登録されています'));
      }
      return callback(err);
    }
    if (this.changes === 0) return callback(new Error('ユーザーが見つかりません'));
    callback(null);
  });
};

// ユーザー統計を取得
const getUserStats = (callback) => {
  const query = 'SELECT COUNT(*) as count FROM users';
  db.get(query, [], (err, row) => {
    if (err) return callback(err);
    callback(null, { total_users: row.count });
  });
};

// データベースを閉じる
const closeDatabase = () => {
  db.close();
};

module.exports = {
  db,
  initializeDatabase,
  registerUser,
  getUserByUsername,
  getAllUsers,
  verifyPassword,
  deleteUserById,
  getUserById,
  updateUser,
  getUserStats,
  closeDatabase
};

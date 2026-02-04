const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = 3000;

// ミドルウェア
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// データベースを初期化
db.initializeDatabase();

// ホームエンドポイント
app.get('/', (req, res) => {
  res.json({ message: 'ユーザー登録API へようこそ！' });
});

// ユーザー登録エンドポイント
app.post('/api/users/register', (req, res) => {
  const { username, email, password, passwordConfirm } = req.body;

  // バリデーション
  if (!username || !email || !password || !passwordConfirm) {
    return res.status(400).json({ 
      error: 'すべてのフィールドを入力してください' 
    });
  }

  if (password !== passwordConfirm) {
    return res.status(400).json({ 
      error: 'パスワードが一致しません' 
    });
  }

  if (password.length < 6) {
    return res.status(400).json({ 
      error: 'パスワードは6文字以上である必要があります' 
    });
  }

  // メールアドレスの形式をチェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      error: '有効なメールアドレスを入力してください' 
    });
  }

  // ユーザーを登録
  db.registerUser(username, email, password, (err, user) => {
    if (err) {
      return res.status(400).json({ 
        error: err.message 
      });
    }

    res.status(201).json({ 
      message: 'ユーザーの登録が成功しました',
      user 
    });
  });
});

// ユーザー一覧取得エンドポイント
app.get('/api/users', (req, res) => {
  db.getAllUsers((err, users) => {
    if (err) {
      return res.status(500).json({ 
        error: 'ユーザー一覧取得に失敗しました' 
      });
    }

    res.json({ users });
  });
});


// ユーザー削除エンドポイント
app.delete('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: '無効なIDです' });
  }

  db.deleteUserById(id, (err) => {
    if (err) {
      if (err.message && err.message.includes('見つかりません')) {
        return res.status(404).json({ error: 'ユーザーが見つかりません' });
      }
      return res.status(500).json({ error: 'ユーザー削除に失敗しました' });
    }
    res.json({ message: 'ユーザーを削除しました' });
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバーがポート ${PORT} で起動しました`);
  console.log(`http://localhost:${PORT} にアクセスしてください`);
});

// グレースフルシャットダウン
process.on('SIGINT', () => {
  console.log('サーバーをシャットダウンしています...');
  db.closeDatabase();
  process.exit(0);
});

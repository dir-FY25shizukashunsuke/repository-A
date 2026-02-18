// ランダムな数字を返すAPI
app.get('/api/random', (req, res) => {
  const randomNum = Math.floor(Math.random() * 100) + 1;
  res.json({ number: randomNum });
});
// サーバーの稼働時間を返すAPI
const serverStart = Date.now();

app.get('/api/uptime', (req, res) => {
  const uptimeSec = Math.floor((Date.now() - serverStart) / 1000);
  res.json({ uptime: uptimeSec });
});
// ランダムな名言を返すAPI
const quotes = [
  '継続は力なり',
  '失敗は成功のもと',
  '思い立ったが吉日',
  '七転び八起き',
  '急がば回れ'
];

app.get('/api/quote', (req, res) => {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  res.json({ quote: quotes[randomIndex] });
});
// サーバーの現在時刻を返すAPI
const express = require('express');
const app = express();

app.get('/api/time', (req, res) => {
  const now = new Date();
  res.json({ time: now.toISOString() });
});

// 既存のサーバー起動処理があればそのまま利用してください
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

// ユーザー更新エンドポイント (名前とメールのみ)
app.patch('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { username, email } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ error: '無効なIDです' });
  }

  if (!username && !email) {
    return res.status(400).json({ error: '更新するフィールドを指定してください' });
  }

  db.updateUser(id, { username, email }, (err) => {
    if (err) {
      if (err.message === 'ユーザーが見つかりません') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
    res.json({ message: 'ユーザー情報を更新しました' });
  });
});

// API情報取得エンドポイント

// ランダムな色を返すAPI
app.get('/api/color', (req, res) => {
  const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FFD700', '#FF1493', '#00CED1', '#FF4500'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  res.json({ color: randomColor });
});

// 簡単な計算API (足し算)
app.get('/api/calculate', (req, res) => {
  const { a, b } = req.query;
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  
  if (isNaN(numA) || isNaN(numB)) {
    return res.status(400).json({ error: 'パラメータaとbに数値を指定してください' });
  }
  
  res.json({ 
    a: numA, 
    b: numB, 
    sum: numA + numB 
  });
});

// 今日の運勢を返すAPI
app.get('/api/fortune', (req, res) => {
  const fortunes = [
    { level: '大吉', message: '素晴らしい一日になるでしょう！', luckyNumber: 7 },
    { level: '中吉', message: '良いことがありそうです。', luckyNumber: 3 },
    { level: '小吉', message: '穏やかな一日になりそうです。', luckyNumber: 5 },
    { level: '吉', message: '前向きに過ごしましょう。', luckyNumber: 9 },
    { level: '末吉', message: '焦らず着実に進みましょう。', luckyNumber: 2 },
    { level: '凶', message: '慎重に行動すれば大丈夫。', luckyNumber: 1 }
  ];
  
  const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];
  res.json(randomFortune);
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

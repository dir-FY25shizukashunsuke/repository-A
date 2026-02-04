# ユーザー登録アプリケーション

このプロジェクトはサブモジュール学習用のシンプルなユーザー登録機能を実装したアプリケーションです。

## 機能

- ユーザー登録（username, email, password）
- パスワードのハッシュ化（Werkzeug使用）
- ユーザー一覧の取得
- バリデーション機能

## セットアップ

### 必要な環境

- Python 3.7以上
- pip

### インストール

1. 依存ライブラリをインストール

```bash
pip install -r requirements.txt
```

2. サーバーを起動

```bash
python app.py
```

サーバーはデフォルトでポート5000で起動します。

## API エンドポイント

### 1. ホーム
- **URL**: `GET /`
- **説明**: APIの確認用エンドポイント

**レスポンス例**:
```json
{
  "message": "ユーザー登録API へようこそ！"
}
```

### 2. ユーザー登録
- **URL**: `POST /api/users/register`
- **説明**: 新しいユーザーを登録します

**リクエストボディ**:
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "passwordConfirm": "password123"
}
```

**バリデーション**:
- すべてのフィールドが必須です
- パスワードは確認欄と一致する必要があります
- パスワードは6文字以上である必要があります
- メールアドレスは有効な形式である必要があります
- usernameとemailはユニークである必要があります

**成功レスポンス** (201 Created):
```json
{
  "message": "ユーザーの登録が成功しました",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "created_at": "2024-02-04T12:34:56"
  }
}
```

**エラーレスポンス** (400 Bad Request):
```json
{
  "error": "エラーメッセージ"
}
```

### 3. ユーザー一覧取得
- **URL**: `GET /api/users`
- **説明**: すべての登録済みユーザーを取得します（パスワード除外）

**レスポンス例** (200 OK):
```json
{
  "users": [
    {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "created_at": "2024-02-04T12:34:56"
    }
  ]
}
```

## テスト例

### cURLを使った登録テスト

```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"test_user\",\"email\":\"test@example.com\",\"password\":\"password123\",\"passwordConfirm\":\"password123\"}"
```

### ユーザー一覧を取得

```bash
curl http://localhost:5000/api/users
```

## プロジェクト構成

```
.
├── app.py             # メインのFlaskアプリケーション
├── requirements.txt   # Python依存ライブラリ
├── .gitignore         # Git除外ファイル
├── users.db           # SQLiteデータベース（初回実行時に作成）
└── README.md          # このファイル
```

## 使用技術

- **Flask**: Webフレームワーク
- **Flask-SQLAlchemy**: ORM
- **SQLite**: データベース
- **Werkzeug**: パスワードハッシュ化

## ライセンス

MIT

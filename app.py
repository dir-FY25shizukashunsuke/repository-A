from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
import re

app = Flask(__name__)

# データベース設定
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "users.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_AS_ASCII'] = False

db = SQLAlchemy(app)

# ユーザーモデル
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp)
    
    def to_dict(self, include_password=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        if include_password:
            data['password'] = self.password
        return data

# データベース初期化
with app.app_context():
    db.create_all()

# ホームエンドポイント
@app.route('/', methods=['GET'])
def home():
    return jsonify({'message': 'ユーザー登録API へようこそ！'})

# ユーザー登録エンドポイント
@app.route('/api/users/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # バリデーション
    if not data:
        return jsonify({'error': 'リクエストボディがありません'}), 400
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    password_confirm = data.get('passwordConfirm')
    
    if not username or not email or not password or not password_confirm:
        return jsonify({'error': 'すべてのフィールドを入力してください'}), 400
    
    if password != password_confirm:
        return jsonify({'error': 'パスワードが一致しません'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'パスワードは6文字以上である必要があります'}), 400
    
    # メールアドレスの形式をチェック
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_regex, email):
        return jsonify({'error': '有効なメールアドレスを入力してください'}), 400
    
    # ユーザーが既に存在するかチェック
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'ユーザー名は既に登録されています'}), 400
    
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'メールアドレスは既に登録されています'}), 400
    
    # ユーザーを作成
    hashed_password = generate_password_hash(password)
    new_user = User(username=username, email=email, password=hashed_password)
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({
            'message': 'ユーザーの登録が成功しました',
            'user': new_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ユーザー一覧取得エンドポイント
@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        users = User.query.all()
        return jsonify({'users': [user.to_dict() for user in users]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ユーザー一件取得エンドポイント
@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'ユーザーが見つかりません'}), 404
        return jsonify({'user': user.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ユーザー更新エンドポイント (名前とメールのみ)
@app.route('/api/users/<int:user_id>', methods=['PATCH'])
def update_user(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'ユーザーが見つかりません'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'リクエストボディがありません'}), 400
        
        username = data.get('username')
        email = data.get('email')
        
        if not username and not email:
            return jsonify({'error': '更新するフィールドを指定してください'}), 400
        
        if username:
            if User.query.filter(User.username == username, User.id != user_id).first():
                return jsonify({'error': 'ユーザー名は既に登録されています'}), 400
            user.username = username
        
        if email:
            if User.query.filter(User.email == email, User.id != user_id).first():
                return jsonify({'error': 'メールアドレスは既に登録されています'}), 400
            user.email = email
            
        db.session.commit()
        return jsonify({'message': 'ユーザー情報を更新しました', 'user': user.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ユーザー統計取得エンドポイント
@app.route('/api/users/stats', methods=['GET'])
def get_user_stats():
    try:
        total_users = User.query.count()
        return jsonify({'total_users': total_users}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ユーザー削除エンドポイント
@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'ユーザーが見つかりません'}), 404
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'ユーザーを削除しました', 'user': user.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# エラーハンドリング
@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'エンドポイントが見つかりません'}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({'error': 'サーバーエラーが発生しました'}), 500

if __name__ == '__main__':
    print('サーバーがポート 5000 で起動しました')
    print('http://localhost:5000 にアクセスしてください')
    app.run(debug=True, port=5000)

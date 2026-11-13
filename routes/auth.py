from flask import Blueprint, request, jsonify
import secrets
from utils.db import get_db
from utils.helpers import hash_password, verify_token

# ============================
# AUTH BLUEPRINT
# ============================
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not name or not email or not password:
        return jsonify({'error': 'All fields are required'}), 400
    
    conn = get_db()
    c = conn.cursor()
    
    try:
        hashed_pw = hash_password(password)
        c.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                  (name, email, hashed_pw))
        conn.commit()
        user_id = c.lastrowid
        
        token = secrets.token_urlsafe(32)
        c.execute('INSERT INTO sessions (user_id, token) VALUES (?, ?)',
                  (user_id, token))
        conn.commit()
        
        return jsonify({
            'message': 'Signup successful',
            'token': token,
            'user': {'id': user_id, 'name': name, 'email': email}
        }), 201
    except Exception as e:
        if 'UNIQUE constraint' in str(e):
            return jsonify({'error': 'Email already exists'}), 400
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    conn = get_db()
    c = conn.cursor()
    
    hashed_pw = hash_password(password)
    c.execute('SELECT id, name, email FROM users WHERE email = ? AND password = ?',
              (email, hashed_pw))
    user = c.fetchone()
    
    if not user:
        conn.close()
        return jsonify({'error': 'Invalid credentials'}), 401
    
    token = secrets.token_urlsafe(32)
    c.execute('INSERT INTO sessions (user_id, token) VALUES (?, ?)',
              (user[0], token))
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {'id': user[0], 'name': user[1], 'email': user[2]}
    }), 200


@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    conn = get_db()
    c = conn.cursor()
    c.execute('DELETE FROM sessions WHERE token = ?', (token,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Logout successful'}), 200


@auth_bp.route('/api/verify', methods=['GET'])
def verify():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    user_id = verify_token(token)
    if not user_id:
        return jsonify({'error': 'Invalid token'}), 401
    
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT id, name, email FROM users WHERE id = ?', (user_id,))
    user = c.fetchone()
    conn.close()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': {'id': user[0], 'name': user[1], 'email': user[2]}
    }), 200

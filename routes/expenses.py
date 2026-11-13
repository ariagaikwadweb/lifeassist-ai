from flask import Blueprint, request, jsonify
import re
from utils.db import get_db
from utils.helpers import verify_token

# ============================
# EXPENSES BLUEPRINT
# ============================
expenses_bp = Blueprint('expenses', __name__)


@expenses_bp.route('/api/expenses', methods=['GET'])
def get_expenses():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db()
    c = conn.cursor()
    c.execute('''SELECT id, name, category, amount, date, created_at 
                 FROM expenses WHERE user_id = ? ORDER BY date DESC''',
              (user_id,))
    
    expenses = [{
        'id': row[0],
        'name': row[1],
        'category': row[2],
        'amount': row[3],
        'date': row[4],
        'created_at': row[5]
    } for row in c.fetchall()]
    
    conn.close()
    return jsonify({'expenses': expenses}), 200


@expenses_bp.route('/api/expenses', methods=['POST'])
def add_expense():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    name = data.get('name')
    category = data.get('category')
    amount = data.get('amount')
    date = data.get('date')
    
    if not all([name, category, amount, date]):
        return jsonify({'error': 'All fields are required'}), 400
    
    # Validate expense name contains at least one letter
    if not re.search(r'[a-zA-Z]', name):
        return jsonify({'error': 'Expense name must contain at least one letter, not just numbers'}), 400
    
    conn = get_db()
    c = conn.cursor()
    c.execute('''INSERT INTO expenses (user_id, name, category, amount, date)
                 VALUES (?, ?, ?, ?, ?)''',
              (user_id, name, category, float(amount), date))
    conn.commit()
    expense_id = c.lastrowid
    conn.close()
    
    return jsonify({
        'message': 'Expense added successfully',
        'expense': {
            'id': expense_id,
            'name': name,
            'category': category,
            'amount': float(amount),
            'date': date
        }
    }), 201


@expenses_bp.route('/api/expenses/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    name = data.get('name')
    category = data.get('category')
    amount = data.get('amount')
    date = data.get('date')
    
    if not all([name, category, amount, date]):
        return jsonify({'error': 'All fields are required'}), 400
    
    # Validate expense name contains at least one letter
    if not re.search(r'[a-zA-Z]', name):
        return jsonify({'error': 'Expense name must contain at least one letter, not just numbers'}), 400
    
    conn = get_db()
    c = conn.cursor()
    
    c.execute('SELECT id FROM expenses WHERE id = ? AND user_id = ?',
              (expense_id, user_id))
    if not c.fetchone():
        conn.close()
        return jsonify({'error': 'Expense not found or unauthorized'}), 404
    
    c.execute('''UPDATE expenses 
                 SET name = ?, category = ?, amount = ?, date = ?
                 WHERE id = ? AND user_id = ?''',
              (name, category, float(amount), date, expense_id, user_id))
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Expense updated successfully',
        'expense': {
            'id': expense_id,
            'name': name,
            'category': category,
            'amount': float(amount),
            'date': date
        }
    }), 200


@expenses_bp.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db()
    c = conn.cursor()
    
    c.execute('SELECT id FROM expenses WHERE id = ? AND user_id = ?',
              (expense_id, user_id))
    if not c.fetchone():
        conn.close()
        return jsonify({'error': 'Expense not found or unauthorized'}), 404
    
    c.execute('DELETE FROM expenses WHERE id = ? AND user_id = ?',
              (expense_id, user_id))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Expense deleted successfully'}), 200

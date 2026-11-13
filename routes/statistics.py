from flask import Blueprint, request, jsonify
from utils.db import get_db
from utils.helpers import verify_token

# ============================
# STATISTICS BLUEPRINT
# ============================
statistics_bp = Blueprint('statistics', __name__)


@statistics_bp.route('/api/statistics', methods=['GET'])
def get_statistics():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db()
    c = conn.cursor()
    
    c.execute('SELECT SUM(amount) FROM expenses WHERE user_id = ?', (user_id,))
    total = c.fetchone()[0] or 0
    
    c.execute('''SELECT category, SUM(amount) 
                 FROM expenses WHERE user_id = ?
                 GROUP BY category''', (user_id,))
    category_breakdown = {row[0]: row[1] for row in c.fetchall()}
    
    c.execute('SELECT COUNT(*) FROM expenses WHERE user_id = ?', (user_id,))
    count = c.fetchone()[0]
    
    conn.close()
    
    return jsonify({
        'total': total,
        'category_breakdown': category_breakdown,
        'count': count,
        'daily_average': total / 30 if count > 0 else 0
    }), 200


@statistics_bp.route('/api/statistics/timeseries', methods=['GET'])
def statistics_timeseries():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    granularity = request.args.get('granularity', 'monthly').lower()
    
    conn = get_db()
    c = conn.cursor()
    
    if granularity == 'weekly':
        group_expr = "strftime('%Y-W%W', date)"
    else:
        group_expr = "strftime('%Y-%m', date)"
    
    c.execute(f'''
        SELECT {group_expr} AS bucket, SUM(amount)
        FROM expenses
        WHERE user_id = ?
        GROUP BY bucket
        ORDER BY bucket ASC
    ''', (user_id,))
    
    rows = c.fetchall()
    conn.close()
    
    # Convert to dict
    bucket_map = {bucket: total for bucket, total in rows}

    # ---- ADD MISSING MONTHS HERE ----
    if granularity == "monthly":
        if rows:
            first = rows[0][0]      # e.g., "2024-01"
            last = rows[-1][0]      # e.g., "2024-06"
            
            first_year, first_month = map(int, first.split("-"))
            last_year, last_month = map(int, last.split("-"))
            
            labels = []
            y, m = first_year, first_month
            
            while (y < last_year) or (y == last_year and m <= last_month):
                labels.append(f"{y}-{m:02d}")
                m += 1
                if m > 12:
                    m = 1
                    y += 1
            
            values = [ bucket_map.get(label, 0) for label in labels ]
        else:
            labels, values = [], []
    
    else:
        labels = [bucket for bucket, _ in rows]
        values = [total for _, total in rows]
    
    return jsonify({
        'labels': labels,
        'values': values,
        'granularity': granularity
    }), 200

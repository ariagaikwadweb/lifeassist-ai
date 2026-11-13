from flask import Blueprint, request, jsonify, send_file, Response
from datetime import datetime
import csv
import io
from utils.db import get_db
from utils.helpers import verify_token

# Try to import openpyxl for Excel support
try:
    openpyxl_available = True
    from openpyxl import Workbook, load_workbook
    from openpyxl.utils import get_column_letter
except Exception:
    openpyxl_available = False

# ============================
# EXPORT/IMPORT BLUEPRINT
# ============================
export_import_bp = Blueprint('export_import', __name__)


@export_import_bp.route('/api/export', methods=['GET'])
def export_data():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    export_format = request.args.get('format', 'csv').lower()
    
    conn = get_db()
    c = conn.cursor()
    c.execute('''SELECT id, name, category, amount, date, created_at 
                 FROM expenses WHERE user_id = ? ORDER BY date ASC''',
              (user_id,))
    rows = c.fetchall()
    conn.close()
    
    headers = ['id', 'name', 'category', 'amount', 'date', 'created_at']
    
    # EXCEL EXPORT
    if export_format == 'xlsx':
        if not openpyxl_available:
            return jsonify({'error': 'Excel export not available'}), 400
        
        output = io.BytesIO()
        wb = Workbook()
        ws = wb.active
        ws.title = "Expenses"
        ws.append(headers)
        
        for r in rows:
            ws.append(list(r))
        
        for idx, header in enumerate(headers, start=1):
            max_len = len(header)
            for row in ws.iter_rows(min_col=idx, max_col=idx, min_row=2):
                if row[0].value:
                    max_len = max(max_len, len(str(row[0].value)))
            ws.column_dimensions[get_column_letter(idx)].width = min(max_len + 2, 60)
        
        wb.save(output)
        output.seek(0)
        
        return send_file(
            output,
            as_attachment=True,
            download_name='expenses.xlsx',
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
    
    # CSV EXPORT
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for r in rows:
        writer.writerow(r)
    
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=expenses.csv'}
    )


@export_import_bp.route('/api/import', methods=['POST'])
def import_data():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    user_id = verify_token(token)
    
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    filename = (file.filename or '').lower()
    
    required_fields = {'name', 'category', 'amount', 'date'}
    imported = 0
    skipped = 0
    
    conn = get_db()
    c = conn.cursor()
    
    try:
        # XLSX
        if filename.endswith('.xlsx'):
            if not openpyxl_available:
                return jsonify({'error': 'Excel not available on server'}), 400
            
            in_mem = io.BytesIO(file.read())
            wb = load_workbook(in_mem, read_only=True, data_only=True)
            ws = wb.active
            
            rows = list(ws.values)
            headers = [str(h).lower() for h in rows[0]]
            
            if not required_fields.issubset(headers):
                return jsonify({'error': 'Excel must contain name, category, amount, date'}), 400
            
            for row in rows[1:]:
                try:
                    row_map = {headers[i]: row[i] for i in range(len(headers))}
                    name = str(row_map['name'])
                    category = str(row_map['category'])
                    amount = float(row_map['amount'])
                    date_str = str(row_map['date'])
                    datetime.fromisoformat(date_str)
                    
                    c.execute('''INSERT INTO expenses (user_id, name, category, amount, date)
                                 VALUES (?, ?, ?, ?, ?)''',
                              (user_id, name, category, amount, date_str))
                    imported += 1
                except:
                    skipped += 1
        
        # CSV
        else:
            stream = io.StringIO(file.stream.read().decode('utf-8', errors='ignore'))
            reader = csv.DictReader(stream)
            
            headers = {h.lower() for h in reader.fieldnames}
            if not required_fields.issubset(headers):
                return jsonify({'error': 'CSV must contain name, category, amount, date'}), 400
            
            for row in reader:
                try:
                    name = row.get('name', '')
                    category = row.get('category', '')
                    amount = float(row.get('amount', 0))
                    date_str = row.get('date', '')
                    datetime.fromisoformat(date_str)
                    
                    c.execute('''INSERT INTO expenses (user_id, name, category, amount, date)
                                 VALUES (?, ?, ?, ?, ?)''',
                              (user_id, name, category, amount, date_str))
                    imported += 1
                except:
                    skipped += 1
    
        conn.commit()
    
    finally:
        conn.close()
    
    return jsonify({
        'message': 'Import completed',
        'imported': imported,
        'skipped': skipped
    }), 200

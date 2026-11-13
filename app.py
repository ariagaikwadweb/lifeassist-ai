from flask import Flask
from flask_cors import CORS

from config import DEBUG, HOST, PORT
from utils.db import init_db
from routes.auth import auth_bp
from routes.expenses import expenses_bp
from routes.statistics import statistics_bp
from routes.export_import import export_import_bp

# ============================
# FLASK APP SETUP
# ============================
app = Flask(__name__, static_folder='static')
CORS(app)  # Enable CORS for frontend communication

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(expenses_bp)
app.register_blueprint(statistics_bp)
app.register_blueprint(export_import_bp)

# ============================
# MAIN
# ============================
if __name__ == '__main__':
    init_db()
    print("Database initialized!")
    print(f"Backend running at http://127.0.0.1:{PORT}")
    app.run(debug=DEBUG, host=HOST, port=PORT, use_reloader=False)

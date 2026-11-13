import hashlib
from utils.db import get_db

# ============================
# HELPER FUNCTIONS
# ============================

def hash_password(password):
    """Hash a password using SHA256."""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_token(token):
    """Verify a session token and return user_id if valid."""
    conn = get_db()
    c = conn.cursor()
    c.execute('SELECT user_id FROM sessions WHERE token = ?', (token,))
    result = c.fetchone()
    conn.close()
    return result[0] if result else None

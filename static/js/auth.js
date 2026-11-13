// ============================
// AUTHENTICATION FUNCTIONS
// ============================

// Load user from localStorage
async function loadUser() {
    const token = localStorage.getItem('lifeassist_token');
    if (!token) return;

    authToken = token;
    try {
        const data = await apiCall('/verify');
        currentUser = data.user;
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userInfo').style.display = 'flex';
        showSection('home');
        loadExpenses();
    } catch (err) {
        console.error('Verify failed:', err);
        localStorage.removeItem('lifeassist_token');
        authToken = null;
        showSection('auth');
    }
}

// Login form handler
document.getElementById('login-form').onsubmit = async function (e) {
    e.preventDefault();
    const btn = document.getElementById('loginBtn');
    const errDiv = document.getElementById('login-error');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in…';
    errDiv.innerHTML = '';

    try {
        const data = await apiCall('/login', 'POST', {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value,
        });
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('lifeassist_token', authToken);

        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userInfo').style.display = 'flex';
        showSection('home');
        this.reset();
        loadExpenses();
    } catch (err) {
        errDiv.innerHTML =
            '<div class="error-msg"><i class="fas fa-exclamation-circle"></i> ' +
            err.message +
            '</div>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    }
};

// Signup form handler
document.getElementById('signup-form').onsubmit = async function (e) {
    e.preventDefault();
    const btn = document.getElementById('signupBtn');
    const errDiv = document.getElementById('signup-error');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing up…';
    errDiv.innerHTML = '';

    try {
        const data = await apiCall('/signup', 'POST', {
            name: document.getElementById('signup-name').value,
            email: document.getElementById('signup-email').value,
            password: document.getElementById('signup-password').value,
        });

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('lifeassist_token', authToken);

        errDiv.innerHTML =
            '<div class="success-msg"><i class="fas fa-check-circle"></i> Signup successful! Redirecting…</div>';

        setTimeout(() => {
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('userInfo').style.display = 'flex';
            showSection('home');
            this.reset();
            loadExpenses();
        }, 1200);
    } catch (err) {
        errDiv.innerHTML =
            '<div class="error-msg"><i class="fas fa-exclamation-circle"></i> ' +
            err.message +
            '</div>';
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Sign Up';
    }
};

// Show signup card
function showSignup() {
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('signupCard').style.display = 'block';
    document.getElementById('login-error').innerHTML = '';
    document.getElementById('signup-error').innerHTML = '';
}

// Show login card
function showLogin() {
    document.getElementById('loginCard').style.display = 'block';
    document.getElementById('signupCard').style.display = 'none';
    document.getElementById('login-error').innerHTML = '';
    document.getElementById('signup-error').innerHTML = '';
}

// Logout
async function logout() {
    try {
        await apiCall('/logout', 'POST');
    } catch (err) {
        console.error('Logout error:', err);
    }
    localStorage.removeItem('lifeassist_token');
    authToken = null;
    currentUser = null;
    expenses = [];
    document.getElementById('userInfo').style.display = 'none';
    showSection('auth');
}

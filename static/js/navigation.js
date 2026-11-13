// ============================
// NAVIGATION & THEME
// ============================

function showSection(id) {
    if (!currentUser && id !== 'auth') {
        document.querySelectorAll('.section').forEach(s =>
            s.classList.remove('active')
        );
        document.getElementById('auth').classList.add('active');
        return;
    }

    document.querySelectorAll('.section').forEach(s =>
        s.classList.remove('active')
    );
    const section = document.getElementById(id);
    if (section) section.classList.add('active');

    document.querySelectorAll('.nav-links a').forEach(a =>
        a.classList.remove('active')
    );
    const link = document.querySelector(`[data-section="${id}"]`);
    if (link) link.classList.add('active');

    window.scrollTo(0, 0);
    document.getElementById('navLinks').classList.remove('show');

    if (id === 'demo' && currentUser) loadExpenses();
    if (id === 'dashboard' && currentUser) loadDashboard();
    if (id === 'planner' && currentUser) loadPlanner();
}

function toggleMenu() {
    document.getElementById('navLinks').classList.toggle('show');
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('.theme-toggle i');
    if (document.body.classList.contains('dark-mode')) {
        icon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    } else {
        icon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    }
}

// Initialize theme from localStorage
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    document.querySelector('.theme-toggle i').className = 'fas fa-sun';
}

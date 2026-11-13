// ============================
// MAIN INITIALIZATION
// ============================

// Bill reminder (simple)
function checkBillReminders() {
    if (!currentUser) return;
    const today = new Date();
    const day = today.getDate();
    if (day >= 25 && day <= 30) {
        const hasElectricity = expenses.some(e => e.category === 'Electricity');
        if (hasElectricity) {
            setTimeout(() => {
                if (
                    confirm(
                        '🔔 Reminder: Electricity bill might be due soon! Do you want to add it to expenses?'
                    )
                ) {
                    showSection('demo');
                    document.getElementById('expense-category').value = 'Electricity';
                }
            }, 2000);
        }
    }
}

// Contact form (dummy)
const contactForm = document.getElementById('contact-form');
const contactStatus = document.getElementById('contact-status');
contactForm.onsubmit = function (e) {
    e.preventDefault();
    contactStatus.innerHTML =
        '<div class="success-msg"><i class="fas fa-check-circle"></i> Message recorded (demo only).</div>';
    contactForm.reset();
};

// Initialize year span
document.getElementById('yearSpan').textContent =
    new Date().getFullYear();

// Initialize date input
const dateInput = document.getElementById('expense-date');
if (dateInput) dateInput.valueAsDate = new Date();

// Load user and check bill reminders
(async () => {
    await loadUser();
    if (currentUser) checkBillReminders();
})();

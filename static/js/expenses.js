// ============================
// EXPENSE MANAGEMENT
// ============================

const expenseForm = document.getElementById('expense-form');
const expensesTableBody = document
    .getElementById('expenses-table')
    .querySelector('tbody');
const suggestionDiv = document.getElementById('suggestion');
const categoryBarsDiv = document.getElementById('category-bars');
const summaryCardsDiv = document.getElementById('summaryCards');
const expensesLoading = document.getElementById('expenses-loading');

async function loadExpenses() {
    if (!currentUser) return;
    expensesLoading.style.display = 'block';
    try {
        const data = await apiCall('/expenses');
        expenses = data.expenses || [];
        renderExpenses();
    } catch (err) {
        console.error('Failed to load expenses:', err);
        alert('Failed to load expenses. Please try again.');
    } finally {
        expensesLoading.style.display = 'none';
    }
}

function renderExpenses() {
    expensesTableBody.innerHTML = '';
    if (!expenses.length) {
        expensesTableBody.innerHTML =
            '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">No expenses added yet.</td></tr>';
        summaryCardsDiv.innerHTML = '';
        categoryBarsDiv.innerHTML = '';
        suggestionDiv.innerHTML = '';
        return;
    }

    for (const e of expenses) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${e.name}</td>
      <td><span class="badge">${e.category}</span></td>
      <td>₹ ${Number(e.amount).toFixed(2)}</td>
      <td>${e.date}</td>
      <td>
        <button class="btn" style="padding:0.3rem 0.7rem;font-size:0.8rem;" onclick="editExpense(${e.id})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn" style="padding:0.3rem 0.7rem;font-size:0.8rem;background:#d9776f;" onclick="deleteExpense(${e.id})">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
        expensesTableBody.appendChild(tr);
    }

    renderSummary();
}

function renderSummary() {
    if (!expenses.length) {
        summaryCardsDiv.innerHTML = '';
        categoryBarsDiv.innerHTML = '';
        suggestionDiv.innerHTML = '';
        return;
    }

    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const byCategory = {};
    for (const e of expenses) {
        byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
    }
    const avgPerDay = total / 30;

    summaryCardsDiv.innerHTML = `
    <div class="summary-card">
      <div class="summary-card-title"><i class="fas fa-wallet"></i> Total Spend</div>
      <div class="summary-card-value">₹ ${total.toFixed(2)}</div>
      <div class="summary-card-note">Based on all recorded expenses.</div>
    </div>
    <div class="summary-card">
      <div class="summary-card-title"><i class="fas fa-calendar-day"></i> Approx. Daily</div>
      <div class="summary-card-value">₹ ${avgPerDay.toFixed(0)}</div>
      <div class="summary-card-note">Total / 30 days.</div>
    </div>
    <div class="summary-card">
      <div class="summary-card-title"><i class="fas fa-receipt"></i> Entries</div>
      <div class="summary-card-value">${expenses.length}</div>
      <div class="summary-card-note">Number of expense records.</div>
    </div>
  `;

    categoryBarsDiv.innerHTML = '';
    const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    for (const [cat, val] of sortedCats) {
        const percentage = (val / total) * 100;
        const bar = document.createElement('div');
        bar.style.marginBottom = '0.4rem';
        bar.innerHTML = `
      <div style="display:flex;justify-content:space-between;font-size:0.85rem;margin-bottom:0.1rem;">
        <span>${cat}</span>
        <span>₹ ${val.toFixed(0)} (${percentage.toFixed(1)}%)</span>
      </div>
      <div style="background:rgba(212,163,115,0.25);border-radius:999px;overflow:hidden;height:8px;">
        <div style="width:${percentage}%;height:100%;background:var(--primary);"></div>
      </div>
    `;
        categoryBarsDiv.appendChild(bar);
    }

    const top = sortedCats[0];
    if (top) {
        suggestionDiv.innerHTML =
            `<div class="success-msg"><i class="fas fa-lightbulb"></i> ` +
            `You are spending most on <b>${top[0]}</b>. ` +
            `Even a 10–15% reduction here could save around ` +
            `<b>₹ ${(top[1] * 0.15).toFixed(0)}</b> per month.</div>`;
    }
}

async function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    try {
        await apiCall('/expenses/' + id, 'DELETE');
        expenses = expenses.filter(e => e.id !== id);
        renderExpenses();
    } catch (err) {
        alert('Failed to delete. Please try again.');
    }
}

function editExpense(id) {
    const exp = expenses.find(e => e.id === id);
    if (!exp) return;
    document.getElementById('expense-name').value = exp.name;
    document.getElementById('expense-category').value = exp.category;
    document.getElementById('expense-amount').value = exp.amount;
    document.getElementById('expense-date').value = exp.date;
    document.getElementById('edit-id').value = id;

    document.getElementById('submitBtn').innerHTML =
        '<i class="fas fa-save"></i> Update Expense';
    document.getElementById('cancelBtn').style.display = 'inline-block';

    window.scrollTo(0, document.getElementById('expense-form').offsetTop - 100);
}

function cancelEdit() {
    expenseForm.reset();
    document.getElementById('submitBtn').innerHTML =
        '<i class="fas fa-plus"></i> Add Expense';
    document.getElementById('cancelBtn').style.display = 'none';
    document.getElementById('edit-id').value = '';
    document.getElementById('expense-date').valueAsDate = new Date();
}

expenseForm.onsubmit = async function (e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const editId = document.getElementById('edit-id').value;

    const expenseData = {
        name: document.getElementById('expense-name').value,
        category: document.getElementById('expense-category').value,
        amount: document.getElementById('expense-amount').value,
        date: document.getElementById('expense-date').value,
    };

    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';

    try {
        if (editId) {
            await apiCall('/expenses/' + editId, 'PUT', expenseData);
            const idx = expenses.findIndex(e => e.id == editId);
            if (idx !== -1) {
                expenses[idx] = { ...expenses[idx], ...expenseData };
            }
            cancelEdit();
        } else {
            const data = await apiCall('/expenses', 'POST', expenseData);
            expenses.unshift(data.expense);
        }
        renderExpenses();
        expenseForm.reset();
        document.getElementById('expense-date').valueAsDate = new Date();
    } catch (err) {
        alert(err.message || 'Expense name must contain at least one letter, not just numbers.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
};

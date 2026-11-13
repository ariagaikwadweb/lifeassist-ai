// ============================
// EXPORT / IMPORT
// ============================

async function downloadData(format) {
    try {
        const res = await fetch(
            API_URL + '/export?format=' + format,
            {
                headers: authToken
                    ? { Authorization: 'Bearer ' + authToken }
                    : {},
            }
        );
        if (!res.ok) {
            throw new Error('Failed to export data');
        }
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = format === 'xlsx' ? 'expenses.xlsx' : 'expenses.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        alert(err.message || 'Export failed');
    }
}

async function importData(event) {
    const file = event.target.files[0];
    const statusEl = document.getElementById('importStatus');
    if (!file) return;

    statusEl.innerHTML =
        '<div class="success-msg"><i class="fas fa-spinner fa-spin"></i> Uploading file…</div>';

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(firstSheet);

        const payload = json.map(row => ({
            name: row.name || row.Name || 'Imported',
            category: row.category || row.Category || 'Other',
            amount: row.amount || row.Amount || 0,
            date: row.date || row.Date || new Date().toISOString().slice(0, 10),
        }));

        await apiCall('/import', 'POST', { expenses: payload });
        statusEl.innerHTML =
            '<div class="success-msg"><i class="fas fa-check-circle"></i> Import successful!</div>';
        loadExpenses();
    } catch (err) {
        console.error(err);
        statusEl.innerHTML =
            '<div class="error-msg"><i class="fas fa-exclamation-circle"></i> ' +
            (err.message || 'Import failed') +
            '</div>';
    } finally {
        event.target.value = '';
    }
}

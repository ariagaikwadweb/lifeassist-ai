// ============================
// DASHBOARD CHARTS
// ============================

async function loadDashboard() {
    try {
        const stats = await apiCall('/statistics');
        const categories = Object.keys(stats.category_breakdown || {});
        const values = Object.values(stats.category_breakdown || {});
        renderCategoryPie(categories, values);
        await loadTrendChart();
        await loadBudgetAI(stats);
    } catch (err) {
        console.error('Dashboard error:', err);
    }
}

function renderCategoryPie(labels, data) {
    const ctx = document.getElementById('categoryPie').getContext('2d');
    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: [
                        '#d4a373',
                        '#c4935f',
                        '#b5835a',
                        '#a68b73',
                        '#8c6d5a',
                        '#7f5d4f',
                    ],
                },
            ],
        },
        options: {
            plugins: { legend: { position: 'bottom' } },
        },
    });
}

async function loadTrendChart() {
    const granularity = document.getElementById('granularitySelect').value;
    try {
        const data = await apiCall(
            '/statistics/timeseries?granularity=' + granularity
        );
        const ctx = document.getElementById('trendLine').getContext('2d');

        // API returns data.labels and data.values
        const labels = data.labels || [];
        const values = data.values || [];

        if (trendChart) trendChart.destroy();
        trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: granularity === 'weekly' ? 'Weekly Total (₹)' : 'Monthly Total (₹)',
                        data: values,
                        fill: true,
                        borderColor: '#d4a373',
                        backgroundColor: 'rgba(212, 163, 115, 0.3)',
                        borderWidth: 3,
                        pointRadius: 6,
                        pointBackgroundColor: '#d4a373',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        tension: 0.3,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: { legend: { display: true, position: 'top' } },
                scales: {
                    x: { display: true },
                    y: { display: true, beginAtZero: true },
                },
            },
        });
    } catch (err) {
        console.error('Trend error:', err);
    }
}

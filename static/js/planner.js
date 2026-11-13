// ============================
// AI PLANNER (WHAT-IF)
// ============================

function updatePlannerSliderLabel(which) {
    const slider = document.getElementById('planner-' + which);
    const label = document.getElementById('planner-' + which + '-value');
    if (slider && label) {
        label.textContent = slider.value;
        recomputePlanner();
    }
}

async function loadPlanner() {
    try {
        const stats = await apiCall('/statistics');
        const ts = await apiCall('/statistics/timeseries?granularity=monthly');
        renderBudgetAI(stats, ts); // ensure baseline is set

        renderPlannerBaseline();
        updatePlannerSliderLabel('groceries');
        updatePlannerSliderLabel('electricity');
        updatePlannerSliderLabel('transport');
    } catch (err) {
        console.error('Planner load error:', err);
    }
}

function renderPlannerBaseline() {
    const div = document.getElementById('plannerBaselineSummary');
    if (!div) return;

    div.innerHTML = `
    <div class="summary-card">
      <div class="summary-card-title"><i class="fas fa-wallet"></i> Current Monthly Spend</div>
      <div class="summary-card-value">₹ ${baselineTotal.toFixed(0)}</div>
      <div class="summary-card-note">Based on your recorded data.</div>
    </div>
    <div class="summary-card">
      <div class="summary-card-title"><i class="fas fa-chart-trend"></i> Forecast (Next Month)</div>
      <div class="summary-card-value">₹ ${baselineForecast.toFixed(0)}</div>
      <div class="summary-card-note">If you continue the same pattern.</div>
    </div>
    <div class="summary-card">
      <div class="summary-card-title"><i class="fas fa-heartbeat"></i> Current Budget Health</div>
      <div class="summary-card-value">${baselineScore.toFixed(0)} / 100</div>
      <div class="summary-card-note">Before applying any changes.</div>
    </div>
  `;
}

function recomputePlanner() {
    const gReduce = Number(
        document.getElementById('planner-groceries')?.value || 0
    );
    const eReduce = Number(
        document.getElementById('planner-electricity')?.value || 0
    );
    const tReduce = Number(
        document.getElementById('planner-transport')?.value || 0
    );

    // Map keys
    const gBase = baselineBuckets.groc || 0;
    const eBase = baselineBuckets.elect || 0;
    const tBase = baselineBuckets.trans || 0;

    const gNew = gBase * (1 - gReduce / 100);
    const eNew = eBase * (1 - eReduce / 100);
    const tNew = tBase * (1 - tReduce / 100);

    const rentBase = baselineBuckets.rent || 0;
    const otherBase = baselineBuckets.other || 0;

    const newTotal =
        rentBase + otherBase + gNew + eNew + tNew;

    let totalSave =
        (gBase - gNew) + (eBase - eNew) + (tBase - tNew);

    // New score (rough heuristic)
    const ratio = baselineTotal ? newTotal / baselineTotal : 1;
    const newScore = Math.min(100, baselineScore + (1 - ratio) * 30);

    const summaryDiv = document.getElementById('plannerSummary');
    if (summaryDiv) {
        summaryDiv.innerHTML = `
      <div class="summary-card">
        <div class="summary-card-title"><i class="fas fa-wallet"></i> New Monthly Spend</div>
        <div class="summary-card-value">₹ ${newTotal.toFixed(0)}</div>
        <div class="summary-card-note">After applying your changes.</div>
      </div>
      <div class="summary-card">
        <div class="summary-card-title"><i class="fas fa-piggy-bank"></i> Estimated Savings</div>
        <div class="summary-card-value">₹ ${totalSave.toFixed(0)}</div>
        <div class="summary-card-note">Compared to current spending.</div>
      </div>
      <div class="summary-card">
        <div class="summary-card-title"><i class="fas fa-heartbeat"></i> New Budget Health</div>
        <div class="summary-card-value">${newScore.toFixed(0)} / 100</div>
        <div class="summary-card-note">If you maintain this change.</div>
      </div>
    `;
    }

    // Chart: before vs after for affected categories
    const ctx = document.getElementById('plannerChart').getContext('2d');
    const labels = ['Groceries', 'Electricity', 'Transport'];
    const beforeData = [gBase, eBase, tBase];
    const afterData = [gNew, eNew, tNew];

    if (plannerChart) plannerChart.destroy();
    plannerChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Before',
                    data: beforeData,
                },
                {
                    label: 'After',
                    data: afterData,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: {
                x: { stacked: false },
                y: { stacked: false },
            },
        },
    });
}

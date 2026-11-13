// ============================
// AI BUDGET COACH
// ============================

const RECOMMENDED_RANGES = [
    { key: 'rent', label: 'Rent / Housing', min: 25, max: 40 },
    { key: 'groc', label: 'Groceries', min: 15, max: 25 },
    { key: 'elect', label: 'Electricity / Utilities', min: 5, max: 10 },
    { key: 'trans', label: 'Transport', min: 5, max: 15 },
    { key: 'other', label: 'Other / Lifestyle', min: 5, max: 15 },
];

function mapCategoryToProfile(catName) {
    const n = (catName || '').toLowerCase();
    if (n.includes('rent') || n.includes('house') || n.includes('room'))
        return 'rent';
    if (n.includes('groc') || n.includes('food') || n.includes('mart'))
        return 'groc';
    if (n.includes('elect') || n.includes('power') || n.includes('bill'))
        return 'elect';
    if (
        n.includes('trans') ||
        n.includes('bus') ||
        n.includes('auto') ||
        n.includes('train')
    )
        return 'trans';
    return 'other';
}

function simpleLinearForecast(values) {
    if (!values || values.length < 2)
        return values && values.length ? values[values.length - 1] : 0;

    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    values.forEach((y, i) => {
        sumX += i;
        sumY += y;
        sumXY += i * y;
        sumXX += i * i;
    });
    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return values[values.length - 1];
    const m = (n * sumXY - sumX * sumY) / denom;
    const b = (sumY - m * sumX) / n;
    const nextX = n;
    return m * nextX + b;
}

async function loadBudgetAI(stats) {
    const aiSummaryDiv = document.getElementById('aiBudgetSummary');
    const aiInsightsDiv = document.getElementById('aiBudgetInsights');
    if (!aiSummaryDiv || !aiInsightsDiv) return;

    try {
        const ts = await apiCall('/statistics/timeseries?granularity=monthly');
        renderBudgetAI(stats, ts);
    } catch (err) {
        console.error('Budget AI error:', err);
        renderBudgetAI(stats, null);
    }
}

function renderBudgetAI(stats, timeseries) {
    const aiSummaryDiv = document.getElementById('aiBudgetSummary');
    const aiInsightsDiv = document.getElementById('aiBudgetInsights');
    if (!aiSummaryDiv || !aiInsightsDiv) return;

    const now = new Date();
    const ym =
        now.getFullYear() +
        '-' +
        String(now.getMonth() + 1).padStart(2, '0');

    // API returns timeseries.values (not points)
    const monthlyValues = (timeseries && timeseries.values) || [];
    const forecastNext = simpleLinearForecast(monthlyValues);
    const sum = stats.total || 0;

    const profileBuckets = { rent: 0, groc: 0, elect: 0, trans: 0, other: 0 };
    Object.entries(stats.category_breakdown || {}).forEach(([cat, amt]) => {
        const key = mapCategoryToProfile(cat);
        profileBuckets[key] += amt;
    });

    const percBuckets = {};
    for (const [k, v] of Object.entries(profileBuckets)) {
        percBuckets[k] = sum ? (v / sum) * 100 : 0;
    }

    let penalty = 0;
    for (const r of RECOMMENDED_RANGES) {
        const p = percBuckets[r.key] || 0;
        if (p < r.min) penalty += r.min - p;
        else if (p > r.max) penalty += p - r.max;
    }
    const health = Math.max(0, 100 - penalty);
    const healthLabel =
        health >= 80 ? 'Healthy' : health >= 60 ? 'Okay' : 'Needs Attention';

    // Save as baseline for planner
    baselineTotal = sum;
    baselineForecast = forecastNext;
    baselineScore = health;
    baselineBuckets = profileBuckets;

    aiSummaryDiv.innerHTML = `
    <div class="summary-card">
      <div class="summary-card-title"><i class="fas fa-calendar"></i> This Month Spend</div>
      <div class="summary-card-value">₹ ${sum.toFixed(0)}</div>
      <div class="summary-card-note">Month: ${ym}</div>
    </div>
    <div class="summary-card">
      <div class="summary-card-title"><i class="fas fa-chart-trend"></i> Next Month Forecast</div>
      <div class="summary-card-value">₹ ${forecastNext.toFixed(0)}</div>
      <div class="summary-card-note">Based on your past trend.</div>
    </div>
    <div class="summary-card">
      <div class="summary-card-title"><i class="fas fa-heartbeat"></i> Budget Health</div>
      <div class="summary-card-value">${health.toFixed(0)} / 100</div>
      <div class="summary-card-note">${healthLabel} distribution vs recommended ranges.</div>
    </div>
  `;

    let insightsHTML = '';
    RECOMMENDED_RANGES.forEach(r => {
        const p = percBuckets[r.key] || 0;
        const diffMin = p - r.min;
        const diffMax = p - r.max;

        let msg = '';
        if (p === 0 && profileBuckets[r.key] === 0) {
            msg = `No spending recorded for <b>${r.label}</b>.`;
        } else if (p < r.min) {
            msg =
                `You spend <b>${p.toFixed(1)}%</b> on <b>${r.label}</b> which is ` +
                `lower than the recommended <b>${r.min}-${r.max}%</b>. Make sure you are not under-investing in essentials.`;
        } else if (p > r.max) {
            msg =
                `You spend <b>${p.toFixed(1)}%</b> on <b>${r.label}</b> which is ` +
                `above the recommended <b>${r.min}-${r.max}%</b>. Try to slowly bring this closer to the range.`;
        } else {
            msg =
                `Your <b>${r.label}</b> spending (<b>${p.toFixed(1)}%</b>) is inside the recommended <b>${r.min}-${r.max}%</b>. Good job!`;
        }

        insightsHTML += `
      <div class="card" style="margin-top:0.7rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong>${r.label}</strong>
          <span style="font-size:0.8rem;color:var(--text-muted);">
            Current: ${p.toFixed(1)}% • Target: ${r.min}-${r.max}%
          </span>
        </div>
        <p style="margin-top:0.4rem;font-size:0.9rem;">${msg}</p>
      </div>
    `;
    });

    aiInsightsDiv.innerHTML = insightsHTML;
}

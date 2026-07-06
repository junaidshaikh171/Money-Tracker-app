const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CURRENCY = '₹';
const PALETTE = ['#1B4332', '#B5533C', '#A9822F', '#2F6E64', '#6B4E71', '#4A5850', '#C97B4A', '#3E6B8A'];

let entries = [];
let trendChart = null;
let breakdownChart = null;

const fmt = n => `${CURRENCY}${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const monthLabel = e => `${MONTH_NAMES[e.month]} ${e.year}`;

// --- Expense row builder ----------------------------------------------------

function addExpenseRow(category = '', amount = '') {
  const wrap = document.getElementById('expense-rows');
  const row = document.createElement('div');
  row.className = 'expense-row';
  row.innerHTML = `
    <input type="text" placeholder="Category (e.g. Rent)" class="exp-category" value="${category}">
    <input type="number" placeholder="Amount" min="0" step="0.01" class="exp-amount" value="${amount}">
    <button type="button" class="remove-row" title="Remove line">&times;</button>
  `;
  row.querySelector('.remove-row').addEventListener('click', () => row.remove());
  wrap.appendChild(row);
}

document.getElementById('add-expense').addEventListener('click', () => addExpenseRow());

// Start with a few blank lines so the form doesn't look empty.
addExpenseRow();
addExpenseRow();

// --- Data loading ------------------------------------------------------------

async function loadEntries() {
  const res = await fetch('/api/entries');
  entries = await res.json();
  renderAll();
}

function renderAll() {
  renderSummary();
  renderRegister();
  renderTrendChart();
  renderBreakdownControls();
}

// --- Summary cards + stamp ---------------------------------------------------

function renderSummary() {
  const totalIncome = entries.reduce((s, e) => s + e.income, 0);
  const totalExpenses = entries.reduce((s, e) => s + e.totalExpenses, 0);
  const totalSavings = totalIncome - totalExpenses;
  const avgRate = entries.length
    ? entries.reduce((s, e) => s + e.savingsRate, 0) / entries.length
    : 0;

  document.getElementById('sum-income').textContent = fmt(totalIncome);
  document.getElementById('sum-expenses').textContent = fmt(totalExpenses);
  document.getElementById('sum-savings').textContent = fmt(totalSavings);
  document.getElementById('sum-rate').textContent = `${avgRate.toFixed(1)}%`;

  const latest = entries[entries.length - 1];
  document.getElementById('latest-savings').textContent = latest ? fmt(latest.savings) : '—';
}

// --- Register table -----------------------------------------------------------

function renderRegister() {
  const body = document.getElementById('register-body');
  body.innerHTML = '';
  document.getElementById('empty-note').style.display = entries.length ? 'none' : 'block';

  entries.forEach(e => {
    const tr = document.createElement('tr');
    const savingsClass = e.savings >= 0 ? 'savings-positive' : 'savings-negative';
    tr.innerHTML = `
      <td>${monthLabel(e)}</td>
      <td>${fmt(e.income)}</td>
      <td>${fmt(e.totalExpenses)}</td>
      <td class="${savingsClass}">${fmt(e.savings)}</td>
      <td>${e.savingsRate.toFixed(1)}%</td>
      <td><button class="void-btn" data-id="${e.id}">Void</button></td>
    `;
    tr.querySelector('.void-btn').addEventListener('click', () => deleteEntry(e.id));
    body.appendChild(tr);
  });
}

async function deleteEntry(id) {
  await fetch(`/api/entries/${id}`, { method: 'DELETE' });
  await loadEntries();
}

// --- Trend chart (line: income / expenses / savings over time) --------------

function renderTrendChart() {
  const ctx = document.getElementById('trend-chart');
  const labels = entries.map(monthLabel);

  const data = {
    labels,
    datasets: [
      {
        label: 'Income',
        data: entries.map(e => e.income),
        borderColor: '#1B4332',
        backgroundColor: '#1B4332',
        tension: 0.25,
        pointRadius: 3
      },
      {
        label: 'Expenses',
        data: entries.map(e => e.totalExpenses),
        borderColor: '#B5533C',
        backgroundColor: '#B5533C',
        tension: 0.25,
        pointRadius: 3
      },
      {
        label: 'Savings',
        data: entries.map(e => e.savings),
        borderColor: '#A9822F',
        backgroundColor: '#A9822F',
        tension: 0.25,
        pointRadius: 3,
        borderDash: [6, 4]
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { font: { family: 'IBM Plex Mono' }, color: '#20302B' }
      }
    },
    scales: {
      x: { ticks: { font: { family: 'IBM Plex Mono' }, color: '#4A5850' }, grid: { display: false } },
      y: { ticks: { font: { family: 'IBM Plex Mono' }, color: '#4A5850' }, grid: { display: false } }
    }
  };

  if (trendChart) {
    trendChart.data = data;
    trendChart.update();
  } else {
    trendChart = new Chart(ctx, { type: 'line', data, options });
  }
}

// --- Breakdown chart (doughnut: one month's expense categories) -------------

function renderBreakdownControls() {
  const select = document.getElementById('breakdown-month');
  const prevValue = select.value;
  select.innerHTML = '';

  entries.forEach(e => {
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = monthLabel(e);
    select.appendChild(opt);
  });

  if (entries.length) {
    select.value = entries.some(e => e.id === prevValue) ? prevValue : entries[entries.length - 1].id;
  }

  select.onchange = renderBreakdownChart;
  renderBreakdownChart();
}

function renderBreakdownChart() {
  const select = document.getElementById('breakdown-month');
  const legend = document.getElementById('breakdown-legend');
  const entry = entries.find(e => e.id === select.value);
  const ctx = document.getElementById('breakdown-chart');

  legend.innerHTML = '';

  if (!entry || !entry.expenses.length) {
    if (breakdownChart) { breakdownChart.destroy(); breakdownChart = null; }
    legend.innerHTML = '<li>No expense lines recorded for this month.</li>';
    return;
  }

  const labels = entry.expenses.map(e => e.category);
  const values = entry.expenses.map(e => e.amount);
  const colors = labels.map((_, i) => PALETTE[i % PALETTE.length]);

  const data = {
    labels,
    datasets: [{ data: values, backgroundColor: colors, borderColor: '#FAF4E4', borderWidth: 2 }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }
  };

  if (breakdownChart) {
    breakdownChart.data = data;
    breakdownChart.update();
  } else {
    breakdownChart = new Chart(ctx, { type: 'doughnut', data, options });
  }

  labels.forEach((label, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="legend-swatch" style="background:${colors[i]}"></span>${label} — ${fmt(values[i])}`;
    legend.appendChild(li);
  });
}

// --- Form submit ---------------------------------------------------------------

document.getElementById('entry-form').addEventListener('submit', async (evt) => {
  evt.preventDefault();
  const errorEl = document.getElementById('form-error');
  errorEl.textContent = '';

  const month = document.getElementById('month').value;
  const year = document.getElementById('year').value;
  const income = document.getElementById('income').value;

  const expenses = Array.from(document.querySelectorAll('.expense-row')).map(row => ({
    category: row.querySelector('.exp-category').value.trim(),
    amount: row.querySelector('.exp-amount').value
  })).filter(e => e.category && e.amount !== '');

  const res = await fetch('/api/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ month, year, income, expenses })
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    errorEl.textContent = body.error || 'Something went wrong filing that entry.';
    return;
  }

  document.getElementById('entry-form').reset();
  document.getElementById('expense-rows').innerHTML = '';
  addExpenseRow();
  addExpenseRow();

  await loadEntries();
});

loadEntries();

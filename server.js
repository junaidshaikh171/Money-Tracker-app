const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());

// Serve static files (CSS, JS, images) - This line is critical
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Your existing API code (unchanged) ---
function readEntries() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeEntries(entries) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2));
}

function computeDerived(entry) {
  const totalExpenses = entry.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const savings = Number(entry.income || 0) - totalExpenses;
  const savingsRate = entry.income > 0 ? (savings / entry.income) * 100 : 0;
  return { ...entry, totalExpenses, savings, savingsRate };
}

// API Routes...
app.get('/api/entries', (req, res) => {
  const entries = readEntries().map(computeDerived);
  entries.sort((a, b) => (a.year - b.year) || (a.month - b.month));
  res.json(entries);
});

app.post('/api/entries', (req, res) => { /* your code */ });

app.delete('/api/entries/:id', (req, res) => { /* your code */ });

app.listen(PORT, () => {
  console.log(`Ledger is running at http://localhost:${PORT}`);
});

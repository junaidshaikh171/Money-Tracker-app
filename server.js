const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helper functions
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

// API Routes
app.get('/api/entries', (req, res) => {
  const entries = readEntries().map(computeDerived);
  entries.sort((a, b) => (a.year - b.year) || (a.month - b.month));
  res.json(entries);
});

app.post('/api/entries', (req, res) => {
  const entries = readEntries();
  const newEntry = {
    id: Date.now().toString(),
    year: Number(req.body.year),
    month: Number(req.body.month),
    income: Number(req.body.income) || 0,
    expenses: req.body.expenses || []
  };
  entries.push(newEntry);
  writeEntries(entries);
  res.json(computeDerived(newEntry));
});

app.delete('/api/entries/:id', (req, res) => {
  let entries = readEntries();
  entries = entries.filter(e => e.id !== req.params.id);
  writeEntries(entries);
  res.json({ success: true });
});

// ✅ CRITICAL FIX: Bind to 0.0.0.0 instead of localhost
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ledger is running on port ${PORT}`);
});

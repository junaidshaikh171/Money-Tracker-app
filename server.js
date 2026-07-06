const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- tiny JSON-file "database" -------------------------------------------

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

// --- API -------------------------------------------------------------------

// List all entries, sorted chronologically, each with computed totals.
app.get('/api/entries', (req, res) => {
  const entries = readEntries().map(computeDerived);
  entries.sort((a, b) => (a.year - b.year) || (a.month - b.month));
  res.json(entries);
});

// Add a new monthly entry.
app.post('/api/entries', (req, res) => {
  const { month, year, income, expenses } = req.body;

  if (month === undefined || year === undefined || income === undefined) {
    return res.status(400).json({ error: 'month, year, and income are required' });
  }

  const entries = readEntries();

  const exists = entries.some(e => e.month === Number(month) && e.year === Number(year));
  if (exists) {
    return res.status(409).json({ error: 'An entry for that month already exists. Delete it first or edit it.' });
  }

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    month: Number(month),
    year: Number(year),
    income: Number(income),
    expenses: Array.isArray(expenses)
      ? expenses
          .filter(e => e.category && e.amount !== '' && e.amount !== undefined)
          .map(e => ({ category: String(e.category), amount: Number(e.amount) }))
      : []
  };

  entries.push(entry);
  writeEntries(entries);
  res.status(201).json(computeDerived(entry));
});

// Delete an entry by id.
app.delete('/api/entries/:id', (req, res) => {
  const entries = readEntries();
  const next = entries.filter(e => e.id !== req.params.id);
  if (next.length === entries.length) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  writeEntries(next);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Ledger is running at http://localhost:${PORT}`);
});

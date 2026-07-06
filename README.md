# The Household Ledger — Money Tracker

A small personal finance tracker: log your income and expenses for each month,
and see your savings visualized in charts. Built with plain HTML/CSS/JS on the
frontend and Node.js + Express on the backend. Data is stored in a local
`data.json` file — no database or account needed.

## What it does

- Log a month's **income** and a list of **expenses** (any categories you like:
  rent, food, transport, etc).
- Automatically computes total expenses, savings, and savings rate for each month.
- **Trend chart** — income, expenses, and savings across all the months you've logged.
- **Breakdown chart** — a doughnut chart showing where a chosen month's money went.
- **Register** — a table of every entry, with a button to delete ("void") one.

## Requirements

- [Node.js](https://nodejs.org) version 16 or later (includes npm).

## Setup

1. Open a terminal in this folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

4. Open your browser to:

   ```
   http://localhost:3000
   ```

That's it — start filing months. Your data is saved to `data.json` in this
folder, so it persists between restarts. To reset everything, stop the server
and replace the contents of `data.json` with `[]`.

## Project structure

```
money-tracker/
├── server.js          # Express server + JSON-file API
├── data.json           # Your saved entries (starts empty)
├── package.json
└── public/
    ├── index.html       # Page structure
    ├── style.css        # Ledger-book visual design
    └── script.js        # Form handling, API calls, Chart.js rendering
```

## Notes

- Currency is displayed with the ₹ symbol — open `public/script.js` and change
  the `CURRENCY` constant near the top if you'd like a different symbol.
- Charts are powered by [Chart.js](https://www.chartjs.org/), loaded from a CDN,
  so an internet connection is needed the first time a page loads.
# Money-Tracker-app

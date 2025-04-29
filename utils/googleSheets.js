const fs = require('fs');
const { google } = require('googleapis');

const BUDGET_PATH = './budget.json';
function loadBudget() {
  try {
    return JSON.parse(fs.readFileSync(BUDGET_PATH, 'utf-8'));
  } catch {
    return { monthly_budget: 0, recurring: [] };
  }
}
function saveBudget(budget) {
  fs.writeFileSync(BUDGET_PATH, JSON.stringify(budget, null, 2));
}

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const GOOGLE_CREDENTIALS_JSON = process.env.GOOGLE_CREDENTIALS_JSON;
const credentials = JSON.parse(Buffer.from(GOOGLE_CREDENTIALS_JSON, 'base64').toString('utf8'));
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

async function saveExpenseToSheet(expense, standardInfo) {
  const row = [
    standardInfo.amountStandard || '',
    process.env.STANDARD_CURRENCY || 'INR',
    expense.category || '',
    expense.note || '',
    expense.date || new Date().toISOString().slice(0, 10),
    new Date().toISOString(), 
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A:F',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

async function getMonthlyTotal() {
  try {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:F',
    });
    let rows = res.data.values || [];
    if (rows.length > 0 && isNaN(Number(rows[0][0]))) rows = rows.slice(1);
    const expenses = rows.map(r => ({
      amount: parseFloat(r[0]),
      date: r[4],
    })).filter(e => !isNaN(e.amount));
    const thisMonth = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const total = thisMonth.reduce((s, e) => s + e.amount, 0);
    return total;
  } catch {
    return 0;
  }
}

async function loadAllExpenses() {
  try {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sheet1!A:F',
    });
    let rows = res.data.values || [];
    if (rows.length > 0 && isNaN(Number(rows[0][0]))) rows = rows.slice(1);
    const expenses = rows.map(r => ({
      amount: parseFloat(r[0]),
      currency: r[1],
      category: r[2],
      note: r[3],
      date: r[4],
    })).filter(e => !isNaN(e.amount));
    const thisMonth = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    return thisMonth;
  } catch {
    return [];
  }
}

module.exports = { loadBudget, saveBudget, saveExpenseToSheet, getMonthlyTotal, loadAllExpenses };


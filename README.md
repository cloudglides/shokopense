# Shoko Bot Modularization

The bot logic in `server.js` has been split into multiple files for maintainability:

- `bot.js`: Discord bot setup and main event listeners
- `commands/`
  - `budget.js`: Budget and recurring expense commands
  - `expense.js`: Expense parsing and saving
  - `analytics.js`: Analytics and reporting
- `utils/`
  - `currency.js`: Currency normalization and conversion
  - `googleSheets.js`: Google Sheets helpers
  - `llm.js`: LLM API helpers

Update your imports accordingly. See each file for details.

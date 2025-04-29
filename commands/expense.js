const { parseExpenseWithLLM } = require('../utils/llm');
const { convertToStandard } = require('../utils/currency');
const { saveExpenseToSheet } = require('../utils/googleSheets');

async function handleExpenseMessage(msg) {
  await msg.channel.sendTyping();
  const llmRaw = await parseExpenseWithLLM(msg.content);
  let expense;
  let llmDebug = '';
  try {
    expense = typeof llmRaw === 'string' ? JSON.parse(llmRaw) : llmRaw;
  } catch {
    llmDebug = typeof llmRaw === 'string' ? llmRaw : JSON.stringify(llmRaw);
    expense = null;
  }
  if (expense && expense.amount && !expense.currency) {
    expense.currency = process.env.STANDARD_CURRENCY || 'INR';
  }
  if (!expense || !expense.amount || !expense.currency) {
    await msg.channel.send('Could not extract amount/currency. Please try again.');
    return;
  }
  const standardInfo = await convertToStandard(expense.amount, expense.currency);
  if (standardInfo.amountStandard === null) {
    await msg.channel.send("Sorry, I couldn't recognize the currency you entered. Please try using a standard currency name like USD, INR, EUR, etc. I'll save your expense as you entered it.");
    try {
      await saveExpenseToSheet(expense, { amountStandard: '', rate: '', apiError: true });
    } catch (err) {
      await msg.channel.send('Failed to save to Google Sheets.');
      console.error('Sheets error:', err.message);
    }
    return;
  }
  try {
    await saveExpenseToSheet(expense, standardInfo);
    let resp = `Expense saved! Amount in ${process.env.STANDARD_CURRENCY || 'INR'}: ${standardInfo.amountStandard?.toFixed(2)}`;
    if (standardInfo.status) resp += `\n${standardInfo.status}`;
    await msg.channel.send(resp);
  } catch (err) {
    await msg.channel.send('Failed to save to Google Sheets.');
    console.error('Sheets error:', err.message);
  }
}

module.exports = { handleExpenseMessage };

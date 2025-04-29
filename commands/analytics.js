const { getMonthlyTotal } = require('../utils/googleSheets');

const { loadAllExpenses } = require('../utils/googleSheets');

async function handleAnalyticsMessage(msg) {
  const lower = msg.content.toLowerCase();
  const hasNet = /\bnet\b/i.test(lower);
  const hasExpense = /\bexpen[cs]e?s?\b/i.test(lower) || /\bexpenenses\b/i.test(lower);
  if ((hasNet && hasExpense) || /(total|net).*(expen[cs]e?s?|expenenses|expenditure|spent)/i.test(lower) || /how much.*spend/i.test(lower)) {
    await msg.channel.sendTyping();
    const total = await getMonthlyTotal();
    await msg.channel.send(`Your total expenditure this month is ${total.toFixed(2)}`);
    return;
  }
  // Highest expense
  if (
    /highest|biggest|largest|most expensive|max(imum)?/i.test(lower) ||
    /(spent.*most|most.*spent|most.*expense|largest.*expense|biggest.*expense)/i.test(lower)
  ) {
    await msg.channel.sendTyping();
    const expenses = await loadAllExpenses();
    if (!expenses || !expenses.length) {
      await msg.channel.send('No expenses found for this month.');
      return;
    }
    const highest = expenses.reduce((a, b) => (a.amount > b.amount ? a : b));
    await msg.channel.send(`Your highest expense this month is ${highest.amount} ${highest.currency || ''} (${highest.category || 'no category'})${highest.note ? ' - ' + highest.note : ''}`);
    return;
  }
  // LLM fallback for analytics intent classification
  const { classifyAnalyticsIntent } = require('../utils/llm');
  const intent = await classifyAnalyticsIntent(msg.content);
  if (intent === 'total_expenditure') {
    await msg.channel.sendTyping();
    const total = await getMonthlyTotal();
    await msg.channel.send(`Your total expenditure this month is ${total.toFixed(2)}`);
    return;
  } else if (intent === 'highest_expense') {
    await msg.channel.sendTyping();
    const expenses = await loadAllExpenses();
    if (!expenses || !expenses.length) {
      await msg.channel.send('No expenses found for this month.');
      return;
    }
    const highest = expenses.reduce((a, b) => (a.amount > b.amount ? a : b));
    await msg.channel.send(`Your highest expense this month is ${highest.amount} ${highest.currency || ''} (${highest.category || 'no category'})${highest.note ? ' - ' + highest.note : ''}`);
    return;
  }
  if (arguments.length > 1 && arguments[1] === true) {
    return 'not_recognized';
  }
  await msg.channel.send('Analytics query not recognized.');
}

module.exports = { handleAnalyticsMessage };

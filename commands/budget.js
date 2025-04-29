const { loadBudget, saveBudget } = require('../utils/googleSheets');

function parseBudgetAmount(str) {
  // Supports numbers with k (thousand) or m (million) suffixes
  const match = str.match(/([\d,.]+)\s*(k|m)?/i);
  if (!match) return null;
  let amount = parseFloat(match[1].replace(/,/g, ''));
  let multiplier = 1;
  if (match[2]) {
    if (match[2].toLowerCase() === 'k') multiplier = 1000;
    if (match[2].toLowerCase() === 'm') multiplier = 1000000;
  }
  return amount * multiplier;
}

async function handleBudgetMessage(msg) {
  await msg.channel.sendTyping();
  let budget = loadBudget();
  let reply = '';
  const lower = msg.content.toLowerCase();
  // Set budget (more flexible)
  // Try to match explicit budget commands
  let setMatch = msg.content.match(/(?:set|add|adjust|budget|limit|increase|raise|make|set)[^\d]{0,10}([\d,.]+\s*[km]?)\s*(inr|usd|eur|gbp|rs|rupees|dollars|bucks)?/i);
  // If not found, try to match any number in the message
  if (!setMatch) {
    setMatch = msg.content.match(/([\d,.]+\s*[km]?)/i);
  }
  if (setMatch) {
    let amount = parseBudgetAmount(setMatch[1]);
    if (!amount) {
      await msg.channel.send('Could not parse budget amount.');
      return;
    }
    budget.monthly_budget = amount;
    // If user specified a currency, update standard currency for budget
    let userCur = setMatch[2];
    if (userCur) {
      userCur = userCur.toUpperCase();
      if (["RUPEES","RS"].includes(userCur)) userCur = "INR";
      if (["DOLLARS","BUCKS"].includes(userCur)) userCur = "USD";
      budget.currency = userCur;
    } else if (!budget.currency) {
      budget.currency = 'INR'; // Default fallback
    }
    saveBudget(budget);
    reply = `Monthly budget set to ${budget.monthly_budget} ${budget.currency || 'INR'}`;
    await msg.channel.send(reply);
    return;
  }
  // Show budget
  if (/what.*budget|current.*budget|show.*budget|whats my budget|what's my budget|budget\?/i.test(lower)) {
    // Calculate current spend for this month
    const { getMonthlyTotal } = require('../utils/googleSheets');
    const total = await getMonthlyTotal();
    let status = '';
    if (budget.monthly_budget > 0) {
      if (total > budget.monthly_budget) status = `-# you are over ${Math.round(total-budget.monthly_budget)} over your budget`;
      else if (total > 0.8*budget.monthly_budget) status = `-# you are close to your budget`;
      else status = `-# you are doing great`;
    }
    reply = `Your current monthly budget is ${budget.monthly_budget} ${budget.currency || 'INR'}`;
    if (status) {
      reply += `\n${status.trim()}`;
    }
    reply = reply.split('\n').filter(line => line.trim() !== '').join('\n');
    await msg.channel.send(reply);
    return;
  }
  await msg.channel.send('Budget command not recognized.');
}

module.exports = { handleBudgetMessage };

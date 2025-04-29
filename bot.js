require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');
const { handleExpenseMessage } = require('./commands/expense');
const { handleBudgetMessage } = require('./commands/budget');
const { handleAnalyticsMessage } = require('./commands/analytics');

const config = require('./config.json');
const ALLOWED_USER_ID = config.allowed_user_id;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

client.on(Events.MessageCreate, async (msg) => {
  if (msg.channel.type !== 1 || msg.author.bot) return;
  if (msg.author.id !== ALLOWED_USER_ID) {
    await msg.channel.send('You are not authorized to use this bot.');
    return;
  }

  const budgetCmd = /budget|limit|set.*budget|remove.*budget|adjust.*budget|recurring|repeat|monthly|weekly|list.*recurring|remove.*recurring|increase.*to|raise.*to|make.*to|set.*to/i;
  if (budgetCmd.test(msg.content)) {
    await handleBudgetMessage(msg);
  } else {
       const analyticsResult = await handleAnalyticsMessage(msg, true); 
    if (analyticsResult === 'not_recognized') {
      await handleExpenseMessage(msg);
    }
  }
});

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(DISCORD_TOKEN);

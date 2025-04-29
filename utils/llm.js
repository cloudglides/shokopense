const axios = require('axios');

async function parseExpenseWithLLM(message) {
  const systemPrompt = `Extract expense details from the message as JSON. 
- Always respond ONLY with a JSON object like: {\"amount\": <number>, \"currency\": <string>, \"category\": <string>, \"note\": <string>, \"date\": <string or null>}.
- Normalize or autocorrect currency names to standard ISO codes (e.g., USD, INR, EUR, GBP). For example, if the user says \"dollla\", \"dollr\", \"dollaz\", output \"USD\".
- The note should be concise and meaningful.
- If you cannot find both amount and currency, return {\"amount\": null, \"currency\": null}.
- Do NOT explain or add anything else, only valid JSON output.`;
  const prompt = encodeURIComponent(`${systemPrompt}\nMessage: ${message}`);
  const url = `${process.env.LLM_URL}${prompt}`;
  try {
    const res = await axios.get(url, { timeout: 15000 });
    return res.data;
  } catch (err) {
    console.error('LLM API error:', err.message);
    return null;
  }
}

async function classifyAnalyticsIntent(message) {
  const systemPrompt = `Classify the following user message as one of: total_expenditure, highest_expense, budget_query, other. Respond ONLY with the label.`;
  const userPrompt = `Message: "${message}"`;
  const body = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 10,
    temperature: 0,
  };
  try {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', body, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    const label = res.data.choices[0].message.content.trim().toLowerCase();
    return label;
  } catch (err) {
    return 'other';
  }
}

module.exports = { parseExpenseWithLLM, classifyAnalyticsIntent };


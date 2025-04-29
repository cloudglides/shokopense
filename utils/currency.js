const axios = require('axios');

const currencyMap = {
  'dollars': 'USD',
  'dollar': 'USD',
  'dolla': 'USD',
  'bucks': 'USD',
  'rupees': 'INR',
  'rs': 'INR',
  'euros': 'EUR',
  'pounds': 'GBP',
};

function normalizeCurrency(currency) {
  if (!currency) return '';
  const map = {
    'inr': 'INR',
    'rupees': 'INR',
    'rs': 'INR',
    'usd': 'USD',
    'dollars': 'USD',
    'bucks': 'USD',
    'eur': 'EUR',
    'euros': 'EUR',
    'gbp': 'GBP',
    'pounds': 'GBP', 
  };
  const norm = currency.toLowerCase().replace(/[^a-z]/g, '');
  return map[norm] || currency.toUpperCase();
}

async function convertToStandard(amount, currency) {
  currency = normalizeCurrency(currency);
  const to = process.env.STANDARD_CURRENCY || 'INR';
  if (currency === to) {
    return { amountStandard: amount, rate: 1 };
  }
  if (!amount || !currency) return { amountStandard: null, rate: null };
  try {
    const from = currency.toUpperCase();
    const url = `https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`;
    console.log('Currency conversion URL:', url);
    const res = await axios.get(url);
    if (!res.data.rates || !res.data.rates[to]) {
      console.error('Frankfurter API response:', JSON.stringify(res.data));
      return { amountStandard: null, rate: null, apiError: true, apiData: res.data };
    }
    const amountStandard = res.data.rates[to];
    const rate = amountStandard / amount;
    return { amountStandard, rate };
  } catch (err) {
    console.error('Currency conversion error:', err.message);
    return { amountStandard: null, rate: null, apiError: true };
  }
}

module.exports = { convertToStandard, normalizeCurrency };

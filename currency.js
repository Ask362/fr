const exchangeRates = {
  KZT: 1,
  USD: 1 / 480, // 1 KZT = 0.002083 USD
  EUR: 1 / 520, // 1 KZT = 0.001923 EUR
  RUB: 1 / 5    // 1 KZT = 0.2 RUB
};

const currencySymbols = {
  KZT: '₸',
  USD: '$',
  EUR: '€',
  RUB: '₽'
};

const currencies = ['KZT', 'USD', 'EUR', 'RUB'];

function getSelectedCurrency() {
  return localStorage.getItem('currency') || 'KZT';
}

function setSelectedCurrency(currency) {
  if (currencies.includes(currency)) {
    localStorage.setItem('currency', currency);
  }
}

function convertPrice(priceInKZT, targetCurrency) {
  if (!exchangeRates[targetCurrency]) {
    console.error(`Unknown currency: ${targetCurrency}`);
    return priceInKZT;
  }
  const convertedPrice = priceInKZT * exchangeRates[targetCurrency];
  return parseFloat(convertedPrice.toFixed(2));
}

function formatPrice(price, currency) {
  const symbol = currencySymbols[currency] || '₸';
  return `${symbol}${price.toLocaleString()}`;
}

function cycleCurrency(currentCurrency) {
  const currentIndex = currencies.indexOf(currentCurrency);
  const nextIndex = (currentIndex + 1) % currencies.length;
  return currencies[nextIndex];
}

function updateCurrencyButton() {
  const currencyButton = document.querySelector('.top-bar button.currency-btn');
  if (currencyButton) {
    const selectedCurrency = getSelectedCurrency();
    currencyButton.textContent = selectedCurrency;
  }
}

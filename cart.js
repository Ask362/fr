let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];
let isLoading = false;
let storeName = "Alem Market";
let appliedPromocode = null;
let discount = 0;
let deliveryAddress = JSON.parse(localStorage.getItem('deliveryAddress')) || {};

// Fallback currency functions
let selectedCurrency = 'KZT';
const currencyFunctions = {
    getSelectedCurrency: typeof getSelectedCurrency === 'function' ? getSelectedCurrency : () => selectedCurrency,
    setSelectedCurrency: typeof setSelectedCurrency === 'function' ? setSelectedCurrency : (currency) => { selectedCurrency = currency; },
    cycleCurrency: typeof cycleCurrency === 'function' ? cycleCurrency : (current) => {
        const currencies = ['KZT', 'USD', 'EUR', 'RUB'];
        const index = currencies.indexOf(current);
        return currencies[(index + 1) % currencies.length];
    },
    convertPrice: typeof convertPrice === 'function' ? convertPrice : (price, currency) => {
        const rates = { KZT: 1, USD: 0.0021, EUR: 0.0019, RUB: 0.20 };
        return price * (rates[currency] || 1);
    },
    formatPrice: typeof formatPrice === 'function' ? formatPrice : (price, currency) => {
        const symbols = { KZT: '₸', USD: '$', EUR: '€', RUB: '₽' };
        return `${symbols[currency] || ''}${price.toFixed(2)}`;
    },
    updateCurrencyButton: typeof updateCurrencyButton === 'function' ? updateCurrencyButton : () => {
        const button = document.querySelector('.currency-btn');
        if (button) button.textContent = selectedCurrency;
    }
};

const promocodes = {
    "ALEM10": 10,
    "SAVE20": 20,
    "FREESHIP": 15
};

function showToast(message, isError = false) {
    try {
        const toast = new bootstrap.Toast(document.getElementById('cart-toast'));
        const toastBody = document.querySelector('#cart-toast .toast-body');
        toastBody.textContent = message;
        document.querySelector('#cart-toast').classList.toggle('bg-danger', isError);
        document.querySelector('#cart-toast').classList.toggle('text-white', isError);
        toast.show();
    } catch (error) {
        console.error('Error displaying toast:', error);
    }
}

function updateCartCount() {
    try {
        const cartCountElements = document.querySelectorAll('.cart-count');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElements.forEach(element => {
            element.textContent = totalItems;
        });
    } catch (error) {
        console.error('Error updating cart counter:', error);
    }
}

function addToCart(productId, quantity = 1) {
    try {
        const parsedId = parseInt(productId);
        if (isNaN(parsedId)) {
            throw new Error('Invalid product ID');
        }
        const existingItem = cart.find(item => item.id === parsedId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({ id: parsedId, quantity });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        showToast('Product added to cart');
    } catch (error) {
        console.error('Error adding product to cart:', error);
        showToast('Error adding product', true);
    }
}

function loadProducts(callback) {
    if (isLoading) return;
    isLoading = true;
    const loadingElement = document.getElementById('loading');
    if (loadingElement) loadingElement.style.display = 'block';

    fetch('products.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            products = data;
            console.log(`${storeName} loaded ${products.length} products`);
            callback();
            isLoading = false;
            if (loadingElement) loadingElement.style.display = 'none';
        })
        .catch(error => {
            console.error('Error loading JSON:', error);
            isLoading = false;
            if (loadingElement) loadingElement.style.display = 'none';
            showToast('Error loading data. Please try again later.', true);
        });
}

function displayCart() {
    const cartItems = document.getElementById('cart-items');
    if (!cartItems) {
        console.error('Element #cart-items not found');
        return;
    }
    cartItems.innerHTML = '';
    let subtotal = 0;
    const selectedCurrency = currencyFunctions.getSelectedCurrency();

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="text-center">Cart is empty</p>';
        updateSummary(0, 0);
        updateCartCount();
        return;
    }

    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        const product = products.find(p => p.id === item.id);
        if (!product) {
            console.warn(`Product with ID ${item.id} not found in products.json`);
            continue;
        }

        const priceInSelectedCurrency = currencyFunctions.convertPrice(product.price, selectedCurrency);
        const itemTotal = priceInSelectedCurrency * item.quantity;
        subtotal += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'product-card cart-item';
        cartItem.setAttribute('data-product-id', item.id);
        cartItem.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" class="cart-item-img" loading="lazy">
            </div>
            <div class="product-info">
                <h5 class="title">${product.name}</h5>
                <p class="price">${currencyFunctions.formatPrice(priceInSelectedCurrency, selectedCurrency)}</p>
                <div class="d-flex align-items-center mb-3">
                    <label for="quantity-${item.id}" class="me-2">Quantity:</label>
                    <input type="number" class="form-control quantity-input" id="quantity-${item.id}" value="${item.quantity}" min="1" data-id="${item.id}">
                </div>
                <button class="btn btn-outline-danger remove-item" data-id="${item.id}">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        `;
        cartItem.addEventListener('click', (e) => {
            if (!e.target.closest('.quantity-input') && !e.target.closest('.remove-item')) {
                window.location.href = `Product-Page.html?id=${item.id}`;
            }
        });
        cartItems.appendChild(cartItem);
    }

    discount = appliedPromocode ? (subtotal * promocodes[appliedPromocode] / 100) : 0;
    updateSummary(subtotal, discount);

    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', function (e) {
            e.stopPropagation();
            const id = parseInt(this.getAttribute('data-id'));
            let quantity = parseInt(this.value);
            if (quantity < 1) quantity = 1;
            updateCartItem(id, quantity);
        });
    });

    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            const id = parseInt(this.getAttribute('data-id'));
            removeCartItem(id);
        });
    });

    if (products.length > 0) {
        const randomIndex = Math.floor(Math.random() * products.length);
        console.log("Recommended product: " + products[randomIndex].name);
    }

    updateCartCount();
}

function updateSummary(subtotal, discount) {
    try {
        const total = subtotal - discount;
        const selectedCurrency = currencyFunctions.getSelectedCurrency();
        const subtotalElement = document.getElementById('cart-subtotal');
        const discountElement = document.getElementById('cart-discount');
        const totalElement = document.getElementById('cart-total');

        if (subtotalElement) subtotalElement.textContent = currencyFunctions.formatPrice(subtotal, selectedCurrency);
        if (discountElement) discountElement.textContent = currencyFunctions.formatPrice(discount, selectedCurrency);
        if (totalElement) totalElement.textContent = currencyFunctions.formatPrice(total, selectedCurrency);
    } catch (error) {
        console.error('Error updating summary:', error);
    }
}

function updateCartItem(id, quantity) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity = quantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
        showToast('Quantity updated');
    } else {
        console.error(`Product with ID ${id} not found in cart`);
    }
}

function removeCartItem(id) {
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCart();
    showToast('Product removed from cart');
}

function validateAddress() {
    const street = document.getElementById('address-street').value.trim();
    const city = document.getElementById('address-city').value.trim();
    const postal = document.getElementById('address-postal').value.trim();
    const country = document.getElementById('address-country').value;
    const errorElement = document.getElementById('address-error');

    if (!street || !city || !postal || !country) {
        errorElement.textContent = 'Please fill in all address fields';
        errorElement.style.display = 'block';
        return null;
    }

    errorElement.style.display = 'none';
    return { street, city, postal, country };
}

function validateCreditCard() {
    const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
    const cardHolder = document.getElementById('card-holder').value.trim();
    const expiry = document.getElementById('card-expiry').value.trim();
    const cvv = document.getElementById('card-cvv').value.trim();
    const errorElement = document.getElementById('payment-error');

    if (!cardNumber.match(/^\d{16}$/)) {
        errorElement.textContent = 'Card number must be 16 digits';
        errorElement.style.display = 'block';
        return null;
    }
    if (!cardHolder) {
        errorElement.textContent = 'Cardholder name is required';
        errorElement.style.display = 'block';
        return null;
    }
    if (!expiry.match(/^(0[1-9]|1[0-2])\/[0-9]{2}$/)) {
        errorElement.textContent = 'Expiry date must be MM/YY';
        errorElement.style.display = 'block';
        return null;
    }
    if (!cvv.match(/^\d{3,4}$/)) {
        errorElement.textContent = 'CVV must be 3 or 4 digits';
        errorElement.style.display = 'block';
        return null;
    }

    errorElement.style.display = 'none';
    return { cardNumber: cardNumber.slice(-4), cardHolder, expiry, cvv };
}

// Initialize address fields
function initializeAddressFields() {
    if (deliveryAddress.street) document.getElementById('address-street').value = deliveryAddress.street;
    if (deliveryAddress.city) document.getElementById('address-city').value = deliveryAddress.city;
    if (deliveryAddress.postal) document.getElementById('address-postal').value = deliveryAddress.postal;
    if (deliveryAddress.country) document.getElementById('address-country').value = deliveryAddress.country;
}

// Toggle credit card details visibility
function toggleCreditCardDetails() {
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    const creditCardDetails = document.getElementById('credit-card-details');
    creditCardDetails.classList.toggle('hidden', paymentMethod !== 'credit-card');
}

// Apply input masks
function applyInputMasks() {
    const cardNumberInput = document.getElementById('card-number');
    cardNumberInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = value.slice(0, 19);
    });

    const expiryInput = document.getElementById('card-expiry');
    expiryInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) value = value.slice(0, 2) + '/' + value.slice(2);
        e.target.value = value.slice(0, 5);
    });

    const cvvInput = document.getElementById('card-cvv');
    cvvInput.addEventListener('input', function (e) {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
    });
}

document.getElementById('apply-promocode')?.addEventListener('click', function () {
    const promocodeInput = document.getElementById('promocode');
    const errorElement = document.getElementById('promocode-error');
    if (!promocodeInput || !errorElement) {
        console.error('Promocode elements not found');
        return;
    }

    const code = promocodeInput.value.trim().toUpperCase();

    if (!code) {
        errorElement.textContent = 'Enter a promocode';
        errorElement.style.display = 'block';
        return;
    }

    if (promocodes[code]) {
        appliedPromocode = code;
        displayCart();
        errorElement.style.display = 'none';
        showToast(`Promocode ${code} applied! Discount ${promocodes[code]}%`);
    } else {
        errorElement.textContent = 'Invalid promocode';
        errorElement.style.display = 'block';
        showToast('Invalid promocode', true);
    }
});

document.getElementById('checkout-btn')?.addEventListener('click', function () {
    const clickSound = document.getElementById('clickSound');
    clickSound.currentTime = 0;
    clickSound.play().catch(error => {
        console.error('Error playing sound:', error);
    });

    if (cart.length === 0) {
        showToast('Cart is empty!', true);
        return;
    }

    const address = validateAddress();
    if (!address) {
        showToast('Please complete the delivery address', true);
        return;
    }

    const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
    if (!paymentMethod) {
        showToast('Select a payment method', true);
        return;
    }

    let paymentDetails = null;
    if (paymentMethod.value === 'credit-card') {
        paymentDetails = validateCreditCard();
        if (!paymentDetails) {
            showToast('Please complete the credit card details', true);
            return;
        }
    }

    const paymentText = {
        'credit-card': `Credit Card (ending ${paymentDetails?.cardNumber || 'N/A'})`,
        'paypal': 'PayPal',
        'cash': 'Cash on Delivery'
    }[paymentMethod.value];

    deliveryAddress = address;
    localStorage.setItem('deliveryAddress', JSON.stringify(deliveryAddress));

    const total = parseFloat(document.getElementById('cart-total').textContent.replace(/[^\d.]/g, ''));
    const currency = currencyFunctions.getSelectedCurrency();
    showToast(`Order placed! Payment: ${paymentText}. Total: ${currencyFunctions.formatPrice(total, currency)}. Delivery to: ${address.street}, ${address.city}, ${address.postal}, ${address.country}`);

    cart = [];
    appliedPromocode = null;
    discount = 0;
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCart();
});

// Handle payment method change
document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
    radio.addEventListener('change', toggleCreditCardDetails);
});

const currencyButton = document.querySelector('.currency-btn');
if (currencyButton) {
    currencyButton.addEventListener('click', () => {
        const currentCurrency = currencyFunctions.getSelectedCurrency();
        const nextCurrency = currencyFunctions.cycleCurrency(currentCurrency);
        currencyFunctions.setSelectedCurrency(nextCurrency);
        currencyFunctions.updateCurrencyButton();
        displayCart();
        console.log(`Currency changed to ${nextCurrency}`);
    });
}

window.onload = function () {
    console.log("Cart initialization:", cart);
    currencyFunctions.updateCurrencyButton();
    loadProducts(() => {
        displayCart();
        initializeAddressFields();
        toggleCreditCardDetails();
        applyInputMasks();
    });
    updateCartCount();
};

console.log('Home-Page.js is loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');

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

    // Start countdown timer
    function startTimer() {
        const countdownElement = document.getElementById('countdown');
        if (!countdownElement) {
            console.warn('Countdown element (#countdown) not found');
            return;
        }
        let timeLeft = 6243; // ~1 hour 44 minutes
        const timer = setInterval(() => {
            const hours = Math.floor(timeLeft / 3600);
            const minutes = Math.floor((timeLeft % 3600) / 60);
            const seconds = timeLeft % 60;
            document.getElementById('hours').textContent = String(hours).padStart(2, '0');
            document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
            document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
            if (timeLeft <= 0) {
                clearInterval(timer);
                countdownElement.textContent = 'Deal Ended!';
            }
            timeLeft--;
        }, 1000);
        console.log('Countdown timer started');
    }

    let page = 1;
    const productsPerPage = 12;
    let allProducts = [];
    let categories = [];
    let selectedCategory = null;
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    let isLoading = false;

    // Update banner and deal prices
    function updateBannerAndDealPrices() {
        const bannerPriceElement = document.getElementById('banner-price');
        const dealPriceElement = document.getElementById('deal-price');
        const dealOldPriceElement = document.getElementById('deal-old-price');
        const currency = currencyFunctions.getSelectedCurrency();

        if (bannerPriceElement) {
            const priceInKZT = 699990;
            bannerPriceElement.textContent = currencyFunctions.formatPrice(
                currencyFunctions.convertPrice(priceInKZT, currency),
                currency
            );
        }
        if (dealPriceElement && dealOldPriceElement) {
            const dealPriceInKZT = 17325;
            const dealOldPriceInKZT = 25618;
            dealPriceElement.textContent = currencyFunctions.formatPrice(
                currencyFunctions.convertPrice(dealPriceInKZT, currency),
                currency
            );
            dealOldPriceElement.textContent = currencyFunctions.formatPrice(
                currencyFunctions.convertPrice(dealOldPriceInKZT, currency),
                currency
            );
        }
        console.log('Banner and deal prices updated for currency:', currency);
    }

    // Fallback product data
    const fallbackProducts = [
        { id: 1, name: "iPhone 16 Pro Max", price: 699990, category: "Electronics", image: "https://gagadget.com/media/post_big/iphone-16-event-14.15.272x_1.webp", description: "Latest iPhone" },
        { id: 2, name: "Marketing Books Set", price: 17325, category: "Books", image: "https://s.f.kz/prod/830/829422_1000.jpg", description: "Marketing books" },
        { id: 3, name: "Laptop", price: 450000, category: "Electronics", image: "https://example.com/laptop.jpg", description: "High-performance laptop" },
        { id: 4, name: "Headphones", price: 25000, category: "Electronics", image: "https://example.com/headphones.jpg", description: "Wireless headphones" },
        { id: 5, name: "Novel", price: 5000, category: "Books", image: "https://example.com/novel.jpg", description: "Bestselling novel" },
        { id: 6, name: "Smartwatch", price: 150000, category: "Electronics", image: "https://example.com/smartwatch.jpg", description: "Fitness tracker" },
        { id: 7, name: "Cookbook", price: 8000, category: "Books", image: "https://example.com/cookbook.jpg", description: "Recipes collection" },
        { id: 8, name: "Tablet", price: 300000, category: "Electronics", image: "https://example.com/tablet.jpg", description: "Portable tablet" },
        { id: 9, name: "Sci-Fi Book", price: 6000, category: "Books", image: "https://example.com/scifi.jpg", description: "Sci-fi adventure" },
        { id: 10, name: "Camera", price: 500000, category: "Electronics", image: "https://example.com/camera.jpg", description: "DSLR camera" },
        { id: 11, name: "History Book", price: 7000, category: "Books", image: "https://example.com/history.jpg", description: "Historical events" },
        { id: 12, name: "Speaker", price: 20000, category: "Electronics", image: "https://example.com/speaker.jpg", description: "Bluetooth speaker" }
    ];

    // Load products
    async function loadProducts() {
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error-message');
        const productList = document.getElementById('product-list');

        if (!productList) {
            console.error('Product list element (#product-list) not found');
            return;
        }

        if (loadingElement) loadingElement.classList.remove('hidden');
        if (errorElement) errorElement.style.display = 'none';

        try {
            const response = await fetch('products.json');
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error('Invalid data format');
            allProducts = data;
        } catch (error) {
            console.error('Error loading products.json:', error);
            console.warn('Using fallback products');
            allProducts = fallbackProducts;
            if (errorElement) {
                errorElement.style.display = 'block';
                errorElement.textContent = `Failed to load products: ${error.message}. Using fallback data.`;
            }
        }

        categories = [...new Set(allProducts.map(product => product.category))].sort();
        console.log('Products loaded:', allProducts.length, 'Categories:', categories);
        displayProducts();
        renderCatalog();
        updateBannerAndDealPrices();
        if (loadingElement) loadingElement.classList.add('hidden');
    }

    // Display products
    function displayProducts() {
        const productList = document.getElementById('product-list');
        const noMoreProducts = document.getElementById('no-more-products');
        if (!productList) {
            console.error('Product list element (#product-list) not found');
            return;
        }

        if (noMoreProducts) noMoreProducts.style.display = 'none';
        let products = selectedCategory
            ? allProducts.filter(product => product.category === selectedCategory)
            : allProducts;

        const start = (page - 1) * productsPerPage;
        const end = start + productsPerPage;
        const displayProducts = products.slice(start, end);

        if (page === 1) productList.innerHTML = '';

        const currency = currencyFunctions.getSelectedCurrency();
        displayProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            const isFavorited = favorites.includes(String(product.id)) ? 'active' : '';
            const convertedPrice = currencyFunctions.convertPrice(product.price, currency);
            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    <i class="fas fa-heart favorite-icon ${isFavorited}" data-id="${product.id}"></i>
                </div>
                <div class="product-info">
                    <h5 class="title">${product.name}</h5>
                    <p class="description">${product.description}</p>
                    <p class="price">${currencyFunctions.formatPrice(convertedPrice, currency)}</p>
                    <button class="add-to-cart btn btn-primary" data-id="${product.id}">Add to Cart</button>
                </div>
            `;
            card.addEventListener('click', e => {
                if (!e.target.classList.contains('add-to-cart') && !e.target.classList.contains('favorite-icon')) {
                    window.location.href = `Product-Page.html?id=${product.id}`;
                }
            });
            productList.appendChild(card);
        });

        page++;
        if (end >= products.length && noMoreProducts) {
            noMoreProducts.style.display = 'block';
        }
        console.log(`Displayed ${displayProducts.length} products, page: ${page}`);
    }

    // Render category catalog
    function renderCatalog() {
        const categoryList = document.getElementById('category-list');
        if (!categoryList) {
            console.warn('Category list element (#category-list) not found');
            return;
        }

        categoryList.innerHTML = `
            <li><a href="#" data-category="all" class="${selectedCategory === null ? 'active' : ''}">All Categories</a></li>
            ${categories.map(category => `
                <li><a href="#" data-category="${category}" class="${selectedCategory === category ? 'active' : ''}">${category}</a></li>
            `).join('')}
        `;
        console.log('Catalog rendered with categories:', categories);
    }

    // Toggle catalog sidebar
    const catalogToggle = document.getElementById('catalog-toggle');
    const catalogSidebar = document.querySelector('.catalog-sidebar');
    if (catalogToggle && catalogSidebar) {
        catalogToggle.addEventListener('click', () => {
            catalogSidebar.classList.toggle('active');
            console.log('Catalog sidebar toggled');
        });
    } else {
        console.warn('Catalog toggle or sidebar not found');
    }

    // Handle category selection
    const categoryList = document.getElementById('category-list');
    if (categoryList) {
        categoryList.addEventListener('click', e => {
            e.preventDefault();
            const target = e.target.closest('a');
            if (target && target.dataset.category) {
                selectedCategory = target.dataset.category === 'all' ? null : target.dataset.category;
                page = 1;
                document.querySelectorAll('#category-list a').forEach(a => a.classList.remove('active'));
                target.classList.add('active');
                displayProducts();
                if (catalogSidebar) catalogSidebar.classList.remove('active');
                console.log('Category selected:', selectedCategory || 'All');
            }
        });
    } else {
        console.warn('Category list element (#category-list) not found');
    }

    // Handle favorites
    document.addEventListener('click', e => {
        if (e.target.classList.contains('favorite-icon')) {
            const productId = e.target.dataset.id;
            if (favorites.includes(productId)) {
                favorites = favorites.filter(id => id !== productId);
                e.target.classList.remove('active');
            } else {
                favorites.push(productId);
                e.target.classList.add('active');
            }
            localStorage.setItem('favorites', JSON.stringify(favorites));
            console.log('Favorites updated:', favorites);
        }
    });

    // Handle currency switching
    const currencyButton = document.querySelector('.currency-btn');
    if (currencyButton) {
        currencyButton.addEventListener('click', () => {
            const currentCurrency = currencyFunctions.getSelectedCurrency();
            const nextCurrency = currencyFunctions.cycleCurrency(currentCurrency);
            currencyFunctions.setSelectedCurrency(nextCurrency);
            currencyFunctions.updateCurrencyButton();
            page = 1;
            displayProducts();
            updateBannerAndDealPrices();
            console.log(`Currency changed to ${nextCurrency}`);
        });
    } else {
        console.warn('Currency button (.currency-btn) not found');
    }

    // Infinite scroll
    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 && !isLoading) {
            isLoading = true;
            displayProducts();
            isLoading = false;
            console.log('Loading more products, page:', page);
        }
    });

    // Initialize
    currencyFunctions.updateCurrencyButton();
    loadProducts();
    startTimer();
});

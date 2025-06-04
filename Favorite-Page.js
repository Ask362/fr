document.addEventListener('DOMContentLoaded', function () {
    console.log('Favorites-Page.js loaded');

    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    console.log('Favorites:', favorites);

    function loadProducts(callback) {
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error-message');
        const noFavoritesElement = document.getElementById('no-favorites');
        if (loadingElement) loadingElement.style.display = 'block';
        if (errorElement) errorElement.style.display = 'none';
        if (noFavoritesElement) noFavoritesElement.style.display = 'none';

        console.log('Fetching products.json');
        fetch('products.json')
            .then(response => {
                if (!response.ok) throw new Error(`Failed to fetch products.json: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (!Array.isArray(data)) throw new Error('Invalid data format: Expected an array');
                console.log('Products fetched:', data.length);
                callback(data);
                if (loadingElement) loadingElement.style.display = 'none';
            })
            .catch(error => {
                console.error('Error loading products:', error);
                if (loadingElement) loadingElement.style.display = 'none';
                if (errorElement) {
                    errorElement.style.display = 'block';
                    errorElement.innerHTML = `<p>Не удалось загрузить товары: ${error.message}. <button onclick="retryLoadProducts()">Попробовать снова</button></p>`;
                }
            });
    }

    function retryLoadProducts() {
        loadProducts(function (products) {
            displayFavorites(products);
        });
    }

    function displayFavorites(products) {
        const productList = document.getElementById('product-list');
        const noFavoritesElement = document.getElementById('no-favorites');
        if (!productList) {
            console.error('Product list element not found');
            return;
        }
        productList.innerHTML = '';
        productList.className = 'product-grid';

        const favoriteProducts = products.filter(product => favorites.includes(String(product.id)));
        console.log('Favorite products:', favoriteProducts.length);

        if (favoriteProducts.length === 0) {
            console.log('No favorite products to display');
            if (noFavoritesElement) {
                noFavoritesElement.style.display = 'block';
            }
            return;
        }

        favoriteProducts.forEach((product, index) => {
            console.log(`Product #${index + 1}: ${product.name}`);
            let card = document.createElement('div');
            card.className = 'product-card';
            const isFavorited = favorites.includes(String(product.id)) ? 'active' : '';
            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    <i class="fas fa-heart favorite-icon ${isFavorited}" data-id="${product.id}"></i>
                </div>
                <div class="product-info">
                    <h5 class="title">${product.name}</h5>
                    <p class="description">${product.description}</p>
                    <p class="price">${product.price.toLocaleString()} ₸</p>
                    <button class="add-to-cart btn btn-primary" data-id="${product.id}">Add to Cart</button>
                </div>
            `;
            card.style.display = 'none';
            card.addEventListener('click', function (e) {
                if (e.target.classList.contains('add-to-cart') || e.target.classList.contains('favorite-icon')) {
                    console.log('Clicked add-to-cart or favorite-icon, skipping navigation');
                    return;
                }
                console.log(`Navigating to Product-Page.html?id=${product.id}`);
                window.location.href = `Product-Page.html?id=${product.id}`;
            });
            productList.appendChild(card);
            jQuery(card).fadeIn(1000);
        });

        document.querySelectorAll('.favorite-icon').forEach(icon => {
            icon.addEventListener('click', function (e) {
                e.stopPropagation();
                const productId = String(this.getAttribute('data-id'));
                if (favorites.includes(productId)) {
                    favorites = favorites.filter(id => id !== productId);
                    this.classList.remove('active');
                    console.log(`Removed ${productId} from favorites`);
                    const card = this.closest('.product-card');
                    if (card) {
                        jQuery(card).fadeOut(500, function () {
                            card.remove();
                            if (productList.children.length === 0 && noFavoritesElement) {
                                noFavoritesElement.style.display = 'block';
                            }
                        });
                    }
                } else {
                    favorites.push(productId);
                    this.classList.add('active');
                    console.log(`Added ${productId} to favorites`);
                }
                localStorage.setItem('favorites', JSON.stringify(favorites));
            });
        });
    }

    if (document.getElementById('products')) {
        console.log('Initializing favorites page');
        loadProducts(function (products) {
            displayFavorites(products);
        });
    }
});

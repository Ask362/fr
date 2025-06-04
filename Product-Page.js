let cart = JSON.parse(localStorage.getItem('cart')) || [];

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
    alert(message);
  }
}

function updateCartCount() {
  try {
    const cartCountElements = document.querySelectorAll('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElements.forEach(element => {
      element.textContent = totalItems;
    });
    console.log('Cart count updated:', totalItems);
  } catch (error) {
    console.error('Error updating cart count:', error);
  }
}

function generateOrderId(orders) {
  const maxId = orders.length > 0 ? Math.max(...orders.map(o => o.orderId)) : 0;
  return maxId + 1;
}

function addToCart(productId, quantity = 1) {
  try {
    const id = productId !== undefined ? productId : window.productId;
    const parsedId = parseInt(id);
    if (isNaN(parsedId) || parsedId <= 0) {
      throw new Error('Invalid product ID: ' + id);
    }
    const existingItem = cart.find(item => item.id === parsedId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ id: parsedId, quantity });
    }
    localStorage.setItem('cart', JSON.stringify(cart));

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const newOrder = {
      orderId: generateOrderId(orders),
      productId: parsedId,
      customerName: 'Anonymous',
      date: new Date().toISOString(),
      status: 'Pending'
    };
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));

    updateCartCount();
    console.log('Product added to cart:', { id: parsedId, quantity });
  } catch (error) {
    console.error('Error adding product to cart:', error);
    showToast('Error adding product', true);
  }
}

const urlParams = new URLSearchParams(window.location.search);
window.productId = urlParams.get('id');

async function loadProductPage() {
  try {
    if (!window.productId || isNaN(parseInt(window.productId))) {
      document.getElementById('product-name').textContent = 'Invalid Product ID';
      console.error('Invalid or missing ID parameter in URL:', window.productId);
      return;
    }

    const parsedId = parseInt(window.productId);
    let product;
    let allProducts = [];
    const selectedCurrency = getSelectedCurrency();

    const sellerProducts = JSON.parse(localStorage.getItem('seller_products') || '[]');
    product = sellerProducts.find(p => p.id === parsedId);

    if (!product) {
      const response = await fetch('products.json');
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const jsonProducts = await response.json();
      if (!Array.isArray(jsonProducts) || jsonProducts.length === 0) {
        throw new Error('products.json is empty or invalid');
      }
      product = jsonProducts.find(p => p.id === parsedId);
      allProducts = [...sellerProducts, ...jsonProducts];
    } else {
      const response = await fetch('products.json').catch(() => ({ ok: false }));
      const jsonProducts = response.ok ? await response.json() : [];
      allProducts = [...sellerProducts, ...jsonProducts];
    }

    if (!product) {
      document.getElementById('product-name').textContent = 'Product Not Found';
      console.error(`Product with id ${window.productId} not found`);
      return;
    }

    document.title = `${product.name || 'No Name'} | Alem Market`;
    document.getElementById('product-name').textContent = product.name || 'No Name';
    document.getElementById('product-code').textContent = `Order Code: ${product.id.toString().padStart(6, '0')}`;
    const convertedPrice = convertPrice(product.price, selectedCurrency);
    document.getElementById('product-price').textContent = formatPrice(convertedPrice, selectedCurrency);
    document.getElementById('product-description').textContent = product.description || 'No description provided';
    document.getElementById('mainImg').src = product.image || 'img/placeholder.png';
    document.getElementById('mainImg').alt = product.name || 'Product';

    const specsList = document.getElementById('product-specs');
    const specs = [];
    specsList.innerHTML = specs.map(spec => `<li><strong>${spec.label}:</strong> ${spec.value}</li>`).join('');

    const favoriteIcon = document.getElementById('favorite-icon');
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (favorites.includes(window.productId)) {
      favoriteIcon.classList.add('active');
    }

    displayRelatedProducts(allProducts, product.category);
    loadMoreProducts(allProducts);
    populateCategories(allProducts);
    updateCartCount();
    console.log('Cart count initialized');
  } catch (error) {
    console.error('Error loading product data:', error.message);
    document.getElementById('product-name').textContent = 'Error Loading Product';
  }
}

function displayRelatedProducts(products, category) {
  const related = products.filter(p => p.category === category && p.id !== parseInt(window.productId)).slice(0, 10);
  const container = document.getElementById('related-products');
  container.innerHTML = '';
  const selectedCurrency = getSelectedCurrency();

  related.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-product-id', product.id);
    const convertedPrice = convertPrice(product.price, selectedCurrency);
    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name || 'Product'}" loading="lazy">
        <i class="fas fa-heart favorite-icon ${JSON.parse(localStorage.getItem('favorites') || '[]').includes(product.id.toString()) ? 'active' : ''}"></i>
      </div>
      <div class="product-info">
        <h3 class="title">${product.name || 'No Name'}</h3>
        <p class="price">${formatPrice(convertedPrice, selectedCurrency)}</p>
        <button class="add-to-cart" data-product-id="${product.id}" onclick="addToCart(${product.id})">Add to Cart</button>
      </div>
    `;
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('favorite-icon') && !e.target.classList.contains('add-to-cart')) {
        window.location.href = `Product-Page.html?id=${product.id}`;
      }
    });
    container.appendChild(card);
  });
}

function scrollCarousel(containerId, amount) {
  const container = document.getElementById(containerId);
  container.scrollBy({ left: amount, behavior: 'smooth' });
}

let page = 1;
const productsPerPage = 12;

function loadMoreProducts(products) {
  document.getElementById('loading').classList.remove('hidden');
  const start = (page - 1) * productsPerPage;
  const end = start + productsPerPage;
  const productSlice = products.slice(start, end);
  const selectedCurrency = getSelectedCurrency();

  const grid = document.getElementById('product-grid');
  productSlice.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-product-id', product.id);
    const convertedPrice = convertPrice(product.price, selectedCurrency);
    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name || 'Product'}" loading="lazy">
        <i class="fas fa-heart favorite-icon ${JSON.parse(localStorage.getItem('favorites') || '[]').includes(product.id.toString()) ? 'active' : ''}"></i>
      </div>
      <div class="product-info">
        <h3 class="title">${product.name || 'No Name'}</h3>
        <p class="price">${formatPrice(convertedPrice, selectedCurrency)}</p>
        <button class="add-to-cart" data-product-id="${product.id}" onclick="addToCart(${product.id})">Add to Cart</button>
      </div>
    `;
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('favorite-icon') && !e.target.classList.contains('add-to-cart')) {
        window.location.href = `Product-Page.html?id=${product.id}`;
      }
    });
    grid.appendChild(card);
  });

  page++;
  document.getElementById('loading').classList.add('hidden');
}

window.addEventListener('scroll', () => {
  const backToTop = document.getElementById('back-to-top');
  if (window.scrollY > 300) {
    backToTop.classList.remove('hidden');
  } else {
    backToTop.classList.add('hidden');
  }
});

document.getElementById('back-to-top').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('favorite-icon')) {
    const productId = e.target.closest('.product-card')
      ? e.target.closest('.product-card').getAttribute('data-product-id')
      : e.target.id === 'favorite-icon' ? urlParams.get('id') : null;
    if (productId) {
      let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      if (favorites.includes(productId)) {
        favorites = favorites.filter(id => id !== productId);
        e.target.classList.remove('active');
      } else {
        favorites.push(productId);
        e.target.classList.add('active');
      }
      localStorage.setItem('favorites', JSON.stringify(favorites));
    }
  }
});

const currencyButton = document.querySelector('.currency-btn');
if (currencyButton) {
    currencyButton.addEventListener('click', () => {
        const currentCurrency = getSelectedCurrency();
        const nextCurrency = cycleCurrency(currentCurrency);
        setSelectedCurrency(nextCurrency);
        updateCurrencyButton();
        loadProductPage();
        console.log(`Currency changed to ${nextCurrency}`);
    });
}

function populateCategories(products) {
  const categoryList = document.getElementById('category-list');
  const categories = [...new Set(products.map(p => p.category))];
  categoryList.innerHTML = categories
    .map(category => `<li><a href="search-results.html?category=${encodeURIComponent(category)}">${category}</a></li>`)
    .join('');
}

updateCurrencyButton();
loadProductPage();
updateCartCount();

window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100) {
    fetch('products.json')
      .then(response => response.json())
      .then(jsonProducts => {
        const sellerProducts = JSON.parse(localStorage.getItem('seller_products') || '[]');
        const allProducts = [...sellerProducts, ...jsonProducts];
        loadMoreProducts(allProducts);
      })
      .catch(error => console.error('Error loading products:', error));
  }
});

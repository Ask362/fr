    // Simulated seller ID
    const SELLER_ID = 'seller_001';

    // Initialize localStorage
    function initializeStorage() {
      if (!localStorage.getItem('seller_products')) {
        localStorage.setItem('seller_products', JSON.stringify([]));
      }
      if (!localStorage.getItem('orders')) {
        localStorage.setItem('orders', JSON.stringify([]));
      }
    }

    // Generate unique IDs
    function generateProductId(products) {
      const maxId = products.length > 0 ? Math.max(...products.map(p => p.id)) : 0;
      return maxId + 1;
    }

    function generateOrderId(orders) {
      const maxId = orders.length > 0 ? Math.max(...orders.map(o => o.orderId)) : 0;
      return maxId + 1;
    }

    // Toast notifications
    function showToast(message, isError = false) {
      try {
        const toast = new bootstrap.Toast(document.getElementById('seller-toast'));
        const toastBody = document.querySelector('#seller-toast .toast-body');
        toastBody.textContent = message;
        document.querySelector('#seller-toast').classList.toggle('bg-danger', isError);
        document.querySelector('#seller-toast').classList.toggle('text-white', isError);
        toast.show();
      } catch (error) {
        console.error('Error displaying toast:', error);
        alert(message);
      }
    }

    // Modal handling
    function openModal(mode, product = null) {
      const modal = new bootstrap.Modal(document.getElementById('product-modal'));
      const form = document.getElementById('product-form');
      const title = document.getElementById('modal-title');
      const submitBtn = document.getElementById('modal-submit');
      const errorMessage = document.getElementById('modal-error');

      errorMessage.classList.add('d-none');
      errorMessage.textContent = '';

      if (mode === 'create') {
        title.textContent = 'Create Product';
        submitBtn.textContent = 'Create Product';
        form.reset();
        form.onsubmit = handleProductCreate;
      } else if (mode === 'edit') {
        title.textContent = 'Edit Product';
        submitBtn.textContent = 'Save Changes';
        document.getElementById('modal-product-name').value = product.name;
        document.getElementById('modal-product-price').value = product.price;
        document.getElementById('modal-product-stock').value = product.stock || 0;
        document.getElementById('modal-product-description').value = product.description;
        document.getElementById('modal-product-category').value = product.category;
        document.getElementById('modal-product-image').value = product.image;
        form.onsubmit = (e) => handleProductEdit(e, product.id);
      }

      modal.show();
    }

    function closeModal() {
      const modal = bootstrap.Modal.getInstance(document.getElementById('product-modal'));
      modal.hide();
    }

    // Handle product creation
    function handleProductCreate(e) {
      e.preventDefault();
      const errorMessage = document.getElementById('modal-error');
      errorMessage.classList.add('d-none');
      errorMessage.textContent = '';

      const name = document.getElementById('modal-product-name').value.trim();
      const price = parseFloat(document.getElementById('modal-product-price').value);
      const stock = parseInt(document.getElementById('modal-product-stock').value);
      const description = document.getElementById('modal-product-description').value.trim();
      const category = document.getElementById('modal-product-category').value;
      const image = document.getElementById('modal-product-image').value.trim() || 'img/placeholder.png';

      if (!name || isNaN(price) || price < 0 || isNaN(stock) || stock < 0 || !category) {
        errorMessage.textContent = 'Please fill in all required fields correctly.';
        errorMessage.classList.remove('d-none');
        return;
      }

      const products = JSON.parse(localStorage.getItem('seller_products') || '[]');
      const newProduct = {
        id: generateProductId(products),
        name,
        price,
        stock,
        description: description || 'No description provided',
        category,
        image,
        sellerId: SELLER_ID
      };

      products.push(newProduct);
      localStorage.setItem('seller_products', JSON.stringify(products));
      closeModal();
      showToast('Product created successfully!');
      loadSellerProducts();
      updateDashboard();
    }

    // Handle product editing
    function handleProductEdit(e, productId) {
      e.preventDefault();
      const errorMessage = document.getElementById('modal-error');
      errorMessage.classList.add('d-none');
      errorMessage.textContent = '';

      const name = document.getElementById('modal-product-name').value.trim();
      const price = parseFloat(document.getElementById('modal-product-price').value);
      const stock = parseInt(document.getElementById('modal-product-stock').value);
      const description = document.getElementById('modal-product-description').value.trim();
      const category = document.getElementById('modal-product-category').value;
      const image = document.getElementById('modal-product-image').value.trim() || 'img/placeholder.png';

      if (!name || isNaN(price) || price < 0 || isNaN(stock) || stock < 0 || !category) {
        errorMessage.textContent = 'Please fill in all required fields correctly.';
        errorMessage.classList.remove('d-none');
        return;
      }

      const products = JSON.parse(localStorage.getItem('seller_products') || '[]');
      const productIndex = products.findIndex(p => p.id === productId);
      if (productIndex !== -1) {
        products[productIndex] = {
          ...products[productIndex],
          name,
          price,
          stock,
          description: description || 'No description provided',
          category,
          image
        };
        localStorage.setItem('seller_products', JSON.stringify(products));
        closeModal();
        showToast('Product updated successfully!');
        loadSellerProducts();
        updateDashboard();
      }
    }

    // Handle product deletion
    function deleteProduct(productId) {
      if (confirm('Are you sure you want to delete this product?')) {
        const products = JSON.parse(localStorage.getItem('seller_products') || '[]');
        const updatedProducts = products.filter(p => p.id !== productId);
        localStorage.setItem('seller_products', JSON.stringify(updatedProducts));
        showToast('Product deleted successfully!');
        loadSellerProducts();
        updateDashboard();
      }
    }

    // Load and display seller's products
    async function loadSellerProducts() {
      const products = JSON.parse(localStorage.getItem('seller_products') || '[]');
      const searchQuery = document.getElementById('product-search').value.toLowerCase();
      const categoryFilter = document.getElementById('product-category-filter').value;
      let sellerProducts = products.filter(p => p.sellerId === SELLER_ID);

      if (searchQuery) {
        sellerProducts = sellerProducts.filter(p => p.name.toLowerCase().includes(searchQuery));
      }
      if (categoryFilter) {
        sellerProducts = sellerProducts.filter(p => p.category === categoryFilter);
      }

      const productList = document.getElementById('product-list');
      productList.innerHTML = '';

      if (sellerProducts.length === 0) {
        productList.innerHTML = '<p class="text-center">No products found.</p>';
        return;
      }

      sellerProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'col-md-4 product-card';
        card.setAttribute('data-product-id', product.id);
        card.innerHTML = `
          <div class="card h-100">
            <img src="${product.image}" class="card-img-top" alt="${product.name}" loading="lazy">
            <div class="card-body">
              <h3 class="card-title">${product.name}</h3>
              <p class="card-text">Price: ${product.price.toLocaleString()} ₸</p>
              <p class="card-text">Stock: ${product.stock || 0}</p>
              <p class="card-text">Category: ${product.category}</p>
              <div class="actions d-flex gap-2 mt-2">
                <button class="btn btn-primary btn-sm" onclick='openModal("edit", ${JSON.stringify(product)})'>Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">Delete</button>
              </div>
            </div>
          </div>
        `;
        card.addEventListener('click', (e) => {
          if (!e.target.closest('.actions button')) {
            window.location.href = `Product-Page.html?id=${product.id}`;
          }
        });
        productList.appendChild(card);
      });
    }

    // Load and display orders
    function loadOrders() {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const products = JSON.parse(localStorage.getItem('seller_products') || '[]');
      const sellerProductIds = products.filter(p => p.sellerId === SELLER_ID).map(p => p.id);
      const sellerOrders = orders.filter(o => sellerProductIds.includes(o.productId));
      const orderList = document.getElementById('order-list');
      orderList.innerHTML = '';

      if (sellerOrders.length === 0) {
        orderList.innerHTML = '<p class="text-center">No orders found.</p>';
        return;
      }

      sellerOrders.forEach(order => {
        const product = products.find(p => p.id === order.productId);
        const card = document.createElement('div');
        card.className = 'col-md-4 order-card';
        card.innerHTML = `
          <div class="card h-100">
            <div class="card-body">
              <h3 class="card-title">Order #${order.orderId}</h3>
              <p class="card-text">Product: ${product ? product.name : 'Unknown'}</p>
              <p class="card-text">Customer: ${order.customerName || 'Anonymous'}</p>
              <p class="card-text">Price: ${product ? product.price.toLocaleString() : 'N/A'} ₸</p>
              <p class="card-text">Date: ${new Date(order.date).toLocaleDateString()}</p>
              <p class="card-text">Status: ${order.status || 'Pending'}</p>
              <div class="actions d-flex gap-2 mt-2">
                <button class="btn btn-outline-primary btn-sm" onclick="updateOrderStatus(${order.orderId}, 'Pending')">Pending</button>
                <button class="btn btn-outline-success btn-sm" onclick="updateOrderStatus(${order.orderId}, 'Shipped')">Shipped</button>
                <button class="btn btn-outline-info btn-sm" onclick="updateOrderStatus(${order.orderId}, 'Delivered')">Delivered</button>
              </div>
            </div>
          </div>
        `;
        orderList.appendChild(card);
      });
    }

    // Update order status
    function updateOrderStatus(orderId, status) {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const orderIndex = orders.findIndex(o => o.orderId === orderId);
      if (orderIndex !== -1) {
        orders[orderIndex].status = status;
        localStorage.setItem('orders', JSON.stringify(orders));
        showToast(`Order status updated to: ${status}`);
        loadOrders();
        updateDashboard();
      }
    }

    // Update dashboard overview
    function updateDashboard() {
      const products = JSON.parse(localStorage.getItem('seller_products') || '[]');
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const sellerProducts = products.filter(p => p.sellerId === SELLER_ID);
      const sellerProductIds = sellerProducts.map(p => p.id);
      const sellerOrders = orders.filter(o => sellerProductIds.includes(o.productId));

      const totalRevenue = sellerOrders.reduce((sum, order) => {
        const product = products.find(p => p.id === order.productId);
        return sum + (product ? product.price : 0);
      }, 0);

      document.getElementById('total-products').textContent = sellerProducts.length;
      document.getElementById('total-orders').textContent = sellerOrders.length;
      document.getElementById('total-revenue').textContent = totalRevenue.toLocaleString() + ' ₸';
    }



    // Populate categories
    async function populateCategories() {
      try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const products = await response.json();
        const categories = [...new Set(products.map(p => p.category))];
        const categoryList = document.getElementById('category-list');
        categoryList.innerHTML = categories
          .map(category => `<li><a href="search-results.html?category=${encodeURIComponent(category)}">${category}</a></li>`)
          .join('');
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    }

    // Update cart count
    function updateCartCount() {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartCountElements = document.querySelectorAll('.cart-count');
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElements.forEach(element => {
          element.textContent = totalItems;
        });
      } catch (error) {
        console.error('Error updating cart count:', error);
      }
    }

    // Initialize and load data
    initializeStorage();
    loadSellerProducts();
    loadOrders();
    updateDashboard();
    populateCategories();
    updateCartCount();

    // Event listeners
    document.getElementById('product-search').addEventListener('input', loadSellerProducts);
    document.getElementById('product-category-filter').addEventListener('change', loadSellerProducts);

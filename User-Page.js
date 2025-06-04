document.addEventListener('DOMContentLoaded', function () {
    // Simulated server API for updating orders.json
    function updateOrdersJson(orders) {
        localStorage.setItem('orders', JSON.stringify(orders));
        console.log('Orders updated:', orders);
    }

    // Load orders from localStorage if available, otherwise fetch from orders.json
    function getOrders() {
        const storedOrders = localStorage.getItem('orders');
        if (storedOrders) {
            return Promise.resolve(JSON.parse(storedOrders));
        }
        return fetch('./orders.json').then(response => {
            if (!response.ok) throw new Error('Failed to load orders.json');
            return response.json();
        });
    }

    // Load user data
    const user = localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')) : null;
    if (user) {
        // Update profile information
        document.getElementById('profile-name').textContent = user.name || 'Not specified';
        document.getElementById('profile-email').textContent = user.email || 'Not specified';
        document.getElementById('profile-phone').textContent = user.phone || 'Not specified';
        document.getElementById('profile-address').textContent = user.address || 'Not specified';
        document.getElementById('profile-status').textContent = user.status || 'Standard';
        document.getElementById('editName').value = user.name || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editPhone').value = user.phone || '';
        document.getElementById('editAddress').value = user.address || '';

        // Load orders and products
        Promise.all([
            getOrders(),
            fetch('./products.json').then(response => {
                if (!response.ok) throw new Error('Failed to load products.json');
                return response.json();
            })
        ])
        .then(([orders, products]) => {
            const userOrders = orders.filter(order => order.userId === user.id);
            const ordersContainer = document.getElementById('orders-container');
            ordersContainer.innerHTML = ''; // Clear container

            if (userOrders.length === 0) {
                ordersContainer.innerHTML = '<p>You have no orders.</p>';
            } else {
                userOrders.forEach(order => {
                    const statusClass = {
                        'delivered': 'status-delivered',
                        'processing': 'status-processing',
                        'cancelled': 'status-cancelled'
                    }[order.status] || '';
                    const progressWidth = {
                        'delivered': '100%',
                        'processing': '50%',
                        'cancelled': '0%'
                    }[order.status] || '0%';
                    const progressClass = {
                        'delivered': 'bg-success',
                        'processing': 'bg-warning',
                        'cancelled': 'bg-danger'
                    }[order.status] || 'bg-secondary';

                    // Generate product list with links
                    const productList = order.products
                        ? order.products.map(item => {
                              const product = products.find(p => p.id === item.productId);
                              return product
                                  ? `<a href="Product-Page.html?id=${product.id}" class="product-link">${product.name}</a> (x${item.quantity})`
                                  : `Product #${item.productId} (x${item.quantity})`;
                          }).join(', ')
                        : 'No products';

                    const orderCard = document.createElement('div');
                    orderCard.className = `col-md-6 order-card animate__fadeIn`;
                    orderCard.setAttribute('data-status', order.status);
                    orderCard.innerHTML = `
                        <div class="card p-3">
                            <h5 class="card-title">Order #${order.orderId}</h5>
                            <p><strong>Date:</strong> ${order.date}</p>
                            <p><strong>Total Amount:</strong> ${order.amount.toLocaleString()} KZT</p>
                            <p><strong>Status:</strong> <span class="${statusClass}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></p>
                            <p><strong>Products:</strong> ${productList}</p>
                            <div class="progress mb-3">
                                <div class="progress-bar ${progressClass}" role="progressbar" style="width: ${progressWidth}" aria-valuenow="${progressWidth.replace('%', '')}" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <div class="d-flex gap-2">
                                <a href="${order.details}" class="btn btn-outline-primary"><i class="bi bi-eye me-2"></i>Details</a>
                                ${order.status === 'processing' ? `<button class="btn btn-outline-danger cancel-order" data-order-id="${order.orderId}"><i class="bi bi-x-circle me-2"></i>Cancel</button>` : ''}
                            </div>
                        </div>
                    `;
                    ordersContainer.appendChild(orderCard);
                });

                // Handle order cancellation
                document.querySelectorAll('.cancel-order').forEach(button => {
                    button.addEventListener('click', function () {
                        const orderId = this.getAttribute('data-order-id');
                        if (confirm(`Are you sure you want to cancel order #${orderId}?`)) {
                            const updatedOrders = orders.map(order =>
                                order.orderId === parseInt(orderId) ? { ...order, status: 'cancelled' } : order
                            );
                            updateOrdersJson(updatedOrders);
                            alert(`Order #${orderId} has been cancelled.`);
                            // Reload orders
                            getOrders().then(newOrders => {
                                const userOrders = newOrders.filter(order => order.userId === user.id);
                                ordersContainer.innerHTML = '';
                                userOrders.forEach(order => {
                                    const statusClass = {
                                        'delivered': 'status-delivered',
                                        'processing': 'status-processing',
                                        'cancelled': 'status-cancelled'
                                    }[order.status] || '';
                                    const progressWidth = {
                                        'delivered': '100%',
                                        'processing': '50%',
                                        'cancelled': '0%'
                                    }[order.status] || '0%';
                                    const progressClass = {
                                        'delivered': 'bg-success',
                                        'processing': 'bg-warning',
                                        'cancelled': 'bg-danger'
                                    }[order.status] || 'bg-secondary';

                                    const productList = order.products
                                        ? order.products.map(item => {
                                              const product = products.find(p => p.id === item.productId);
                                              return product
                                                  ? `<a href="Product-Page.html?id=${product.id}" class="product-link">${product.name}</a> (x${item.quantity})`
                                                  : `Product #${item.productId} (x${item.quantity})`;
                                          }).join(', ')
                                        : 'No products';

                                    const orderCard = document.createElement('div');
                                    orderCard.className = `col-md-6 order-card animate__fadeIn`;
                                    orderCard.setAttribute('data-status', order.status);
                                    orderCard.innerHTML = `
                                        <div class="card p-3">
                                            <h5 class="card-title">Order #${order.orderId}</h5>
                                            <p><strong>Date:</strong> ${order.date}</p>
                                            <p><strong>Total Amount:</strong> ${order.amount.toLocaleString()} KZT</p>
                                            <p><strong>Status:</strong> <span class="${statusClass}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></p>
                                            <p><strong>Products:</strong> ${productList}</p>
                                            <div class="progress mb-3">
                                                <div class="progress-bar ${progressClass}" role="progressbar" style="width: ${progressWidth}" aria-valuenow="${progressWidth.replace('%', '')}" aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                            <div class="d-flex gap-2">
                                                <a href="${order.details}" class="btn btn-outline-primary"><i class="bi bi-eye me-2"></i>Details</a>
                                                ${order.status === 'processing' ? `<button class="btn btn-outline-danger cancel-order" data-order-id="${order.orderId}"><i class="bi bi-x-circle me-2"></i>Cancel</button>` : ''}
                                            </div>
                                        </div>
                                    `;
                                    ordersContainer.appendChild(orderCard);
                                });
                            });
                        }
                    });
                });
            }
        })
        .catch(error => {
            console.error('Error loading data:', error);
            document.getElementById('orders-container').innerHTML = '<p>Error loading orders.</p>';
        });
    } else {
        alert('Please log in.');
        window.location.href = './Login.html';
    }

    // Smooth scrolling for sidebar links
    document.querySelectorAll('.sidebar a').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            if (targetId) {
                const targetElement = document.getElementById(targetId);
                window.scrollTo({
                    top: targetElement.offsetTop - 20,
                    behavior: 'smooth'
                });
                document.querySelectorAll('.sidebar .nav-link').forEach(link => link.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });

    // Order filtering
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            document.querySelectorAll('.order-card').forEach(card => {
                if (filter === 'all' || card.getAttribute('data-status') === filter) {
                    card.style.display = 'block';
                    card.classList.add('animate__fadeIn');
                } else {
                    card.style.display = 'none';
                }
            });
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Save profile changes
    document.getElementById('saveProfileBtn').addEventListener('click', function() {
        const name = document.getElementById('editName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        const address = document.getElementById('editAddress').value.trim();

        const updatedUser = { ...user, name, email, phone, address };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        document.getElementById('profile-name').textContent = name || 'Not specified';
        document.getElementById('profile-email').textContent = email || 'Not specified';
        document.getElementById('profile-phone').textContent = phone || 'Not specified';
        document.getElementById('profile-address').textContent = address || 'Not specified';

        const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        modal.hide();
        alert('Profile successfully updated!');
    });

    // Logout
    document.getElementById('logout').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        alert('You have logged out.');
        window.location.href = './Login.html';
    });
});

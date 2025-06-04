document.addEventListener('DOMContentLoaded', function () {
    // save data orders.json
    function updateOrdersJson(orders) {
        localStorage.setItem('orders', JSON.stringify(orders));
        console.log('Orders updated:', orders);
    }

    function getOrders() {
        return fetch('./orders.json').then(response => {
            if (!response.ok) throw new Error('Failed to load orders.json');
            return response.json();
        });
    }

    const user = localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')) : null;
    if (!user || user.role !== 'admin') {
        alert('Access denied. Administrator account required.');
        window.location.href = './Login.html';
        return;
    }

    function loadUsers() {
        fetch('./users.json')
            .then(response => {
                if (!response.ok) throw new Error('Failed to load users.json');
                return response.json();
            })
            .then(users => {
                const usersTable = document.getElementById('users-table');
                usersTable.innerHTML = ''; // Очистка таблицы
                users.forEach(user => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${user.phone || '-'}</td>
                        <td>${user.address || '-'}</td>
                        <td>${user.status}</td>
                        <td>${user.role}</td>
                        <td>
                            <button class="btn btn-sm btn-primary edit-user" data-id="${user.id}"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-sm btn-danger delete-user" data-id="${user.id}"><i class="bi bi-trash"></i></button>
                        </td>
                    `;
                    usersTable.appendChild(row);
                });

                // Обработчики для кнопок редактирования и удаления пользователей
                document.querySelectorAll('.edit-user').forEach(button => {
                    button.addEventListener('click', function () {
                        const userId = this.getAttribute('data-id');
                        const user = users.find(u => u.id == userId);
                        if (user) {
                            document.getElementById('editUserId').value = user.id;
                            document.getElementById('editUserName').value = user.name;
                            document.getElementById('editUserEmail').value = user.email;
                            document.getElementById('editUserPassword').value = '';
                            document.getElementById('editUserPhone').value = user.phone || '';
                            document.getElementById('editUserAddress').value = user.address || '';
                            document.getElementById('editUserStatus').value = user.status;
                            document.getElementById('editUserRole').value = user.role;
                            new bootstrap.Modal(document.getElementById('editUserModal')).show();
                        }
                    });
                });

                document.querySelectorAll('.delete-user').forEach(button => {
                    button.addEventListener('click', function () {
                        const userId = this.getAttribute('data-id');
                        alert(`Deleting user #${userId} (placeholder)`);
                    });
                });
            })
            .catch(error => {
                console.error('Error loading users:', error);
                document.getElementById('users-table').innerHTML = '<tr><td colspan="8">Error loading data.</td></tr>';
            });
    }

    function loadOrders() {
        Promise.all([
            getOrders(),
            fetch('./users.json').then(response => {
                if (!response.ok) throw new Error('Failed to load users.json');
                return response.json();
            }),
            fetch('./products.json').then(response => {
                if (!response.ok) throw new Error('Failed to load products.json');
                return response.json();
            })
        ])
        .then(([orders, users, products]) => {
            const ordersTable = document.getElementById('orders-table');
            ordersTable.innerHTML = ''; // Очистка таблицы
            orders.forEach(order => {
                const user = users.find(u => u.id === order.userId) || { name: 'Unknown' };
                const statusClass = {
                    'delivered': 'status-delivered',
                    'processing': 'status-processing',
                    'cancelled': 'status-cancelled'
                }[order.status] || '';

                // Формирование списка продуктов с ссылками
                const productList = order.products
                    ? order.products.map(item => {
                          const product = products.find(p => p.id === item.productId);
                          return product
                              ? `<a href="Product-Page.html?id=${product.id}" class="product-link">${product.name}</a> (x${item.quantity})`
                              : `Product #${item.productId} (x${item.quantity})`;
                      }).join(', ')
                    : 'No products';

                const row = document.createElement('tr');
                row.setAttribute('data-status', order.status);
                row.innerHTML = `
                    <td>${order.orderId}</td>
                    <td>${user.name}</td>
                    <td>${order.date}</td>
                    <td>${order.amount.toLocaleString()} KZT</td>
                    <td><span class="${statusClass}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span></td>
                    <td>${productList}</td>
                    <td><a href="${order.details}" class="btn btn-sm btn-outline-primary"><i class="bi bi-eye"></i></a></td>
                    <td>
                        <button class="btn btn-sm btn-primary edit-order" data-id="${order.orderId}"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-danger delete-order" data-id="${order.orderId}"><i class="bi bi-trash"></i></button>
                    </td>
                `;
                ordersTable.appendChild(row);
            });

            // Обработчики для кнопок редактирования и удаления заказов
            document.querySelectorAll('.edit-order').forEach(button => {
                button.addEventListener('click', function () {
                    const orderId = this.getAttribute('data-id');
                    const order = orders.find(o => o.orderId === parseInt(orderId));
                    if (order) {
                        document.getElementById('editOrderId').value = order.orderId;
                        document.getElementById('editOrderUserId').value = order.userId;
                        document.getElementById('editOrderDate').value = order.date;
                        document.getElementById('editOrderAmount').value = order.amount;
                        document.getElementById('editOrderStatus').value = order.status;
                        document.getElementById('editOrderDetails').value = order.details;
                        new bootstrap.Modal(document.getElementById('editOrderModal')).show();
                    }
                });
            });

            document.querySelectorAll('.delete-order').forEach(button => {
                button.addEventListener('click', function () {
                    const orderId = this.getAttribute('data-id');
                    if (confirm(`Are you sure you want to delete order #${orderId}?`)) {
                        getOrders().then(orders => {
                            const updatedOrders = orders.filter(o => o.orderId !== parseInt(orderId));
                            updateOrdersJson(updatedOrders);
                            alert(`Order #${orderId} deleted.`);
                            loadOrders(); // Перезагрузка таблицы
                        });
                    }
                });
            });
        })
        .catch(error => {
            console.error('Error loading data:', error);
            document.getElementById('orders-table').innerHTML = '<tr><td colspan="8">Error loading data.</td></tr>';
        });
    }

    // Фильтрация заказов
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', function () {
            const filter = this.getAttribute('data-filter');
            document.querySelectorAll('#orders-table tr').forEach(row => {
                if (filter === 'all' || row.getAttribute('data-status') === filter) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Сохранение изменений пользователя
    document.getElementById('saveUserBtn').addEventListener('click', function () {
        alert('Saving user (placeholder)');
        const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        modal.hide();
    });

    // Добавление нового пользователя
    document.getElementById('addUserBtn').addEventListener('click', function () {
        alert('Adding user (placeholder)');
        const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
        modal.hide();
    });

    // Сохранение изменений заказа
    document.getElementById('saveOrderBtn').addEventListener('click', function () {
        const orderId = parseInt(document.getElementById('editOrderId').value);
        const updatedOrder = {
            orderId: orderId,
            userId: parseInt(document.getElementById('editOrderUserId').value),
            date: document.getElementById('editOrderDate').value,
            amount: parseFloat(document.getElementById('editOrderAmount').value),
            status: document.getElementById('editOrderStatus').value,
            details: document.getElementById('editOrderDetails').value,
            products: [] // Preserve existing products (not editable in modal)
        };

        getOrders().then(orders => {
            const order = orders.find(o => o.orderId === orderId);
            if (order) {
                updatedOrder.products = order.products; // Retain products
                const updatedOrders = orders.map(o => o.orderId === orderId ? updatedOrder : o);
                updateOrdersJson(updatedOrders);
                alert('Order successfully updated.');
                const modal = bootstrap.Modal.getInstance(document.getElementById('editOrderModal'));
                modal.hide();
                loadOrders(); // Перезагрузка таблицы
            }
        });
    });

    // Добавление нового заказа
    document.getElementById('addOrderBtn').addEventListener('click', function () {
        const newOrder = {
            orderId: parseInt(document.getElementById('addOrderId').value),
            userId: parseInt(document.getElementById('addOrderUserId').value),
            date: document.getElementById('addOrderDate').value,
            amount: parseFloat(document.getElementById('addOrderAmount').value),
            status: document.getElementById('addOrderStatus').value,
            details: document.getElementById('addOrderDetails').value,
            products: [] // Placeholder, requires product selection UI
        };

        getOrders().then(orders => {
            if (orders.find(o => o.orderId === newOrder.orderId)) {
                alert('An order with this ID already exists.');
                return;
            }
            const updatedOrders = [...orders, newOrder];
            updateOrdersJson(updatedOrders);
            alert('Order successfully added.');
            const modal = bootstrap.Modal.getInstance(document.getElementById('addOrderModal'));
            modal.hide();
            loadOrders(); // Перезагрузка таблицы
        });
    });

    // Выход
    document.getElementById('logout').addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        alert('You have logged out');
        window.location.href = './Login.html';
    });

    // Инициализация загрузки данных
    loadUsers();
    loadOrders();
});

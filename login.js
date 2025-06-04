function toggleForm() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
  registerForm.style.display = registerForm.style.display === 'none' ? 'block' : 'none';
}
 document.getElementById('loginForm').addEventListener('submit', function (e) {
   e.preventDefault();
   const email = document.getElementById('login-email').value.trim();
   const password = document.getElementById('login-password').value.trim();

   console.log('Попытка логина:', { email, password });

   fetch('./users.json')
     .then(response => {
       console.log('Статус ответа:', response.status);
       if (!response.ok) throw new Error('Не удалось загрузить users.json');
       return response.json();
     })
     .then(users => {
       console.log('Загруженные пользователи:', users);
       let foundUser = null;
       for (let i = 0; i < users.length; i++) {
         console.log('Сравнение:', users[i].email, email, users[i].password, password);
         if (users[i].email === email && users[i].password === password) {
           foundUser = users[i];
           break;
         }
       }
       if (foundUser) {
         console.log('Пользователь найден:', foundUser);
         localStorage.setItem('currentUser', JSON.stringify(foundUser));
         alert('Авторизация успешна! Добро пожаловать, ' + foundUser.name + '!');
         if (foundUser.role === 'admin') {
           window.location.href = './AdminPanel.html';
         }
         else if(foundUser.role === 'user'){
           window.location.href = './UserPage.html';
         }
         else if(foundUser.role === 'seller'){
           window.location.href = './Seller-Page.html';
         }
       } else {
         alert('Неверный email или пароль');
       }

     })
     .catch(error => {
       console.error('Ошибка:', error);
       alert('Ошибка загрузки данных. Убедитесь, что users.json доступен.');
     });
 });
 document.getElementById('registerForm').addEventListener('submit', function (e) {
   e.preventDefault();
   const name = document.getElementById('register-name').value.trim();
   const email = document.getElementById('register-email').value.trim();
   const password = document.getElementById('register-password').value.trim();

   console.log('Попытка регистрации:', { name, email, password });

   fetch('./users.json')
     .then(response => {
       if (!response.ok) throw new Error('Не удалось загрузить users.json');
       return response.json();
     })
     .then(users => {
       const emailExists = users.some(user => user.email === email);
       if (emailExists) {
         alert('Этот email уже зарегистрирован');
       } else {
         alert('Регистрация успешна! Войдите с вашим email и паролем.');
         toggleForm();
       }
     })
     .catch(error => {
       console.error('Ошибка:', error);
       alert('Ошибка регистрации. Попробуйте позже.');
     });
 });

// Registrar un nuevo usuario
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;

  try {
    const response = await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    document.getElementById('message').textContent = result.message || result.error;
  } catch (error) {
    console.error(error);
    document.getElementById('message').textContent = 'Error al registrar el usuario';
  }
});

// Iniciar sesión
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    if (response.ok) {
      document.getElementById('message').textContent = result.message;
      // Redirigir a la página principal después del login
      window.location.href = 'main.html'; // Cambia "main.html" por tu página principal
    } else {
      document.getElementById('message').textContent = result.error;
    }
  } catch (error) {
    console.error(error);
    document.getElementById('message').textContent = 'Error al iniciar sesión';
  }
});
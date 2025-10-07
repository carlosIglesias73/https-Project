// public/js/app.js

// Función para verificar si el token JWT ha expirado
function isTokenExpired(token) {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    return now >= exp;
  } catch (e) {
    console.error('Error al decodificar el token:', e);
    return true;
  }
}

// Función para verificar autenticación y redirigir si es necesario
function checkAuth() {
  const currentPath = window.location.pathname;

  // Proteger ruta /mfa
  if (currentPath === '/mfa') {
    if (!localStorage.getItem('logId')) {
      window.location.href = '/';
    }
  }

  // Redirigir desde login si ya está autenticado
  if (currentPath === '/' || currentPath === '/register') {
    const token = localStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      window.location.href = '/welcome';
    }
  }
}

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', checkAuth);

// Elemento de salida
const out = document.getElementById('out');

// FORMULARIO DE REGISTRO
document.getElementById('register')?.addEventListener('submit', async e => {
  e.preventDefault();
  const form = new FormData(e.target);
  const body = {
    name: form.get('name'),
    email: form.get('email'),
    password: form.get('password')
  };

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);

    if (res.ok) {
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  } catch (error) {
    out.textContent = `Error: ${error.message}`;
  }
});

// FORMULARIO DE LOGIN
document.getElementById('login')?.addEventListener('submit', async e => {
  e.preventDefault();
  const form = new FormData(e.target);
  const body = {
    email: form.get('email'),
    password: form.get('password')
  };

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);

    if (data.logId) {
      localStorage.setItem('logId', data.logId);
      window.location.href = '/mfa';
    }
  } catch (error) {
    out.textContent = `Error: ${error.message}`;
  }
});

// FORMULARIO DE MFA
document.getElementById('mfa-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const form = new FormData(e.target);
  const logId = localStorage.getItem('logId');
  const code = form.get('code');

  if (!logId) {
    out.textContent = 'Error: No se encontró el ID de sesión.';
    return;
  }

  try {
    const res = await fetch('/api/auth/verify-mfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId, code })
    });
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);

    if (data.token) {
      // Guardar token en localStorage (respaldo)
      localStorage.setItem('token', data.token);
      
      // Limpiar logId
      localStorage.removeItem('logId');
      
      // Redirigir a welcome (el servidor manejará la autenticación por cookie)
      window.location.href = '/welcome';
    }
  } catch (error) {
    out.textContent = `Error: ${error.message}`;
  }
});

// BOTÓN DE LOGOUT
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  const token = localStorage.getItem('token');
  
  if (!token || isTokenExpired(token)) {
    out.textContent = "No hay sesión activa o el token ha expirado.";
    localStorage.removeItem('token');
    localStorage.removeItem('logId');
    window.location.href = '/';
    return;
  }

  try {
    const res = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);

    if (res.ok) {
      localStorage.removeItem('token');
      localStorage.removeItem('logId');
      window.location.href = '/';
    }
  } catch (error) {
    out.textContent = `Error: ${error.message}`;
  }
});

// BOTÓN DE PRUEBA DE RUTA PROTEGIDA
document.getElementById('test-protected')?.addEventListener('click', async () => {
  const token = localStorage.getItem('token');
  
  if (!token || isTokenExpired(token)) {
    out.textContent = "No hay sesión activa o el token ha expirado.";
    localStorage.removeItem('token');
    localStorage.removeItem('logId');
    window.location.href = '/';
    return;
  }

  try {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    out.textContent = `Error: ${error.message}`;
  }
});
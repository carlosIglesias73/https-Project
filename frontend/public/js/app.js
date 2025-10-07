// Importar helpers (agregar en HTML: <script src="/js/api.js"></script>)
// Importar auth (agregar en HTML: <script src="/js/auth.js"></script>)

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
    const { response, data } = await API.register(body);
    out.textContent = JSON.stringify(data, null, 2);

    if (response.ok) {
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
    const { response, data } = await API.login(body);
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
    const { response, data } = await API.verifyMfa(logId, code);
    out.textContent = JSON.stringify(data, null, 2);

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.removeItem('logId');
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
    const { response, data } = await API.logout();
    out.textContent = JSON.stringify(data, null, 2);

    if (response.ok) {
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
    const { response, data } = await API.me();
    out.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    out.textContent = `Error: ${error.message}`;
  }
});
// ❌ ELIMINAR esta función (no se usa con cookies)
// function isTokenExpired(token) {
//   if (!token) return true;
//   // ... código eliminado
// }

// ✅ Función para verificar si hay una sesión activa (con cookies)
async function isAuthenticated() {
  try {
    const { response } = await API.me();
    return response.ok;
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    return false;
  }
}

// ✅ Función para verificar autenticación y redirigir si es necesario
async function checkAuth() {
  const currentPath = window.location.pathname;

  // Proteger ruta /mfa
  if (currentPath === '/mfa') {
    if (!localStorage.getItem('logId')) {
      window.location.href = '/';
    }
    return;
  }

  // Proteger ruta /welcome
  if (currentPath === '/welcome') {
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      console.log('❌ No hay sesión activa, redirigiendo a login...');
      localStorage.removeItem('logId'); // Solo mantener logId
      window.location.href = '/';
    } else {
      console.log('✅ Sesión activa verificada');
    }
    return;
  }

  // Redirigir desde login si ya está autenticado
  if (currentPath === '/' || currentPath === '/register') {
    const authenticated = await isAuthenticated();
    
    if (authenticated) {
      console.log('✅ Ya hay sesión activa, redirigiendo a welcome...');
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

// ✅ FORMULARIO DE MFA - CORREGIDO
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

    if (response.ok && data.user) {
      console.log('✅ Autenticación exitosa, redirigiendo...');
      localStorage.removeItem('logId'); // Limpiar solo logId
      
      // Redirigir después de mostrar el mensaje
      setTimeout(() => {
        window.location.href = '/welcome';
      }, 1000);
    }
  } catch (error) {
    out.textContent = `Error: ${error.message}`;
  }
});

// BOTÓN DE LOGOUT
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  try {
    const { response, data } = await API.logout();
    out.textContent = JSON.stringify(data, null, 2);

    if (response.ok) {
      // ❌ NO limpiar token de localStorage (no existe)
      localStorage.removeItem('logId'); // Solo limpiar logId
      window.location.href = '/';
    }
  } catch (error) {
    out.textContent = `Error: ${error.message}`;
  }
});

// BOTÓN DE PRUEBA DE RUTA PROTEGIDA
document.getElementById('test-protected')?.addEventListener('click', async () => {
  try {
    const { response, data } = await API.me();
    out.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    out.textContent = `Error: ${error.message}`;
  }
});
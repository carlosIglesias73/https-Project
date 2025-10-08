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

// ✅ Función para verificar si hay una sesión activa (con cookies)
async function isAuthenticated() {
  try {
    // Intentar hacer una petición a /me para verificar la sesión
    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      credentials: 'include', // Importante: enviar cookies
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
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
    return; // No verificar sesión en MFA
  }

  // Proteger ruta /welcome
  if (currentPath === '/welcome') {
    const authenticated = await isAuthenticated();
    
    if (!authenticated) {
      console.log('❌ No hay sesión activa, redirigiendo a login...');
      localStorage.removeItem('token');
      localStorage.removeItem('logId');
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
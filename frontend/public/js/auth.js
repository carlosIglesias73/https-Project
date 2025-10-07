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

  // Proteger ruta /welcome
  if (currentPath === '/welcome') {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem('token');
      localStorage.removeItem('logId');
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
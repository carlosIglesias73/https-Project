// frontend/js/auth.js

// Elemento de salida común (definido aquí una sola vez)
const out = document.getElementById('out');

// Función para verificar si hay una sesión activa (haciendo una petición a una ruta protegida)
async function isAuthenticated() {
  try {
    const { response, data } = await API.me(); // Usamos la función 'me' de api.js
    console.log("Verificación de sesión - Status:", response.status, "Data:", data);
    return response.ok; // Devuelve true si la respuesta es OK (200-299), false si no (401, etc.)
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    return false; // Si hay un error de red o parseo, asumimos que no está autenticado
  }
}

// Función para verificar autenticación y redirigir si es necesario
async function checkAuth() {
  const currentPath = window.location.pathname;
  console.log("Verificando autenticación para la ruta:", currentPath);

  // Proteger ruta /mfa (requiere logId en localStorage)
  if (currentPath === '/mfa') {
    const logId = localStorage.getItem('logId');
    if (!logId) {
      console.log('❌ No se encontró logId, redirigiendo a login...');
      window.location.href = '/'; // Redirige si no hay logId
    }
    return; // No hacer más verificaciones en esta ruta
  }

  // Proteger ruta /welcome (requiere sesión activa)
  if (currentPath === '/welcome') {
    const authenticated = await isAuthenticated(); // Verifica con el backend
    if (!authenticated) {
      console.log('❌ No hay sesión activa (respuesta 401), redirigiendo a login...');
      localStorage.removeItem('logId'); // Limpiar logId si la sesión es inválida
      window.location.href = '/'; // Redirige si no está autenticado
    } else {
      console.log('✅ Sesión activa verificada vía API.');
    }
    return; // No hacer más verificaciones en esta ruta
  }

  // Redirigir desde login o register si ya está autenticado (verifica con el backend)
  if (currentPath === '/' || currentPath === '/register') {
    const authenticated = await isAuthenticated(); // Verifica con el backend
    if (authenticated) {
      console.log('✅ Ya hay sesión activa, redirigiendo a welcome...');
      window.location.href = '/welcome'; // Redirige si ya está logueado
    }
  }
  // Para otras rutas, no se hace verificación aquí a menos que se especifique
}

// Ejecutar la verificación de autenticación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', checkAuth);

// Exportar funciones si se usa un sistema de módulos (opcional)
// window.checkAuth = checkAuth; // O exportar si se usa ES6 modules
// frontend/js/api.js

// Configuración de la API
const getApiUrl = () => {
  // En desarrollo local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000/api/auth';
  }
  // En producción (Vercel) - actualizar con tu URL de backend real
  // Asegúrate de que esta URL sea la correcta de tu backend desplegado
  return 'https://auth-backend-sigma-lac.vercel.app/api/auth'; // Verifica esta URL
};

const API_URL = getApiUrl();
console.log('🔗 API URL:', API_URL);

// Helper para hacer peticiones
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  console.log('🔍 Realizando petición a:', url);

  const defaultOptions = {
    mode: 'cors', // Importante para CORS
    credentials: 'include', // ✅ CRÍTICO: Incluir cookies en todas las peticiones
    headers: {
      'Content-Type': 'application/json',
      ...options.headers // Permite sobrescribir headers si es necesario
    }
  };

  // NO usar token de localStorage (backend ahora usa cookies)
  // const token = localStorage.getItem('token'); // Eliminar esta línea
  // if (token && !options.skipAuth) { // Eliminar este bloque
  //   defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  //   console.log('🔑 Token agregado (no se usa):', token.substring(0, 20) + '...');
  // }

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options // Sobrescribe defaultOptions con lo que venga en options
    });

    console.log('📨 Respuesta recibida:', response.status, response.statusText);

    let data;
    try {
      data = await response.json();
      console.log('✅ Datos parseados:', data);
    } catch (e) {
      console.error('❌ Error al parsear JSON:', e);
      // Si no se puede parsear JSON, intenta leer texto o crea un objeto genérico
      if (response.headers.get("content-type")?.includes("application/json")) {
          // Si esperábamos JSON pero falló
          data = { message: 'Error al procesar respuesta JSON del servidor' };
      } else {
          // Si no era JSON, obtenemos texto
          const text = await response.text();
          data = { message: text || 'Respuesta no JSON recibida' };
      }
    }

    return { response, data };
  } catch (error) {
    console.error('❌ Error en petición de red:', error);
    return {
      response: { ok: false, status: 0, statusText: 'Network Error' },
      data: { message: `Error de conexión de red: ${error.message}` }
    };
  }
}

// Funciones de API
const API = {
  // Registro
  register: async (userData) => {
    return await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },
  // Login (Paso 1)
  login: async (credentials) => {
    return await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },
  // Verificar MFA (Paso 2)
  verifyMfa: async (logId, code) => {
    return await apiRequest('/verify-mfa', {
      method: 'POST',
      body: JSON.stringify({ logId, code })
    });
  },
  // Logout
  logout: async () => {
    return await apiRequest('/logout', {
      method: 'POST'
    });
  },
  // Obtener datos del usuario actual (Ruta Protegida)
  me: async () => {
    return await apiRequest('/me', { // Asegúrate que sea '/me'
      method: 'GET'
      // No se necesita body ni headers especiales, las cookies se incluyen automáticamente
    });
  }
};

// Exportar si se usa un sistema de módulos (opcional)
// window.API = API; // O exportar si se usa ES6 modules
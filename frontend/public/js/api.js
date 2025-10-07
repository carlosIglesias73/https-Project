// Configuración de la API
const getApiUrl = () => {
  // En desarrollo local
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000/api/auth';
  }
  
  // En producción (Vercel) - actualizar con tu URL de backend
  return 'https://tu-backend.vercel.app/api/auth';
};

const API_URL = getApiUrl();

console.log('🔗 API URL:', API_URL);

// Helper para hacer peticiones
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  console.log('🔍 Realizando petición a:', url);
  console.log('📦 Opciones:', options);
  
  const defaultOptions = {
    mode: 'cors', // Importante: habilitar CORS
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  // Agregar token si existe
  const token = localStorage.getItem('token');
  if (token && !options.skipAuth) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Token agregado:', token.substring(0, 20) + '...');
  }

  try {
    console.log('📡 Enviando petición...');
    const response = await fetch(url, {
      ...defaultOptions,
      ...options
    });

    console.log('📨 Respuesta recibida:', response.status, response.statusText);

    let data;
    try {
      data = await response.json();
      console.log('✅ Datos parseados:', data);
    } catch (e) {
      console.error('❌ Error al parsear JSON:', e);
      data = { message: 'Error al procesar respuesta del servidor' };
    }
    
    return { response, data };
  } catch (error) {
    console.error('❌ Error en petición:', error);
    return {
      response: { ok: false, status: 0 },
      data: { message: `Error de conexión: ${error.message}` }
    };
  }
}

// Funciones de API
const API = {
  // Registro
  register: async (userData) => {
    return await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipAuth: true
    });
  },

  // Login
  login: async (credentials) => {
    return await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipAuth: true
    });
  },

  // Verificar MFA
  verifyMfa: async (logId, code) => {
    return await apiRequest('/verify-mfa', {
      method: 'POST',
      body: JSON.stringify({ logId, code }),
      skipAuth: true
    });
  },

  // Logout
  logout: async () => {
    return await apiRequest('/logout', {
      method: 'POST'
    });
  },

  // Obtener datos del usuario
  me: async () => {
    return await apiRequest('/me', {
      method: 'GET'
    });
  }
};
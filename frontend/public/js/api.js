// frontend/js/api.js

const getApiUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000/api/auth';
  }
  return 'https://auth-backend-sigma-lac.vercel.app/api/auth';
};

const API_URL = getApiUrl();
console.log('🔗 API URL:', API_URL);

async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  console.log('🔍 Realizando petición a:', url);

  const defaultOptions = {
    mode: 'cors',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };

  // ✅ Agregar token de localStorage si existe
  const token = localStorage.getItem('token');
  if (token && !options.skipAuth) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Token agregado al header');
  }

  try {
    const response = await fetch(url, {
      ...defaultOptions,
      ...options
    });

    console.log('📨 Respuesta recibida:', response.status);

    let data;
    try {
      data = await response.json();
      console.log('✅ Datos parseados:', data);
    } catch (e) {
      data = { message: 'Error al procesar respuesta' };
    }

    return { response, data };
  } catch (error) {
    console.error('❌ Error en petición:', error);
    return {
      response: { ok: false, status: 0 },
      data: { message: `Error de red: ${error.message}` }
    };
  }
}

const API = {
  register: async (userData) => {
    return await apiRequest('/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  login: async (credentials) => {
    return await apiRequest('/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  },

  verifyMfa: async (logId, code) => {
    const result = await apiRequest('/verify-mfa', {
      method: 'POST',
      body: JSON.stringify({ logId, code })
    });

    // ✅ Guardar token si viene en la respuesta
    if (result.response.ok && result.data.token) {
      console.log('💾 Guardando token en localStorage');
      localStorage.setItem('token', result.data.token);
    }

    return result;
  },

  logout: async () => {
    const result = await apiRequest('/logout', {
      method: 'POST'
    });

    localStorage.removeItem('token');
    console.log('🗑️ Token eliminado');

    return result;
  },

  me: async () => {
    return await apiRequest('/me', {
      method: 'GET'
    });
  }
};

window.API = API;
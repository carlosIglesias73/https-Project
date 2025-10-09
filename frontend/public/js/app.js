// frontend/js/app.js
// ELIMINAR ESTA LÍNEA: const out = document.getElementById('out');
// La variable 'out' ya está definida en auth.js

// Función encapsulada para cargar datos del usuario
async function loadUserData() {
  try {
    const { data } = await API.me(); // Usamos la función 'me' definida en api.js
    const userInfoElement = document.getElementById('user-info'); // Guardamos la referencia

    // Verificamos si el elemento existe antes de manipularlo
    if (!userInfoElement) {
        console.error('❌ El elemento #user-info no se encontró en el DOM (dentro de loadUserData).');
        // Opcional: Actualizar 'out' si está disponible
        if (typeof out !== 'undefined' && out) {
            out.textContent = 'Error: Elemento #user-info no encontrado.';
        }
        return; // Salimos de la función si no hay elemento
    }

    if (data && data.user) {
      userInfoElement.innerHTML = `
        <p><strong>Email:</strong> ${data.user.email}</p>
        <p><strong>Nombre:</strong> ${data.user.name}</p>
        <p style="margin-top: 8px;"><strong>ID:</strong> ${data.user.id}</p>
        ${data.user.last_login ? `<p><strong>Último login:</strong> ${new Date(data.user.last_login).toLocaleString()}</p>` : ''}
      `;
      // Opcional: Actualizar 'out' con éxito (si se desea mostrar la respuesta completa)
      // if (typeof out !== 'undefined' && out) {
      //     out.textContent = JSON.stringify(data, null, 2);
      // }
    } else {
      throw new Error('Datos de usuario no disponibles o sesión inválida');
    }
  } catch (error) {
    console.error('Error al cargar usuario:', error);
    const userInfoElement = document.getElementById('user-info'); // Guardamos la referencia

    // Verificamos si el elemento existe antes de manipularlo
    if (!userInfoElement) {
        console.error('❌ El elemento #user-info no se encontró en el DOM (en el catch de loadUserData).');
        // Opcional: Actualizar 'out' si está disponible
        if (typeof out !== 'undefined' && out) {
            out.textContent = `Error: Elemento #user-info no encontrado (en catch). ${error.message}`;
        }
        return; // Salimos de la función si no hay elemento
    }

    userInfoElement.innerHTML = `
      <p style="color: #e74c3c;">
        <strong>Error:</strong> No se pudieron cargar los datos del usuario
      </p>
      <p style="font-size: 12px; margin-top: 8px;">${error.message}</p>
    `;
    // Opcional: Mostrar error en 'out' (si se desea mostrar el error allí también)
    // if (typeof out !== 'undefined' && out) {
    //     out.textContent = `Error al cargar usuario: ${error.message}`;
    // }
  }
}

// Verificar si el elemento específico de welcome.html existe antes de ejecutar la lógica
if (document.getElementById('user-info')) {
  // Solo ejecutar la carga de usuario si estamos en welcome.html
  loadUserData();
} else {
  // Opcional: Puedes dejar un log si app.js se carga en una página donde no debería hacer nada
  console.log("app.js cargado, pero no se encontró #user-info. No se ejecutó la carga de usuario.");
}

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

    // ✅ VERIFICAR SI LA AUTENTICACIÓN FUE EXITOSA
    if (response.ok && data.user) {
      console.log('✅ Autenticación exitosa, redirigiendo...');
      localStorage.removeItem('logId');
      
      // Redirigir después de mostrar el mensaje
      setTimeout(() => {
        window.location.href = '/welcome';
      }, 1000);
    } else if (!response.ok) {
      console.error('❌ Error en verificación:', data.message);
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
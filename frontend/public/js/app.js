// frontend/js/app.js

// Función encapsulada para cargar datos del usuario
async function loadUserData() {
  try {
    const { response, data } = await API.me();
    const userInfoElement = document.getElementById('user-info');

    if (!userInfoElement) {
        console.error('❌ El elemento #user-info no se encontró en el DOM.');
        return;
    }

    if (response.ok && data && data.user) {
      userInfoElement.innerHTML = `
        <p><strong>Email:</strong> ${data.user.email}</p>
        <p><strong>Nombre:</strong> ${data.user.name}</p>
        <p style="margin-top: 8px;"><strong>ID:</strong> ${data.user.id}</p>
        ${data.user.last_login ? `<p><strong>Último login:</strong> ${new Date(data.user.last_login).toLocaleString()}</p>` : ''}
      `;
    } else {
      throw new Error('Datos de usuario no disponibles o sesión inválida');
    }
  } catch (error) {
    console.error('Error al cargar usuario:', error);
    const userInfoElement = document.getElementById('user-info');

    if (!userInfoElement) {
        console.error('❌ El elemento #user-info no se encontró en el DOM (en el catch).');
        return;
    }

    userInfoElement.innerHTML = `
      <p style="color: #e74c3c;">
        <strong>Error:</strong> No se pudieron cargar los datos del usuario
      </p>
      <p style="font-size: 12px; margin-top: 8px;">${error.message}</p>
    `;
  }
}

// Verificar si estamos en welcome.html
if (document.getElementById('user-info')) {
  loadUserData();
} else {
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

    if (response.ok && data.user) {
      console.log('✅ Autenticación exitosa, redirigiendo...');
      localStorage.removeItem('logId');
      
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
  try {
    const { response, data } = await API.logout();
    out.textContent = JSON.stringify(data, null, 2);

    if (response.ok) {
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
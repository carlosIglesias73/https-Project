const out = document.getElementById('out');

async function isAuthenticated() {
  try {
    const { response } = await API.me();
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function checkAuth() {
  const currentPath = window.location.pathname;

  if (currentPath === '/mfa') {
    const logId = localStorage.getItem('logId');
    if (!logId) {
      window.location.href = '/';
    }
    return;
  }

  if (currentPath === '/welcome') {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      localStorage.removeItem('logId');
      window.location.href = '/';
    }
    return;
  }

  if (currentPath === '/' || currentPath === '/register') {
    const authenticated = await isAuthenticated();
    if (authenticated) {
      window.location.href = '/welcome';
    }
  }
}

document.addEventListener('DOMContentLoaded', checkAuth);
//public/app.js
const out = document.getElementById('out');

document.getElementById('register').addEventListener('submit', async e=>{
  e.preventDefault();
  const form = new FormData(e.target);
  const body = {
    name: form.get('name'),
    email: form.get('email'),
    password: form.get('password')
  };
  const res = await fetch('/api/auth/register', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  const txt = await res.json();
  out.textContent = JSON.stringify(txt, null, 2);
});

document.getElementById('login').addEventListener('submit', async e=>{
  e.preventDefault();
  const form = new FormData(e.target);
  const body = { email: form.get('email'), password: form.get('password') };
  const res = await fetch('/api/auth/login', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  const txt = await res.json();
  out.textContent = JSON.stringify(txt, null, 2);
  if (txt.token) {
    localStorage.setItem('token', txt.token);
  }
});

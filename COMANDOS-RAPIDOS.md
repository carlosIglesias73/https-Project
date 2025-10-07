# ⚡ Comandos Rápidos - Referencia

## 🏗️ Setup Inicial

```bash
# Clonar estructura
git clone tu-repo.git
cd tu-repo

# Dar permisos de ejecución (Linux/Mac)
chmod +x setup-dev.sh dev-start.sh

# Setup completo
./setup-dev.sh

# O manualmente:
cd backend && npm install && npm run init-db && cd ..
cd frontend && npm install && cd ..
```

---

## 💻 Desarrollo Local

### Iniciar ambos servidores (recomendado)
```bash
./dev-start.sh
```

### O manualmente en terminales separadas:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### URLs de desarrollo:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Health: http://localhost:4000/health

---

## 🧪 Testing

### Test de API con curl

**Registro:**
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'
```

**Login:**
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

**Verificar MFA:**
```bash
curl -X POST http://localhost:4000/api/auth/verify-mfa \
  -H "Content-Type: application/json" \
  -d '{"logId":1,"code":"TU_CODIGO"}'
```

**Me (ruta protegida):**
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer TU_TOKEN"
```

**Logout:**
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer TU_TOKEN"
```

---

## 🗄️ Base de Datos

### Comandos MySQL útiles:

```sql
-- Conectar
mysql -u root -p

-- Usar la base de datos
USE secure_login_db;

-- Ver tablas
SHOW TABLES;

-- Ver estructura
DESCRIBE users;
DESCRIBE login_logs;

-- Ver usuarios
SELECT id, email, name, created_at FROM users;

-- Ver logs de login
SELECT l.id, u.email, l.success, l.started_at 
FROM login_logs l 
JOIN users u ON l.user_id = u.id 
ORDER BY l.started_at DESC 
LIMIT 10;

-- Limpiar todo (CUIDADO)
DROP DATABASE secure_login_db;

-- Recrear
CREATE DATABASE secure_login_db;
```

### Re-inicializar base de datos:
```bash
cd backend
npm run init-db
```

---

## 🚀 Deploy a Vercel

### Primera vez:

**Backend:**
```bash
cd backend
vercel login
vercel
# Seguir prompts interactivos
vercel --prod
```

**Frontend:**
```bash
cd frontend
vercel
# Seguir prompts interactivos
vercel --prod
```

### Re-deploy (después del primer deploy):

```bash
# Backend
cd backend && vercel --prod

# Frontend
cd frontend && vercel --prod
```

### Ver logs en producción:
```bash
vercel logs https://tu-proyecto.vercel.app --follow
```

### Variables de entorno:
```bash
# Listar
vercel env ls

# Agregar nueva
vercel env add NOMBRE_VARIABLE

# Eliminar
vercel env rm NOMBRE_VARIABLE
```

---

## 🔧 Mantenimiento

### Actualizar dependencias:
```bash
# Backend
cd backend
npm update
npm audit fix

# Frontend
cd frontend
npm update
npm audit fix
```

### Ver versiones:
```bash
node -v
npm -v
mysql --version
vercel --version
```

### Limpiar node_modules:
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Git Workflow

### Ignorar archivos sensibles:

**Backend .gitignore:**
```
node_modules/
.env
*.log
.DS_Store
.vercel
```

**Frontend .gitignore:**
```
node_modules/
.env
*.log
.DS_Store
.vercel
```

### Commits útiles:
```bash
git add .
git commit -m "feat: add authentication system"
git push origin main

# Para deployar automáticamente en Vercel
# (si está conectado con GitHub)
```

---

## 🐛 Debug

### Ver logs en tiempo real:

**Backend local:**
```bash
cd backend
npm run dev
# Los logs aparecen en la terminal
```

**Backend en Vercel:**
```bash
vercel logs https://tu-backend.vercel.app --follow
```

### Verificar variables de entorno:

**Local:**
```bash
cd backend
cat .env
```

**Vercel:**
```bash
vercel env ls
```

### Test de conectividad:

```bash
# Backend health check
curl http://localhost:4000/health

# Frontend
curl http://localhost:3000

# Producción
curl https://tu-backend.vercel.app/health
```

---

## 🔑 Generar nuevos secretos

### JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Código MFA (manual):
```javascript
Math.random().toString(36).substring(2, 10).toUpperCase()
```

---

## 📚 Recursos Útiles

- **Vercel Docs**: https://vercel.com/docs
- **MySQL Docs**: https://dev.mysql.com/doc/
- **Express.js**: https://expressjs.com/
- **JWT**: https://jwt.io/
- **Nodemailer**: https://nodemailer.com/

---

## 💡 Tips

1. **Siempre prueba localmente antes de deployar**
2. **Usa variables de entorno para secretos**
3. **Revisa logs cuando algo falle**
4. **Mantén .env fuera del repositorio**
5. **Usa códigos de 8 caracteres para MFA**
6. **El token JWT expira en 1 hora**
7. **Las App Passwords de Gmail no caducan**
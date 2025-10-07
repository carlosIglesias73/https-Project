# ✅ Checklist de Pruebas en Desarrollo Local

## Pre-requisitos
- [ ] MySQL instalado y corriendo
- [ ] Node.js 18+ instalado
- [ ] Credenciales de Gmail App Password configuradas

## Setup Inicial
```bash
# 1. Dar permisos de ejecución
chmod +x setup-dev.sh dev-start.sh

# 2. Ejecutar setup
./setup-dev.sh

# 3. Editar backend/.env con tus credenciales
# DB_PASSWORD=tu_password_mysql
# EMAIL_USER=tu_email@gmail.com
# EMAIL_PASS=tu_app_password
```

## Pruebas del Backend (API)

### 1. Health Check
```bash
curl http://localhost:4000/health
```
**Esperado:** `{"status":"ok",...}`

### 2. Registro de Usuario
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```
**Esperado:** `{"message":"Usuario creado exitosamente"}`

### 3. Login (envía código MFA)
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```
**Esperado:** `{"message":"Código MFA enviado...","logId":1}`
**Revisa tu email** para el código

### 4. Verificar MFA
```bash
curl -X POST http://localhost:4000/api/auth/verify-mfa \
  -H "Content-Type: application/json" \
  -d '{
    "logId": 1,
    "code": "ABCD1234"
  }'
```
**Esperado:** `{"token":"eyJhbGc...","message":"Autenticación exitosa",...}`

### 5. Ruta Protegida
```bash
# Reemplaza TOKEN con el token obtenido arriba
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```
**Esperado:** `{"user":{...},"message":"Usuario autenticado correctamente"}`

### 6. Logout
```bash
curl -X POST http://localhost:4000/api/auth/logout \
  -H "Authorization: Bearer TOKEN"
```
**Esperado:** `{"message":"Sesión cerrada exitosamente"}`

---

## Pruebas del Frontend (Interfaz)

### 1. Abrir navegador
```
http://localhost:3000
```

### 2. Flujo completo de prueba
- [ ] Página de login se carga correctamente
- [ ] Click en "Regístrate aquí"
- [ ] Llenar formulario de registro
- [ ] Verificar mensaje de éxito
- [ ] Redirige automáticamente a login
- [ ] Hacer login con credenciales creadas
- [ ] Verificar que se envió email con código MFA
- [ ] Ingresar código MFA de 8 caracteres
- [ ] Verificar redirección a /welcome
- [ ] Verificar que muestra email e ID del usuario
- [ ] Click en "Probar Ruta Protegida"
- [ ] Verificar respuesta con datos de usuario
- [ ] Click en "Cerrar Sesión"
- [ ] Verificar redirección a login

### 3. Pruebas de seguridad
- [ ] Intentar acceder a `/welcome` sin token → redirige a login
- [ ] Intentar acceder a `/mfa` sin logId → redirige a login
- [ ] Usar token expirado → muestra error
- [ ] Usar código MFA incorrecto → muestra error

### 4. Consola del navegador (F12)
- [ ] No hay errores de CORS
- [ ] Se muestra `🔗 API URL: http://localhost:4000/api/auth`
- [ ] Peticiones a API retornan 200 (éxito) o códigos apropiados

---

## Troubleshooting

### Error: "Cannot connect to MySQL"
```bash
# Verifica que MySQL esté corriendo
mysql -u root -p

# O inicia el servicio
# Windows: net start MySQL80
# Mac: brew services start mysql
# Linux: sudo systemctl start mysql
```

### Error: "CORS blocked"
- Verifica que backend esté corriendo en puerto 4000
- Verifica que frontend esté corriendo en puerto 3000
- Revisa que `FRONTEND_URL` en backend/.env sea `http://localhost:3000`

### Error: "Failed to send email"
- Verifica credenciales de Gmail en backend/.env
- Usa una "App Password" de Gmail, NO tu contraseña normal
- Guía: https://support.google.com/accounts/answer/185833

### Error: "Token expired"
- El token JWT expira en 1 hora
- Cierra sesión y vuelve a hacer login

---

## Estructura de Base de Datos

### Verificar tablas creadas
```sql
USE secure_login_db;
SHOW TABLES;
-- Debe mostrar: users, login_logs

DESCRIBE users;
DESCRIBE login_logs;
```

### Ver usuarios registrados
```sql
SELECT id, email, name, created_at FROM users;
```

### Ver logs de login
```sql
SELECT l.id, u.email, l.ip, l.success, l.started_at 
FROM login_logs l 
JOIN users u ON l.user_id = u.id
ORDER BY l.started_at DESC
LIMIT 10;
```

---

## Listo para Vercel

Una vez que todas las pruebas pasen:
```bash
# 1. Backend
cd backend
vercel --prod
# Guarda la URL: https://tu-backend.vercel.app

# 2. Actualiza frontend/public/js/api.js con la URL del backend

# 3. Frontend
cd frontend
vercel --prod
```

**Variables de entorno en Vercel:**
- Backend: Agrega todas las vars de .env en Vercel dashboard
- Frontend: No necesita vars de entorno adicionales
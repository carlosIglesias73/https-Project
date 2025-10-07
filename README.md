# 🔐 Sistema de Autenticación Seguro con MFA

Sistema de autenticación web con autenticación de dos factores (MFA) por correo electrónico, JWT y arquitectura MVC.

## ✨ Características

- 🔒 **Autenticación JWT** con cookies HTTP-only
- 📧 **MFA por Email** - Código de verificación de 8 caracteres
- 🏗️ **Arquitectura MVC** - Código organizado y mantenible
- 🔐 **HTTPS** - Comunicación segura con certificados SSL
- 📊 **Logs de Sesión** - Rastreo de inicios de sesión y duraciones
- 🛡️ **Seguridad** - Bcrypt, tokens expirables, cookies seguras
- 🎨 **UI Moderna** - Interfaz limpia y responsive

## 📋 Requisitos Previos

- Node.js >= 14.x
- MySQL >= 5.7
- Cuenta de Gmail (para envío de MFA)
- Certificados SSL (incluidos en `/certs` para desarrollo)

## 🚀 Instalación Rápida

### 1. Clonar e instalar dependencias

```bash
git clone <tu-repositorio>
cd proyecto
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=secure_login_db

# JWT
JWT_SECRET=cambia_esto_por_un_secreto_muy_seguro_y_largo

# Email (Gmail)
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_app_password_de_gmail

# Servidor
PORT=8443
NODE_ENV=development
```

### 3. Configurar Gmail para envío de emails

1. Ve a [myaccount.google.com/security](https://myaccount.google.com/security)
2. Activa la verificación en 2 pasos
3. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. Genera una contraseña de aplicación
5. Usa esa contraseña en `EMAIL_PASS`

### 4. Inicializar base de datos

```bash
npm run init-db
```

### 5. Iniciar servidor

```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

### 6. Acceder a la aplicación

Abre tu navegador en: `https://localhost:8443`

⚠️ **Nota**: Acepta el certificado autofirmado en tu navegador (es solo para desarrollo).

## 📁 Estructura del Proyecto

```
proyecto/
├── src/
│   ├── config/
│   │   └── database.js          # Configuración MySQL
│   ├── models/
│   │   ├── User.js              # Modelo de usuarios
│   │   └── LoginLog.js          # Modelo de logs de sesión
│   ├── controllers/
│   │   └── authController.js    # Lógica de autenticación
│   ├── middlewares/
│   │   ├── authMiddleware.js    # Middleware para API
│   │   └── viewAuthMiddleware.js # Middleware para vistas
│   ├── routes/
│   │   ├── api.js               # Rutas API REST
│   │   └── views.js             # Rutas de vistas HTML
│   ├── services/
│   │   └── emailService.js      # Servicio de envío de emails
│   └── utils/
│       └── (helpers adicionales)
├── public/
│   ├── js/
│   │   └── app.js               # Lógica del frontend
│   └── css/
│       └── styles.css           # Estilos
├── views/
│   ├── index.ejs                # Login
│   ├── register.ejs             # Registro
│   ├── mfa.ejs                  # Verificación MFA
│   ├── welcome.ejs              # Dashboard (protegido)
│   └── error.ejs                # Página de error
├── certs/
│   ├── cert.pem                 # Certificado SSL
│   └── key.pem                  # Clave privada
├── scripts/
│   ├── init-db.js               # Script de inicialización DB
│   ├── verify-structure.js      # Verificar estructura
│   └── auto-migrate.js          # Migración automática
├── .env                         # Variables de entorno
├── .gitignore
├── schema.sql                   # Esquema de base de datos
├── server.js                    # Punto de entrada
├── package.json
└── README.md
```

## 🔄 Flujo de Autenticación

```
1. Usuario → /register → Crear cuenta
2. Usuario → /login → Ingresar credenciales
3. Sistema → Genera código MFA → Envía por email
4. Usuario → /mfa → Ingresa código de verificación
5. Sistema → Valida código → Genera JWT → Guarda en cookie
6. Usuario → /welcome → Accede a área protegida
7. Usuario → Logout → Cookie se elimina → Sesión termina
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo con recarga automática
npm run dev

# Producción
npm start

# Inicializar/resetear base de datos
npm run init-db

# Verificar estructura del proyecto
npm run verify
```

## 🔐 Seguridad Implementada

### Autenticación
- ✅ Bcrypt para hash de contraseñas (10 rounds)
- ✅ JWT con expiración de 1 hora
- ✅ Códigos MFA alfanuméricos (8 caracteres)
- ✅ Validación de tokens en cada petición

### Cookies
- ✅ `httpOnly`: No accesibles desde JavaScript
- ✅ `secure`: Solo por HTTPS
- ✅ `sameSite: strict`: Protección contra CSRF
- ✅ Expiración automática

### Base de Datos
- ✅ Prepared statements (previene SQL injection)
- ✅ Connection pooling
- ✅ Validación de inputs

### General
- ✅ HTTPS obligatorio
- ✅ Variables de entorno para secretos
- ✅ Logs de sesiones con IP y user-agent
- ✅ Middleware de protección de rutas

## 📊 Base de Datos

### Tabla: `users`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- name (VARCHAR)
- created_at (TIMESTAMP)
- last_login (TIMESTAMP)
```

### Tabla: `login_logs`
```sql
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- user_id (INT, FOREIGN KEY)
- ip (VARCHAR)
- user_agent (TEXT)
- code (VARCHAR) -- Código MFA
- success (BOOLEAN)
- started_at (TIMESTAMP)
- ended_at (TIMESTAMP)
- duration (INT) -- Duración en segundos
```

## 🧪 Testing

### Prueba Manual Completa

1. **Registro de Usuario**
   ```
   POST /api/auth/register
   Body: { email, password, name }
   Resultado: Usuario creado
   ```

2. **Login**
   ```
   POST /api/auth/login
   Body: { email, password }
   Resultado: logId + email con código MFA
   ```

3. **Verificación MFA**
   ```
   POST /api/auth/verify-mfa
   Body: { logId, code }
   Resultado: token JWT + cookie
   ```

4. **Acceso a Ruta Protegida**
   ```
   GET /welcome
   Cookie: token
   Resultado: Página de bienvenida
   ```

5. **Logout**
   ```
   POST /api/auth/logout
   Header: Authorization: Bearer <token>
   Resultado: Cookie eliminada + sesión cerrada
   ```

## 🐛 Solución de Problemas

### Error: "Cannot find module 'cookie-parser'"
```bash
npm install cookie-parser
```

### Error: "Access denied for user 'root'@'localhost'"
Verifica las credenciales en `.env` y que MySQL esté corriendo:
```bash
mysql -u root -p
```

### Error: "Email no llega"
1. Verifica que uses una App Password de Gmail
2. Revisa la carpeta de spam
3. Verifica logs del servidor: `npm run dev`

### Error: "Certificate not trusted"
Es normal en desarrollo. Acepta el certificado en tu navegador o genera uno válido con Let's Encrypt para producción.

## 📦 Dependencias Principales

```json
{
  "express": "^4.18.x",
  "mysql2": "^3.6.x",
  "bcryptjs": "^2.4.x",
  "jsonwebtoken": "^9.0.x",
  "nodemailer": "^6.9.x",
  "cookie-parser": "^1.4.x",
  "ejs": "^3.1.x",
  "dotenv": "^16.3.x",
  "cors": "^2.8.x"
}
```

## 🚀 Despliegue a Producción

### Consideraciones

1. **Certificado SSL Real**: Usa Let's Encrypt o un proveedor comercial
2. **Variables de Entorno**: No subas `.env` al repositorio
3. **Base de Datos**: Usa MySQL en servidor remoto (no localhost)
4. **JWT_SECRET**: Genera uno seguro de 64+ caracteres
5. **Rate Limiting**: Implementa límites de peticiones
6. **Logs**: Usa Winston o similar para logs profesionales
7. **Process Manager**: Usa PM2 para mantener el servidor activo

### Ejemplo con PM2

```bash
npm install -g pm2
pm2 start server.js --name "auth-system"
pm2 startup
pm2 save
```

## 📝 Licencia

MIT

## 👥 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📧 Contacto

Para preguntas o sugerencias, abre un issue en el repositorio.

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!
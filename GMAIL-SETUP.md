# 📧 Configuración de Gmail App Password

Para que funcione el envío de emails MFA, necesitas una **App Password** de Gmail.

## Pasos:

### 1. Habilitar verificación en 2 pasos
1. Ve a https://myaccount.google.com/security
2. En "Acceso a Google", habilita **Verificación en dos pasos**
3. Sigue los pasos para configurarla

### 2. Generar App Password
1. Ve a https://myaccount.google.com/apppasswords
2. Selecciona:
   - **App:** Correo
   - **Dispositivo:** Otro (nombre personalizado)
3. Escribe: `Sistema de Autenticación`
4. Click en **Generar**
5. **Copia el código de 16 caracteres** (sin espacios)

### 3. Configurar en .env
```env
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=abcdefghijklmnop   # La App Password generada
```

## ⚠️ Notas importantes:
- **NO uses tu contraseña normal de Gmail** - no funcionará
- La App Password es de 16 caracteres sin espacios
- Puedes tener múltiples App Passwords activas
- Puedes revocarlas en cualquier momento

## Verificar configuración:
Una vez configurado, el backend mostrará al iniciar:
```
✅ Servidor de email configurado correctamente
```

Si hay error, mostrará:
```
❌ Error en configuración de email: [detalle]
```
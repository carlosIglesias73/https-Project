// src/services/emailService.js
const { createTransport } = require('nodemailer');
require('dotenv').config();

// Crear transporter de nodemailer
const transporter = createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verificar configuración de email al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Error en configuración de email:', error);
  } else {
    console.log('✅ Servidor de email configurado correctamente');
  }
});

const emailService = {
  /**
   * Enviar código MFA por correo electrónico
   * @param {string} email - Email del destinatario
   * @param {string} code - Código MFA de 8 caracteres
   */
  sendMfaCode: async (email, code) => {
    const mailOptions = {
      from: `"Sistema de Autenticación" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Código de Verificación MFA',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Código de Verificación</h2>
          <p>Has solicitado iniciar sesión en tu cuenta.</p>
          <p>Tu código de verificación es:</p>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #3498db; letter-spacing: 5px; margin: 0;">${code}</h1>
          </div>
          <p style="color: #7f8c8d; font-size: 14px;">
            Este código expirará en 10 minutos. Si no solicitaste este código, ignora este mensaje.
          </p>
          <hr style="border: none; border-top: 1px solid #ecf0f1; margin: 20px 0;">
          <p style="color: #95a5a6; font-size: 12px;">
            Este es un mensaje automático, por favor no responder.
          </p>
        </div>
      `,
      text: `Tu código de verificación es: ${code}. Este código expirará en 10 minutos.`
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Correo MFA enviado a ${email}`);
      return { success: true };
    } catch (err) {
      console.error('❌ Error al enviar correo:', err);
      throw new Error('No se pudo enviar el correo de verificación');
    }
  },

  /**
   * Enviar notificación de nuevo inicio de sesión
   * @param {string} email - Email del usuario
   * @param {string} ip - IP del usuario
   * @param {string} userAgent - User agent del navegador
   */
  sendLoginNotification: async (email, ip, userAgent) => {
    const mailOptions = {
      from: `"Sistema de Autenticación" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Nuevo inicio de sesión detectado',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Nuevo inicio de sesión</h2>
          <p>Se ha detectado un nuevo inicio de sesión en tu cuenta:</p>
          <ul style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <li><strong>IP:</strong> ${ip}</li>
            <li><strong>Navegador:</strong> ${userAgent}</li>
            <li><strong>Fecha:</strong> ${new Date().toLocaleString('es-MX')}</li>
          </ul>
          <p style="color: #7f8c8d; font-size: 14px;">
            Si no fuiste tú, cambia tu contraseña inmediatamente.
          </p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Notificación de login enviada a ${email}`);
    } catch (err) {
      console.error('❌ Error al enviar notificación:', err);
      // No lanzar error para no bloquear el login
    }
  }
};

module.exports = emailService;
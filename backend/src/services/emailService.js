// src/services/emailService.js
const nodemailer = require('nodemailer');

// ✅ Configuración del transporter (lazy initialization)
let transporter = null;
let isVerified = false;

const getTransporter = () => {
  if (!transporter) {
    console.log('📧 Inicializando transporter de email...');
    
    const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    
    if (!emailUser || !emailPass) {
      console.error('❌ EMAIL_USER o EMAIL_PASS no configurados');
      console.error('Variables disponibles:', {
        EMAIL_USER: emailUser ? '✓' : '✗',
        EMAIL_PASS: emailPass ? '✓' : '✗',
        SMTP_USER: process.env.SMTP_USER ? '✓' : '✗',
        SMTP_PASS: process.env.SMTP_PASS ? '✓' : '✗'
      });
    }
    
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });
    
    console.log('✅ Transporter creado');
    console.log(`📧 Email configurado: ${emailUser}`);
  }
  return transporter;
};

// ✅ Verificación bajo demanda (cuando se necesite)
const verifyTransporter = async () => {
  if (isVerified) return true;
  
  try {
    const t = getTransporter();
    await t.verify();
    isVerified = true;
    console.log('✅ Servidor de email verificado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error verificando configuración de email:', error.message);
    return false;
  }
};

const emailService = {
  /**
   * Enviar código MFA por correo electrónico
   * @param {string} email - Email del destinatario
   * @param {string} code - Código MFA de 8 caracteres
   */
  sendMfaCode: async (email, code) => {
    console.log(`📧 Preparando envío de código MFA a ${email}...`);
    
    // ✅ Verificar configuración antes de enviar
    const verified = await verifyTransporter();
    if (!verified && process.env.NODE_ENV === 'production') {
      throw new Error('Servicio de email no configurado correctamente');
    }
    
    const t = getTransporter();
    const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
    
    const mailOptions = {
      from: `"Sistema de Autenticación" <${emailUser}>`,
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
      console.log(`📧 Enviando correo MFA a ${email}...`);
      const info = await t.sendMail(mailOptions);
      console.log(`✅ Correo MFA enviado exitosamente a ${email}`);
      console.log(`📬 Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error('❌ Error al enviar correo:', err.message);
      console.error('Stack:', err.stack);
      
      // ✅ En desarrollo, permitir continuar sin email
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️  Modo desarrollo: Continuando sin enviar email');
        console.log(`🔑 Código MFA (solo desarrollo): ${code}`);
        return { success: true, dev_mode: true, code };
      }
      
      throw new Error(`No se pudo enviar el correo de verificación: ${err.message}`);
    }
  },

  /**
   * Enviar notificación de nuevo inicio de sesión
   * @param {string} email - Email del usuario
   * @param {string} ip - IP del usuario
   * @param {string} userAgent - User agent del navegador
   */
  sendLoginNotification: async (email, ip, userAgent) => {
    try {
      const t = getTransporter();
      const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
      
      const mailOptions = {
        from: `"Sistema de Autenticación" <${emailUser}>`,
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

      console.log(`📧 Enviando notificación de login a ${email}...`);
      await t.sendMail(mailOptions);
      console.log(`✅ Notificación de login enviada a ${email}`);
    } catch (err) {
      console.error('❌ Error al enviar notificación:', err.message);
      // No lanzar error para no bloquear el login
    }
  }
};

module.exports = emailService;
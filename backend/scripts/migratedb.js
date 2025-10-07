// scripts/verify-structure.js
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando estructura del proyecto...\n');

const requiredFiles = [
  // Configuración
  'src/config/database.js',
  
  // Modelos
  'src/models/User.js',
  'src/models/LoginLog.js',
  
  // Controladores
  'src/controllers/authController.js',
  
  // Middlewares
  'src/middlewares/authMiddleware.js',
  'src/middlewares/viewAuthMiddleware.js',
  
  // Rutas
  'src/routes/api.js',
  'src/routes/views.js',
  
  // Servicios
  'src/services/emailService.js',
  
  // Vistas
  'views/index.ejs',
  'views/register.ejs',
  'views/mfa.ejs',
  'views/welcome.ejs',
  'views/error.ejs',
  
  // Public
  'public/js/app.js',
  'public/css/styles.css',
  
  // Certificados
  'certs/cert.pem',
  'certs/key.pem',
  
  // Scripts
  'scripts/init-db.js',
  
  // Raíz
  'server.js',
  '.env',
  'schema.sql',
  'package.json'
];

let allGood = true;
const missing = [];
const found = [];

requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    found.push(file);
    console.log(`✅ ${file}`);
  } else {
    missing.push(file);
    console.log(`❌ ${file}`);
    allGood = false;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`Total archivos: ${requiredFiles.length}`);
console.log(`Encontrados: ${found.length}`);
console.log(`Faltantes: ${missing.length}`);
console.log('='.repeat(50) + '\n');

if (!allGood) {
  console.log('⚠️  Archivos faltantes:');
  missing.forEach(file => console.log(`   - ${file}`));
  console.log('\n❌ La estructura no está completa.');
  process.exit(1);
} else {
  console.log('✅ ¡Estructura del proyecto verificada correctamente!');
  console.log('\n📦 Verificando dependencias de package.json...');
  
  const packageJson = require('../package.json');
  const requiredDeps = [
    'express',
    'mysql2',
    'bcryptjs',
    'jsonwebtoken',
    'nodemailer',
    'dotenv',
    'cors',
    'cookie-parser',
    'ejs'
  ];
  
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
  );
  
  if (missingDeps.length > 0) {
    console.log('\n⚠️  Dependencias faltantes:');
    missingDeps.forEach(dep => console.log(`   - ${dep}`));
    console.log('\nEjecuta: npm install ' + missingDeps.join(' '));
  } else {
    console.log('✅ Todas las dependencias están instaladas');
  }
  
  console.log('\n🚀 Todo listo para ejecutar el servidor!');
  console.log('   Ejecuta: npm run dev');
}

// Verificar variables de entorno
console.log('\n🔐 Verificando archivo .env...');
require('dotenv').config();

const requiredEnvVars = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'EMAIL_USER',
  'EMAIL_PASS'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.log('⚠️  Variables de entorno faltantes en .env:');
  missingEnvVars.forEach(envVar => console.log(`   - ${envVar}`));
} else {
  console.log('✅ Todas las variables de entorno configuradas');
}
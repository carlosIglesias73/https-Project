const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
  ssl: {
    // Railway requiere SSL en la mayoría de conexiones públicas
    rejectUnauthorized: false,
  },
};

async function init() {
  let connection;

  console.log('==============================');
  console.log('🔧 Configuración de conexión:');
  console.log(config);
  console.log('==============================\n');

  try {
    console.log('🔌 Intentando conectar a MySQL...');

    connection = await mysql.createConnection(config);

    console.log('✅ Conexión establecida correctamente.');

    // Crear base de datos
    const dbName = process.env.DB_NAME || 'secure_login_db';
    console.log(`📦 Creando base de datos '${dbName}'...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);

    // Cambiar a esa base
    await connection.query(`USE \`${dbName}\`;`);
    console.log(`📂 Usando base de datos: ${dbName}`);

    // Cargar schema.sql
    const sqlPath = path.join(__dirname, '..', 'schema.sql');
    console.log(`📄 Cargando archivo SQL desde: ${sqlPath}`);

    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📋 Ejecutando script SQL...');
    await connection.query(sql);

    console.log('✅ Tablas creadas correctamente.');
    console.log('\n🎉 ¡Inicialización completada exitosamente!');
  } catch (err) {
    console.error('\n❌ ERROR DETECTADO:');
    console.error('Mensaje:', err.message);
    console.error('Código:', err.code);
    console.error('Stack:\n', err.stack);
    console.error('\n💡 Posibles causas:');
    console.error('  - Host, puerto o credenciales incorrectas');
    console.error('  - Conexión bloqueada por SSL');
    console.error('  - Base de datos no accesible desde tu red');
    console.error('  - Railway está reiniciando el contenedor');
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada.');
    }
  }
}

init();

const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true
};

async function init() {
  let connection;
  
  try {
    console.log('🔌 Conectando a MySQL...');
    connection = await mysql.createConnection(config);
    
    console.log('📦 Creando base de datos...');
    await connection.query('CREATE DATABASE IF NOT EXISTS secure_login_db;');
    console.log('✅ Base de datos creada o ya existía.');

    await connection.query('USE secure_login_db;');

    console.log('📋 Creando tablas...');
    const fs = require('fs');
    const path = require('path');
    const sql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
    await connection.query(sql);
    console.log('✅ Tablas creadas correctamente.');

    console.log('\n🎉 ¡Inicialización completada exitosamente!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada.');
    }
  }
}

init();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars);
  process.exit(1);
}

// Configuración SIN especificar database inicialmente
const config = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // NO especificar database aquí
  multipleStatements: true,
  ssl: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
  connectTimeout: 30000,
  enableKeepAlive: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function init() {
  let connection;

  console.log('==============================');
  console.log('🔧 Configuración de conexión:');
  console.log({
    ...config,
    password: '***' + config.password.slice(-4),
    ssl: '{ rejectUnauthorized: false, minVersion: TLSv1.2 }'
  });
  console.log('==============================\n');

  try {
    console.log('🔌 Conectando a MySQL en Railway...');
    connection = await mysql.createConnection(config);
    console.log('✅ Conexión establecida.\n');

    const dbName = process.env.DB_NAME;
    
    // Crear base de datos
    console.log(`📦 Creando base de datos '${dbName}' si no existe...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    console.log('✅ Base de datos lista.\n');

    // Usar la base de datos
    console.log(`📂 Cambiando a base de datos: ${dbName}`);
    await connection.query(`USE \`${dbName}\`;`);
    console.log('✅ Base de datos seleccionada.\n');

    // Cargar schema.sql
    const sqlPath = path.join(__dirname, '..', 'schema.sql');
    console.log(`📄 Buscando schema.sql en: ${sqlPath}`);

    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ No se encontró schema.sql en ${sqlPath}`);
      console.log('\n💡 Crea un archivo schema.sql con tus tablas, ejemplo:');
      console.log(`
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
      `);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log(`📋 Ejecutando schema.sql (${sql.length} caracteres)...`);

    // Ejecutar el SQL
    await connection.query(sql);
    console.log('✅ Schema ejecutado correctamente.\n');

    // Verificar tablas creadas
    console.log('📊 Verificando tablas creadas:');
    const [tables] = await connection.query('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('   ⚠️  No se crearon tablas (el schema puede estar vacío)');
    } else {
      tables.forEach(t => {
        const tableName = Object.values(t)[0];
        console.log(`   ✓ ${tableName}`);
      });
    }
    
    console.log('\n🎉 ¡Inicialización completada exitosamente!');
    
  } catch (err) {
    console.error('\n❌ ERROR:');
    console.error('Mensaje:', err.message);
    console.error('Código:', err.code);
    
    if (err.code === 'ECONNRESET') {
      console.error('\n💡 Railway cerró la conexión');
      console.error('   1. Verifica que el servicio MySQL esté activo en Railway');
      console.error('   2. Ve a Railway Dashboard → MySQL → Settings');
      console.error('   3. Reinicia el servicio si es necesario');
      console.error('   4. Verifica las credenciales copiándolas de nuevo');
    } else if (err.code === 'ENOTFOUND') {
      console.error('\n💡 Host no encontrado, verifica DB_HOST');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n💡 Credenciales incorrectas, verifica DB_USER y DB_PASSWORD');
    } else if (err.code === 'ETIMEDOUT') {
      console.error('\n💡 Timeout, el servidor no responde');
    } else if (err.code === 'ENOENT') {
      console.error('\n💡 Archivo schema.sql no encontrado');
    } else {
      console.error('\nStack completo:\n', err.stack);
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada.');
    }
  }
}

init();
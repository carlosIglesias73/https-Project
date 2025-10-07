// src/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'secure_login_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Manejar errores de conexión
pool.on('connection', (connection) => {
  console.log('Nueva conexión establecida a MySQL');
  
  connection.on('error', (err) => {
    console.error('Error en conexión MySQL:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Conexión a la base de datos perdida.');
    }
  });
});

module.exports = pool;
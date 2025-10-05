// scripts/init-db.js
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
  const connection = await mysql.createConnection(config);

  try {
    console.log('Conectando a MySQL...');
    await connection.query('CREATE DATABASE IF NOT EXISTS secure_login_db;');
    console.log('Base de datos creada o ya existía.');

    await connection.query('USE secure_login_db;');

    const fs = require('fs');
    const sql = fs.readFileSync('./schema.sql', 'utf8');
    await connection.query(sql);
    console.log('Tablas creadas correctamente.');

    await connection.end();
    console.log('Conexión cerrada.');
  } catch (err) {
    console.error('Error:', err);
    await connection.end();
  }
}

init();
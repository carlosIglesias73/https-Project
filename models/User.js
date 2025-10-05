// models/User.js
const db = require('../config/db');

const User = {
  create: async ({ email, passwordHash, name }) => {
    const query = 'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)';
    const [result] = await db.execute(query, [email, passwordHash, name]);
    return result.insertId;
  },

  findByEmail: async (email) => {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await db.execute(query, [email]);
    return rows[0];
  },

  findById: async (id) => {
    const query = 'SELECT id, email, name FROM users WHERE id = ?';
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }
};

module.exports = User;
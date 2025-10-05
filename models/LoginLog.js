// models/LoginLog.js
const db = require('../config/db');

const LoginLog = {
  create: async ({ userId, ip, userAgent, success, code = null }) => {
    const query = `
      INSERT INTO login_logs (user_id, ip, user_agent, success, code)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(query, [userId, ip, userAgent, success, code]);
    return result.insertId;
  }
};

module.exports = LoginLog;
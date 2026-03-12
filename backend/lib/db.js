const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER || 'stoksay',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'stoksay',
  charset:  'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  typeCast: function (field, next) {
    // JSON kolonlarını otomatik parse et
    if (field.type === 'JSON') {
      const val = field.string('utf8');
      if (!val) return null;
      try { return JSON.parse(val); } catch { return val; }
    }
    // TINYINT(1) → boolean
    if (field.type === 'TINY' && field.length === 1) {
      const val = field.string();
      return val === null ? null : val === '1';
    }
    return next();
  }
});

module.exports = { pool };

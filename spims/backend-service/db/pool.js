const { Pool } = require('pg');

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost')
        ? false
        : { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

const pool = new Pool(poolConfig);

pool.on('error', (error) => {
  console.error('[DB] Unexpected idle client error:', error.message);
});

const query = (text, params = []) => pool.query(text, params);

module.exports = {
  pool,
  query,
};
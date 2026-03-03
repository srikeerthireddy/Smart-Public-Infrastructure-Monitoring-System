const fs = require('fs/promises');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { pool } = require('./pool');
const { initDb } = require('./init');

async function runSeed() {
  const seedPath = path.join(__dirname, 'seed.sql');
  const seedSql = await fs.readFile(seedPath, 'utf-8');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(seedSql);

    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const operatorUsername = process.env.DEFAULT_OPERATOR_USERNAME || 'operator';
    const operatorPassword = process.env.DEFAULT_OPERATOR_PASSWORD || 'operator123';

    const [adminHash, operatorHash] = await Promise.all([
      bcrypt.hash(adminPassword, 10),
      bcrypt.hash(operatorPassword, 10),
    ]);

    await client.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, 'ADMIN')
       ON CONFLICT (username)
       DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
      [adminUsername, adminHash]
    );

    await client.query(
      `INSERT INTO users (username, password_hash, role)
       VALUES ($1, $2, 'OPERATOR')
       ON CONFLICT (username)
       DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
      [operatorUsername, operatorHash]
    );

    await client.query('COMMIT');
    console.log('[DB] Seed script completed');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function seedDb(options = {}) {
  if (!options.skipInit) {
    await initDb();
  }
  await runSeed();
}

if (require.main === module) {
  seedDb()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error('[DB] Seed failed:', error.message);
      await pool.end();
      process.exit(1);
    });
}

module.exports = {
  seedDb,
};
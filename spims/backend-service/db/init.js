const fs = require('fs/promises');
const path = require('path');
const { pool } = require('./pool');

async function initDb() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf-8');
  await pool.query(schemaSql);
  console.log('[DB] Schema initialized');
}

module.exports = {
  initDb,
};
import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
};

const pool = new Pool(poolConfig);

pool.on('error', (error) => {
  console.error('[DB] Unexpected idle client error:', error.message);
});

export const query = (text: string, params: any[] = []) => pool.query(text, params);

export { pool };

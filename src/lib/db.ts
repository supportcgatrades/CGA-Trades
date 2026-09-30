import { Pool } from 'pg';

/**
 * DATABASE CONFIGURATION
 * Provide your PostgreSQL connection string in .env as DATABASE_URL
 */
let pool: Pool | null = null;

export const getPool = (): Pool | null => {
  if (!pool && process.env.DATABASE_URL) {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });
      pool.on('error', (err) => {
        console.error('Unexpected error on idle pg client', err);
      });
    } catch (e) {
      console.warn('Failed to initialize PostgreSQL pool:', e);
      pool = null;
    }
  }
  return pool;
};

export const query = async (text: string, params?: any[]) => {
  const p = getPool();
  if (!p) {
    return { rowCount: 0, rows: [] as any[] };
  }
  return p.query(text, params);
};

export default { query, getPool };


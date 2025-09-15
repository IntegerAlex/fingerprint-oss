import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }
  pool = new Pool({ connectionString: databaseUrl, max: 10 });
  return pool;
}

export async function initDatabase(): Promise<void> {
  const p = getPool();
}

export async function checkDatabaseReady(): Promise<boolean> {
  try {
    const p = getPool();
    await p.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}



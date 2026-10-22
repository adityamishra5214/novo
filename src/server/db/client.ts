import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!poolInstance) {
    const connectionString = (process.env.DATABASE_URL || '').trim();
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required to connect to Supabase.');
    }

    poolInstance = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    poolInstance.on('error', (err) => {
      console.error('Unexpected error on idle Supabase client', err);
    });
  }
  return poolInstance;
}

export function convertPlaceholders(sql: string): string {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

export interface PreparedQuery {
  get: <T = any>(...params: any[]) => Promise<T | undefined>;
  all: <T = any>(...params: any[]) => Promise<T[]>;
  run: (...params: any[]) => Promise<{ rowCount: number }>;
}

export interface DatabaseClient {
  query: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
  queryOne: <T = any>(sql: string, params?: any[]) => Promise<T | undefined>;
  exec: (sql: string) => Promise<void>;
  prepare: (sql: string) => PreparedQuery;
}

export const db: DatabaseClient = {
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const pool = getPool();
    const pgSql = convertPlaceholders(sql);
    const result = await pool.query(pgSql, params);
    return result.rows as T[];
  },

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const rows = await this.query<T>(sql, params);
    return rows[0];
  },

  async exec(sql: string): Promise<void> {
    const pool = getPool();
    await pool.query(sql);
  },

  prepare(sql: string): PreparedQuery {
    const pgSql = convertPlaceholders(sql);
    const pool = getPool();

    return {
      get: async <T = any>(...params: any[]): Promise<T | undefined> => {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const result = await pool.query(pgSql, flatParams);
        return result.rows[0] as T | undefined;
      },
      all: async <T = any>(...params: any[]): Promise<T[]> => {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const result = await pool.query(pgSql, flatParams);
        return result.rows as T[];
      },
      run: async (...params: any[]): Promise<{ rowCount: number }> => {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const result = await pool.query(pgSql, flatParams);
        return { rowCount: result.rowCount || 0 };
      },
    };
  },
};

export function getDb(): DatabaseClient {
  return db;
}

export async function closeDb(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
}

export async function withTransaction<T>(fn: (txDb: DatabaseClient) => Promise<T>): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const txDb: DatabaseClient = {
      async query<R = any>(sql: string, params: any[] = []): Promise<R[]> {
        const pgSql = convertPlaceholders(sql);
        const result = await client.query(pgSql, params);
        return result.rows as R[];
      },
      async queryOne<R = any>(sql: string, params: any[] = []): Promise<R | undefined> {
        const rows = await this.query<R>(sql, params);
        return rows[0];
      },
      async exec(sql: string): Promise<void> {
        await client.query(sql);
      },
      prepare(sql: string): PreparedQuery {
        const pgSql = convertPlaceholders(sql);
        return {
          get: async <R = any>(...params: any[]): Promise<R | undefined> => {
            const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
            const result = await client.query(pgSql, flatParams);
            return result.rows[0] as R | undefined;
          },
          all: async <R = any>(...params: any[]): Promise<R[]> => {
            const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
            const result = await client.query(pgSql, flatParams);
            return result.rows as R[];
          },
          run: async (...params: any[]): Promise<{ rowCount: number }> => {
            const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
            const result = await client.query(pgSql, flatParams);
            return { rowCount: result.rowCount || 0 };
          },
        };
      },
    };
    const result = await fn(txDb);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/surf_school',
});

// Helper to convert SQLite `?` to PostgreSQL `$1, $2`
export function convertQuery(text: string) {
  let i = 1;
  return text.replace(/\?/g, () => `$${i++}`);
}

async function executeQuery(clientOrPool: Pool | PoolClient, text: string, params: any[] = []) {
  const pgText = convertQuery(text);
  let isInsert = text.trim().toUpperCase().startsWith('INSERT');
  let finalQuery = pgText;

  const noIdTables = ['SETTINGS', 'GROUP_PERMISSIONS', 'USER_GROUPS', 'LESSON_STAFF', 'LESSON_CLIENTS', 'RENTAL_ITEMS', 'DAILY_VISITS'];
  const upperQuery = pgText.toUpperCase();
  const hasNoIdTable = noIdTables.some(t => upperQuery.includes(`INTO ${t}`));

  if (isInsert && !upperQuery.includes('RETURNING') && !hasNoIdTable) {
      finalQuery += ' RETURNING id';
  }
  const result = await clientOrPool.query(finalQuery, params);
  return { 
      rows: result.rows, 
      lastInsertRowid: isInsert && result.rows.length ? result.rows[0].id : null,
      changes: result.rowCount 
  };
}

export const query = async (text: string, params: any[] = []) => {
  return executeQuery(pool, text, params);
};

export const getOne = async (text: string, params: any[] = []) => {
  const pgText = convertQuery(text);
  const result = await pool.query(pgText, params);
  return result.rows[0] || undefined;
};

export const getAll = async (text: string, params: any[] = []) => {
  const pgText = convertQuery(text);
  const result = await pool.query(pgText, params);
  return result.rows;
};

export interface TransactionClient {
  query: (text: string, params?: any[]) => Promise<any>;
  getOne: (text: string, params?: any[]) => Promise<any>;
  getAll: (text: string, params?: any[]) => Promise<any>;
}

export const db = {
  exec: async (text: string) => {
    await pool.query(text);
  },
  transaction: (callback: (client: TransactionClient) => Promise<any>) => {
    return async () => {
      const pgClient = await pool.connect();
      try {
        await pgClient.query('BEGIN');
        
        const txClient: TransactionClient = {
          query: (text: string, params: any[] = []) => executeQuery(pgClient, text, params),
          getOne: async (text: string, params: any[] = []) => {
            const pgText = convertQuery(text);
            const result = await pgClient.query(pgText, params);
            return result.rows[0] || undefined;
          },
          getAll: async (text: string, params: any[] = []) => {
            const pgText = convertQuery(text);
            const result = await pgClient.query(pgText, params);
            return result.rows;
          }
        };

        const result = await callback(txClient);
        await pgClient.query('COMMIT');
        return result;
      } catch (e) {
        await pgClient.query('ROLLBACK');
        throw e;
      } finally {
        pgClient.release();
      }
    };
  }
};

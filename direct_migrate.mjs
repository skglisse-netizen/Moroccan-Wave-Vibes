import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  
  const columns = ['suggestion_type', 'suggestion_name', 'suggestion_link', 'live_cam_url'];
  
  for (const col of columns) {
    try {
      await client.query(`ALTER TABLE spots ADD COLUMN ${col} TEXT`);
      console.log(`✓ Added column ${col}`);
    } catch (err) {
      if (err.code === '42701') {
        console.log(`! Column ${col} already exists`);
      } else {
        console.error(`Error adding ${col}:`, err);
      }
    }
  }
  
  await client.end();
}

migrate();

import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function checkColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'spots'");
  console.log(JSON.stringify(res.rows.map(r => r.column_name), null, 2));
  await client.end();
}

checkColumns();

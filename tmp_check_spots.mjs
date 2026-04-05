import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function checkSpots() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  const res = await client.query('SELECT * FROM spots');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

checkSpots();

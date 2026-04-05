import { initDb } from './database/init.ts';
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

// We need to polyfill/provide the db object if initDb uses it directly from another file
// but since we want to run the ACTUAL initDb that the server uses:
import { db } from './database/db.js';

async function runInit() {
  console.log("Running initDb...");
  await initDb();
  console.log("Done.");
  process.exit(0);
}

runInit().catch(err => {
  console.error(err);
  process.exit(1);
});

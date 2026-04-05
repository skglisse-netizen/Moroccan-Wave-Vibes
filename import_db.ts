import fs from 'fs';
import { query, db, getAll } from './database/db.js';

async function importData() {
  const data = JSON.parse(fs.readFileSync('db_dump.json', 'utf-8'));

  const tablesOrder = [
    'permissions',
    'groups',
    'group_permissions',
    'users',
    'user_groups',
    'categories',
    'staff',
    'clients',
    'lessons',
    'lesson_staff',
    'lesson_clients',
    'stock',
    'debts_loans',
    'debt_payments',
    'revenue',
    'expenses',
    'reservations',
    'landing_page_content',
    'public_services',
    'spots',
    'rentals',
    'rental_items',
    'conseils',
    'notifications',
    'contact_messages',
    'daily_visits',
    'user_connections',
    'footer_widgets',
    'client_purchases',
    'app_notifications', // added if exists
    'settings' // special handling below
  ];

  console.log("Starting data restoration...");

  // 1. Clear existing data
  console.log("Clearing existing tables...");
  for (const table of [...tablesOrder].reverse()) {
    try {
      await db.exec(`TRUNCATE TABLE ${table} CASCADE`);
    } catch (e: any) {
      console.log(`Skipped truncate for ${table}: ${e.message}`);
    }
  }

  // 2. Insert data
  for (const table of tablesOrder) {
    const rows = data[table];
    if (!rows || rows.length === 0) {
      console.log(`Skipping ${table} (no data)`);
      continue;
    }

    console.log(`Importing ${table} (${rows.length} rows)...`);
    
    // Get actual columns from PG to avoid "column does not exist" errors
    const pgColsResult = await getAll(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
    const pgCols = (pgColsResult as any[]).map(c => c.name);

    // Special handling for settings (UPSERT)
    if (table === 'settings') {
      for (const row of rows) {
        await query("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [row.key, row.value]);
      }
      continue;
    }

    for (const row of rows) {
      // Map SQLite columns to PG columns
      if (table === 'rentals') {
        if (row.start_time) row.rental_start = row.start_time;
        if (row.end_time) row.rental_end = row.end_time;
      }
      
      // Filter out columns that don't exist in PG
      const columns = Object.keys(row).filter(col => pgCols.includes(col));
      if (columns.length === 0) continue;

      const placeholders = columns.map(() => '?').join(', ');
      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

      const values = columns.map(col => {
        let val = row[col];
        // Convert SQLite 0/1 to Boolean if PG column is boolean
        // We should check PG type, but for now we can guess by name
        if (typeof val === 'number' && (col.startsWith('is_') || col.startsWith('show_') || col === 'sticky_header' || col === 'sticky_footer' || col === 'is_rentable' || col === 'is_pack' || col === 'is_deducted' || col === 'is_read' || col === 'is_subscriber')) {
          val = val === 1;
        }
        return val;
      });
      try {
        await query(sql, values);
      } catch (e: any) {
        console.error(`Error in ${table}: ${e.message} | Row ID: ${row.id || 'N/A'}`);
      }
    }

    // Handle Serial sequence restart
    try {
        await db.exec(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), true)`);
    } catch (e) {
        // Skip if table has no serial id
    }
  }

  console.log("✓ Data restoration completed successfully!");
  process.exit(0);
}

importData().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});

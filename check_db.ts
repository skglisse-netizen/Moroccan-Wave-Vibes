import { getAll } from './database/db.js';

async function run() {
    try {
        const tables = ['debts_loans', 'debt_payments', 'revenue', 'expenses'];
        for (const table of tables) {
            const info = await getAll(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [table]);
            console.log(`Table: ${table}`);
            console.log(info.map((c: any) => c.column_name).join(', '));
        }
        console.log("SUCCESS");
    } catch (e) {
        console.error("DB CHECK FAILED:", e);
    }
}
run();

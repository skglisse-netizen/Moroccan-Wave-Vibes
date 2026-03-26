const Database = require('better-sqlite3');
const db = new Database('surf_school.db');

try {
    console.log('Testing transaction...');
    db.transaction(() => {
        console.log('Inside transaction');
        const res = db.prepare('SELECT 1 as val').get();
        console.log('Result:', res);
    })();
    console.log('Transaction success');
} catch (e) {
    console.error('Transaction failed:', e);
}

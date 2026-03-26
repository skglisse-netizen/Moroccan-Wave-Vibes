import fs from 'fs';
let lines = fs.readFileSync('server.ts', 'utf-8').split('\n');

const toDelete = [
  ...Array.from({length: 38 - 18 + 1}, (_, i) => i + 17),
  ...Array.from({length: 505 - 46 + 1}, (_, i) => i + 45),
];

// For WebSocket stuff: lines 518-554
const wsDelete = Array.from({length: 554 - 517 + 1}, (_, i) => i + 516);

// For Auth: lines 575-620
const authDelete = Array.from({length: 620 - 575 + 1}, (_, i) => i + 574);

const allDeletes = new Set([...toDelete, ...wsDelete, ...authDelete]);

let newLines = lines.filter((_, i) => !allDeletes.has(i));

// Add imports near the top, e.g., after dotenv.config()
const importIndex = newLines.findIndex(l => l.includes('dotenv.config();')) + 1;
newLines.splice(importIndex, 0, 
  "import { db, query, getOne, getAll } from './database/db.js';",
  "import { initDb } from './database/init.js';",
  "import { logAction } from './utils/logger.js';",
  "import { clients, createNotification, broadcastNotification } from './utils/notifications.js';",
  "import { authenticate, checkPermission } from './middlewares/auth.js';"
);

fs.writeFileSync('server.ts', newLines.join('\n'));
console.log('Done modifying server.ts');

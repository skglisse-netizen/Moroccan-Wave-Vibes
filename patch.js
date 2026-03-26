import fs from 'fs';
const src = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = src.split('\n');
// Remove lines 85-170 (0-indexed: 84-169) which are the duplicate old imports
const cleaned = [...lines.slice(0, 84), ...lines.slice(170)];
fs.writeFileSync('src/App.tsx', cleaned.join('\n'));
console.log('Done. New line count:', cleaned.length);

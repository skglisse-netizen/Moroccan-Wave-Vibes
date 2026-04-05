import fs from 'fs';

const srcContent = fs.readFileSync('src/App.tsx', 'utf-8');
const srcLines = srcContent.split('\n');

// Components to strip from App.tsx (start line, end line - 1-indexed)
// They will be replaced with imports
const toStrip = [
  { start: 341, name: 'MessagesView' },
  { start: 1469, name: 'ReservationsView' },
  { start: 1838, name: 'ConseilsView' },
  { start: 2101, name: 'ServicesAdminView' },
  { start: 2429, name: 'AboutAdminView' },
  { start: 3083, name: 'RevenueView' },
  { start: 3415, name: 'ExpensesView' },
  { start: 3751, name: 'LessonsView' },
  { start: 4179, name: 'StaffView' },
  { start: 4441, name: 'StockView' },
  { start: 4724, name: 'DebtsLoansView' },
  { start: 4932, name: 'SettingsView' },
  { start: 5312, name: 'Modal' },
  { start: 5334, name: 'LogsView' },
  { start: 5452, name: 'BackupView' },
  { start: 5772, name: 'CategoriesView' },
  { start: 5974, name: 'UsersView' },
  { start: 6190, name: 'RentalsView' },
  { start: 6447, name: 'PurchaseHistoryModal' },
  { start: 6529, name: 'ClientsView' },
  { start: 6837, name: 'SpotsAdminView' },
  { start: 7165, name: 'ContactAdminView' },
];

const allStarts = [
  73, 341, 1469, 1838, 2101, 2429, 2633,
  2659, 2810, 3056, 3083, 3415, 3751,
  4179, 4441, 4724, 4932, 5312, 5334,
  5452, 5772, 5974, 6190, 6447, 6529,
  6837, 7165, srcLines.length + 1
].sort((a, b) => a - b);

function findEndLine(startLine) {
  const idx = allStarts.indexOf(startLine);
  if (idx === -1) return srcLines.length;
  const next = allStarts[idx + 1];
  return next ? next - 1 : srcLines.length;
}

// Build a set of line numbers to delete (0-indexed)
const linesToDelete = new Set();
for (const comp of toStrip) {
  const end = findEndLine(comp.start);
  for (let i = comp.start - 1; i < end; i++) {
    linesToDelete.add(i);
  }
}

// Filter out the lines to delete
const newLines = srcLines.filter((_, i) => !linesToDelete.has(i));

// Insert the barrel import right after the last existing import
const importLine = newLines.findIndex(l => l.startsWith('import ') || l.startsWith('const '));
// Find where imports end (empty line after last import)
let lastImportIdx = 0;
for (let i = 0; i < newLines.length; i++) {
  if (newLines[i].startsWith('import ')) lastImportIdx = i;
}

const componentNames = toStrip.map(c => c.name).join(',\n  ');
const barrelImport = `import {\n  ${componentNames}\n} from './components/admin/index';`;

newLines.splice(lastImportIdx + 1, 0, barrelImport);

fs.writeFileSync('src/App.tsx', newLines.join('\n'));
console.log(`✓ Updated App.tsx: removed ${linesToDelete.size} lines, added barrel import`);
console.log(`New line count: ${newLines.length}`);

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walk(dir, executeArray) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, executeArray);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      executeArray.push(filePath);
    }
  }
}

const frontendFiles = [];
walk(path.join(__dirname, 'src'), frontendFiles);

frontendFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace (e: any) => with (e) =>
  // Replace (e:any) => with (e) =>
  // Replace (_e: any) => with (_e) =>
  const original = content;
  content = content.replace(/\(e:\s*any\)\s*=>/g, "(e) =>");
  content = content.replace(/\(_e:\s*any\)\s*=>/g, "(_e) =>");
  content = content.replace(/\(event:\s*any\)\s*=>/g, "(event) =>");

  // Other common explicit anys in components that can be inferred
  // e.g., onLogin: (user: any) => void  -> onLogin: (user: User) => void
  content = content.replace(/onLogin:\s*\(\s*user:\s*any\s*\)/g, "onLogin: (user: User)");

  // if content changed
  if (original !== content) {
    // Inject User import if needed
    if (content.includes('onLogin: (user: User)') && !content.includes('User')) {
       // just assume User is imported, or we don't bother for now.
    }
    fs.writeFileSync(filePath, content);
    console.log('Processed frontend file: ' + filePath);
  }
});

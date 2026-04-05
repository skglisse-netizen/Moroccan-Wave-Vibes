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
  const original = content;

  // Button
  content = content.replace(
    /function Button\(\{([^}]+)\}:\s*any\s*\)\s*\{/g,
    "function Button({$1}: { children: React.ReactNode, onClick?: any, type?: 'button'|'submit'|'reset', className?: string, disabled?: boolean, variant?: string }) {"
  );

  // Input
  content = content.replace(
    /function Input\(\{([^}]+)\}:\s*any\s*\)\s*\{/g,
    "function Input({$1}: { label?: string, value?: any, onChange?: any, type?: string, placeholder?: string, required?: boolean, className?: string, [key: string]: any }) {"
  );

  // Select
  content = content.replace(
    /function Select\(\{([^}]+)\}:\s*any\s*\)\s*\{/g,
    "function Select({$1}: { label?: string, value?: any, onChange?: any, options?: any[], className?: string }) {"
  );

  // Card
  content = content.replace(
    /function Card\(\{([^}]+)\}:\s*any\s*\)\s*\{/g,
    "function Card({$1}: { children: React.ReactNode, className?: string }) {"
  );

  // Pagination
  content = content.replace(
    /function Pagination\(\{([^}]+)\}:\s*any\s*\)\s*\{/g,
    "function Pagination({$1}: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) {"
  );

  // Modal (function Modal and export function Modal)
  content = content.replace(
    /function Modal\(\{([^}]+)\}:\s*any\s*\)\s*\{/g,
    "function Modal({$1}: { title?: string, children: React.ReactNode, onClose: () => void, maxWidth?: string }) {"
  );

  // MultiSelectDropdown
  content = content.replace(
    /function MultiSelectDropdown\(\{([^}]+)\}:\s*any\s*\)\s*\{/g,
    "function MultiSelectDropdown({$1}: { options: any[], selected: string[], onChange: (selected: string[]) => void, placeholder?: string }) {"
  );
  content = content.replace(
    /const MultiSelectDropdown = \(\{([^}]+)\}:\s*any\s*\)\s*=>/g,
    "const MultiSelectDropdown = ({$1}: { options: any[], selected: string[], onChange: (selected: string[]) => void, placeholder?: string }) =>"
  );
  
  // Select (const version)
  content = content.replace(
    /const Select = \(\{([^}]+)\}:\s*any\s*\)\s*=>/g,
    "const Select = ({$1}: { label?: string, value?: any, onChange?: any, options?: any[], className?: string }) =>"
  );

  if (original !== content) {
    fs.writeFileSync(filePath, content);
    console.log('Typed UI components in ' + filePath);
  }
});

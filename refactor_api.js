import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = path.join(__dirname, 'routes', 'api');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Add { Response } to express import if not there
  if (content.includes("import express from 'express';")) {
    content = content.replace(/import express from 'express';/, "import express, { Response } from 'express';");
  } else if (!content.includes('Response')) {
    content = content.replace(/import express, {([^}]+)} from 'express';/, "import express, { $1, Response } from 'express';");
  }

  // Add AuthRequest to auth import
  if (!content.includes('AuthRequest') && content.includes('middlewares/auth.js')) {
    content = content.replace(/import {([^}]+)} from '\.\.\/\.\.\/middlewares\/auth\.js';/, (match, p1) => {
      return `import {${p1}, AuthRequest } from '../../middlewares/auth.js';`;
    });
  }

  // Replace req: any, res: any
  content = content.replace(/\(req: any, res: any\)/g, "(req: AuthRequest, res: Response)");
  content = content.replace(/\(req: any, res\)/g, "(req: AuthRequest, res: Response)");
  content = content.replace(/\(_req: any, res: any\)/g, "(_req: AuthRequest, res: Response)");
  content = content.replace(/\(_req: any, res\)/g, "(_req: AuthRequest, res: Response)");

  fs.writeFileSync(filePath, content);
  console.log('Processed routes/api/' + file);
});

// Server.ts
const serverPath = path.join(__dirname, 'server.ts');
if (fs.existsSync(serverPath)) {
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  if (!serverContent.includes('AuthRequest') && serverContent.includes('middlewares/auth.js')) {
    serverContent = serverContent.replace(/import {([^}]+)} from '\.\/middlewares\/auth\.js';/, "import {$1, AuthRequest } from './middlewares/auth.js';");
  }
  if (!serverContent.includes('Response')) {
    serverContent = serverContent.replace(/import express from 'express';/, "import express, { Response } from 'express';");
  }
  serverContent = serverContent.replace(/\(req: any, res: any\)/g, "(req: AuthRequest, res: Response)");
  serverContent = serverContent.replace(/\(req: any, res\)/g, "(req: AuthRequest, res: Response)");
  fs.writeFileSync(serverPath, serverContent);
  console.log('Processed server.ts');
}

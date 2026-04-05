import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viewsDir = path.join(__dirname, 'src/components/admin');

// 1. Update SettingsView
const settingsPath = path.join(viewsDir, 'SettingsView.tsx');
let settingsContent = fs.readFileSync(settingsPath, 'utf8');
settingsContent = settingsContent.replace(
  /\{ \['about', 'services', 'reserve', 'spots', 'conseils', 'contact'\]\.map\(sectionKey => \{/,
  "{ ['reserve'].map(sectionKey => {"
);
fs.writeFileSync(settingsPath, settingsContent);

// 2. Inject UI logic into the Views
const injectionViews = [
  { file: 'AboutAdminView.tsx', key: 'about', title: '' },
  { file: 'ServicesAdminView.tsx', key: 'services', title: 'Services' },
  { file: 'ConseilsView.tsx', key: 'conseils', title: 'Conseils' },
  { file: 'SpotsAdminView.tsx', key: 'spots', title: 'Spots' },
  { file: 'ContactAdminView.tsx', key: 'contact', title: 'Contact' },
];

injectionViews.forEach(view => {
  const filePath = path.join(viewsDir, view.file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix signature if it's lacking content and onUpdateContent
  if (!content.includes('onUpdateContent: (section: string')) {
    content = content.replace(
      /export function ([A-Za-z]+)\(\{([^}]+)\}:\s*\{([^}]+)\}\)\s*\{/,
      "export function $1({$2, content, onUpdateContent}: {$3, content?: any, onUpdateContent?: any}) {"
    );
  }

  // Inject sectionData definition
  if (!content.includes('const sectionData =')) {
    content = content.replace(
      /export function [A-Za-z]+\([^)]+\)\s*\{(\s*const)/,
      `export function ${view.file.replace('.tsx', '')}(arguments) {__REPLACE_LATER__$1`
    );
    // Use regex properly by matching the signature top
    content = content.replace(/\{(\s*const)/, `{\n  const sectionData = (content || []).find((c: any) => c.section === '${view.key}') || { section: '${view.key}', button_label: '${view.title}', is_active: true };$1`);
  }

  // Inject UI
  const injectedHtml = `
      <div className="flex items-center gap-6 mb-8 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
        <div className="flex-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Nom de la section (Menu)</label>
          <input 
            type="text"
            defaultValue={sectionData.button_label} 
            onBlur={(e) => {
              const newLabel = e.target.value;
              if (newLabel !== sectionData.button_label && onUpdateContent) {
                onUpdateContent('${view.key}', { ...sectionData, button_label: newLabel });
              }
            }}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold"
          />
        </div>
        <div className="flex flex-col items-center justify-center">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Visibilité Publique</label>
          <button
            type="button"
            onClick={() => onUpdateContent && onUpdateContent('${view.key}', { ...sectionData, is_active: !sectionData.is_active })}
            className={\`w-12 h-6 rounded-full relative transition-colors \${sectionData.is_active ? 'bg-emerald-500' : 'bg-slate-200'}\`}
          >
            <div className={\`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm \${sectionData.is_active ? 'translate-x-7' : 'translate-x-1'}\`} />
          </button>
        </div>
      </div>
  `;

  // Look for the first `<div className="space-y-` inside the top-level <Card> and inject
  if (!content.includes('Nom de la section (Menu)')) {
    content = content.replace(
      /(<div className="flex justify-between items-center mb-6">[\s\S]*?<\/div>\s*)<div className="space-y-/m,
      `$1${injectedHtml}\n      <div className="space-y-`
    );
    fs.writeFileSync(filePath, content);
    console.log(`Injected settings into ${view.file}`);
  }
});

import fs from 'fs';

const srcContent = fs.readFileSync('src/App.tsx', 'utf-8');
const srcLines = srcContent.split('\n');
const totalLines = srcLines.length;

// All top-level function start lines (1-indexed) with component names 
const components = [
  { name: 'MessagesView', start: 341, file: 'MessagesView' },
  { name: 'ReservationsView', start: 1469, file: 'ReservationsView' },
  { name: 'ConseilsView', start: 1838, file: 'ConseilsView' },
  { name: 'ServicesAdminView', start: 2101, file: 'ServicesAdminView' },
  { name: 'AboutAdminView', start: 2429, file: 'AboutAdminView' },
  { name: 'RevenueView', start: 3083, file: 'RevenueView' },
  { name: 'ExpensesView', start: 3415, file: 'ExpensesView' },
  { name: 'LessonsView', start: 3751, file: 'LessonsView' },
  { name: 'StaffView', start: 4179, file: 'StaffView' },
  { name: 'StockView', start: 4441, file: 'StockView' },
  { name: 'DebtsLoansView', start: 4724, file: 'DebtsLoansView' },
  { name: 'SettingsView', start: 4932, file: 'SettingsView' },
  { name: 'Modal', start: 5312, file: 'Modal' },
  { name: 'LogsView', start: 5334, file: 'LogsView' },
  { name: 'BackupView', start: 5452, file: 'BackupView' },
  { name: 'CategoriesView', start: 5772, file: 'CategoriesView' },
  { name: 'UsersView', start: 5974, file: 'UsersView' },
  { name: 'RentalsView', start: 6190, file: 'RentalsView' },
  { name: 'PurchaseHistoryModal', start: 6447, file: 'PurchaseHistoryModal' },
  { name: 'ClientsView', start: 6529, file: 'ClientsView' },
  { name: 'SpotsAdminView', start: 6837, file: 'SpotsAdminView' },
  { name: 'ContactAdminView', start: 7165, file: 'ContactAdminView' },
];

// Sorted boundary list to detect end line for each component
const allStarts = [
  73, 341, 1469, 1838, 2101, 2429, 2633,
  2659, 2810, 3056, 3083, 3415, 3751,
  4179, 4441, 4724, 4932, 5312, 5334,
  5452, 5772, 5974, 6190, 6447, 6529,
  6837, 7165, totalLines + 1
].sort((a, b) => a - b);

function findEndLine(startLine) {
  const idx = allStarts.indexOf(startLine);
  if (idx === -1) return totalLines;
  const next = allStarts[idx + 1];
  return next ? next - 1 : totalLines;
}

// Extract the original shared imports from App.tsx (first ~72 lines becomes the header for all components)
const sharedImportsBlock = srcLines.slice(0, 72).join('\n');

const prefix = `import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, ChevronDown, ChevronRight, Calendar, TrendingUp, DollarSign, Settings,
  LogOut, Package, BarChart3, FileText, ShoppingBag, Wallet, BookOpen, Waves,
  Plus, Edit2, Trash2, Check, X, RefreshCcw, Download, Upload, ImageIcon,
  Bell, Menu, MessageSquare, MapPin, UserCheck, CreditCard, AlertTriangle, Shield, Eye, EyeOff,
  Activity, LayoutGrid, List, Grid, Star, Award, Clock, Info, Lock, Anchor, Ship
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import L from 'leaflet';
import {
  Settings as AppSettings, User, Revenue, Expense, Lesson, Staff, Category,
  Log, Stock, DebtLoan, Rental, Client, Conseil, Spot, PublicService, Reservation,
  LandingPageContent, ContactMessage, DashboardStats
} from '../../types';

const ITEMS_PER_PAGE = 10;

function hasPermission(user: User, codename: string): boolean {
  if (!user) return false;
  if (user.role === 'administrateur') return true;
  return user.permissions?.includes(codename) ?? false;
}

// UI Components
function Button({ children, onClick, type = 'button', className = '', disabled = false, variant = 'default' }: any) {
  const base = 'px-4 py-2 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants: any = {
    default: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={\`\${base} \${variants[variant] || variants.default} \${className} \${disabled ? 'opacity-50 cursor-not-allowed' : ''}\`}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder = '', required = false, className = '', ...rest }: any) {
  return (
    <div className="space-y-1">
      {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className={\`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm \${className}\`}
        {...rest}
      />
    </div>
  );
}

function Select({ label, value, onChange, options, className = '' }: any) {
  return (
    <div className="space-y-1">
      {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>}
      <select value={value} onChange={onChange} className={\`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm \${className}\`}>
        {options?.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Card({ children, className = '' }: any) {
  return <div className={\`bg-white rounded-2xl shadow-sm border border-slate-100 \${className}\`}>{children}</div>;
}

function Pagination({ currentPage, totalPages, onPageChange }: any) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
        className="px-3 py-1 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-all">
        ‹
      </button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button key={i + 1} onClick={() => onPageChange(i + 1)}
          className={\`w-8 h-8 rounded-lg text-sm font-bold transition-all \${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}\`}>
          {i + 1}
        </button>
      ))}
      <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
        className="px-3 py-1 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-all">
        ›
      </button>
    </div>
  );
}

function Modal({ title, children, onClose, maxWidth = "max-w-lg" }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={\`w-full \${maxWidth} bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col\`}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-all">
            <Plus size={24} className="rotate-45" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto scrollbar-premium">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
`;

// Create output directory
if (!fs.existsSync('src/components/admin')) {
  fs.mkdirSync('src/components/admin', { recursive: true });
}

// Write each component to its own file
for (const comp of components) {
  const endLine = findEndLine(comp.start);
  const lines = srcLines.slice(comp.start - 1, endLine);
  let code = lines.join('\n');
  
  const fileContent = `${prefix}\n\nexport ${code}\n`;
  const filename = `src/components/admin/${comp.file}.tsx`;
  fs.writeFileSync(filename, fileContent);
  console.log(`✓ Wrote ${filename} (lines ${comp.start}-${endLine})`);
}

// Generate index.ts barrel file
const indexContent = components.map(c => `export { ${c.name} } from './${c.file}';`).join('\n') + '\n';
fs.writeFileSync('src/components/admin/index.ts', indexContent);
console.log('\n✓ Created src/components/admin/index.ts');
console.log('\nDone! Now update App.tsx to import from components/admin/');

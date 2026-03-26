import fs from 'fs';

// View boundaries (start line, function name) - 0-indexed
// We'll detect end by finding the next top-level function after this one
const srcContent = fs.readFileSync('src/App.tsx', 'utf-8');
const srcLines = srcContent.split('\n');
const totalLines = srcLines.length;

// Map of component name -> start line (1-indexed)
const components = [
  { name: 'MessagesView', start: 341 },
  { name: 'ReservationsView', start: 1469 },
  { name: 'ConseilsView', start: 1838 },
  { name: 'ServicesAdminView', start: 2101 },
  { name: 'AboutAdminView', start: 2429 },
  { name: 'LogsView', start: 5334 },
  { name: 'BackupView', start: 5452 },
  { name: 'CategoriesView', start: 5772 },
  { name: 'UsersView', start: 5974 },
  { name: 'RentalsView', start: 6190 },
  { name: 'ClientsView', start: 6529 },
  { name: 'SpotsAdminView', start: 6837 },
  { name: 'ContactAdminView', start: 7165 },
  { name: 'RevenueView', start: 3083 },
  { name: 'ExpensesView', start: 3415 },
  { name: 'LessonsView', start: 3751 },
  { name: 'StaffView', start: 4179 },
  { name: 'StockView', start: 4441 },
  { name: 'DebtsLoansView', start: 4724 },
  { name: 'SettingsView', start: 4932 },
  { name: 'Modal', start: 5312 },
];

// Find end line for each component (next top-level function start - 1)
const allStarts = components.map(c => c.start).sort((a,b) => a-b);
// Also add: DashboardView=2810, StatCard=3056 which we may keep in App.tsx
const nextStarts = [
  341, 1469, 1838, 2101, 2429, 2633,
  2659, 2810, 3056, 3083, 3415, 3751,
  4179, 4441, 4724, 4932, 5312, 5334,
  5452, 5772, 5974, 6190, 6447, 6529,
  6837, 7165, totalLines + 1
].sort((a, b) => a - b);

function findEndLine(startLine) {
  const idx = nextStarts.indexOf(startLine);
  if (idx === -1) return totalLines;
  return nextStarts[idx + 1] ? nextStarts[idx + 1] - 1 : totalLines;
}

// Top of App.tsx imports up to line 72 (before first function)
const sharedImports = srcLines.slice(0, 72).join('\n');

// Get the leading imports from the file (types, icons, etc)
const standardImports = `import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, ChevronDown, ChevronRight, Calendar, TrendingUp, DollarSign, Settings,
  LogOut, Package, BarChart3, FileText, ShoppingBag, Wallet, BookOpen, Waves,
  Plus, Edit2, Trash2, Check, X, RefreshCcw, Download, Upload, ImageIcon,
  Bell, Menu, MessageSquare, MapPin, UserCheck, CreditCard, AlertTriangle, Shield, Eye, EyeOff,
  Activity, LayoutGrid, List, Grid, Star, Award, Clock, Info, Lock, Anchor, Sailboat, Ship
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import L from 'leaflet';
import { Settings as AppSettings, User, Revenue, Expense, Lesson, Staff, Category, Log, Stock, DebtLoan, Rental, Client, Conseil, Spot, PublicService, Reservation, LandingPageContent, ContactMessage, DashboardStats } from '../types';
`;

// Common UI components used by all views
const uiComponentImports = `import { hasPermission } from '../utils/permissions';
import { Button, Input, Select, Card, Badge, Pagination, ITEMS_PER_PAGE } from './ui';
`;

for (const comp of components) {
  const endLine = findEndLine(comp.start);
  const lines = srcLines.slice(comp.start - 1, endLine);
  let code = lines.join('\n');
  const filename = `src/components/admin/${comp.name}.tsx`;
  console.log(`  Extracted ${comp.name}: lines ${comp.start}-${endLine} -> ${filename}`);
}

console.log('Analysis complete. Lines identified for extraction.');
console.log('Total lines in App.tsx:', totalLines);

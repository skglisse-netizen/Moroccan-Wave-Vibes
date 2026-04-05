import fs from 'fs';

const src = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = src.split('\n');

// Identify where the import block ends and clean it
// Build the new clean imports
const newImports = `import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  LogOut,
  Plus,
  Waves,
  ChevronRight,
  DollarSign,
  UserCheck,
  CheckCircle2,
  RotateCcw,
  Shield,
  ClipboardList,
  Tags,
  ChevronDown,
  Check,
  X,
  Settings,
  Download,
  ArrowRightLeft,
  FileText,
  Search,
  ChevronLeft,
  Anchor,
  Package,
  RefreshCcw,
  Menu,
  Bell,
  Image as ImageIcon,
  Database,
  MapPin,
  Mail,
  MailOpen,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  User, DashboardStats, Settings as AppSettings, AppNotification,
  LandingPageContent, PublicService, Spot, Conseil, ContactMessage
} from './types';
import { GroupsManagement } from './GroupsManagement';
import LandingPage from './LandingPage';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MessagesView,
  ReservationsView,
  ConseilsView,
  ServicesAdminView,
  AboutAdminView,
  RevenueView,
  ExpensesView,
  LessonsView,
  StaffView,
  StockView,
  DebtsLoansView,
  SettingsView,
  Modal,
  LogsView,
  BackupView,
  CategoriesView,
  UsersView,
  RentalsView,
  PurchaseHistoryModal,
  ClientsView,
  SpotsAdminView,
  ContactAdminView
} from './components/admin/index';`;

// Find end of import block
let importEnd = 0;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i].trim();
  if (l.startsWith('import ') || (importEnd > 0 && l === '')) {
    importEnd = i;
  } else if (importEnd > 0 && !l.startsWith('import ') && l !== '') {
    // Non-import non-empty line after imports started -> we're done
    break;
  }
}

// Find the FIRST real import line
let importStart = lines.findIndex(l => l.trim().startsWith('import '));

// Replace the import block with our new one
const after = lines.slice(importEnd + 1);
const newLines = newImports.split('\n').concat([''], after);

fs.writeFileSync('src/App.tsx', newLines.join('\n'));
console.log(`Done. New line count: ${newLines.length}`);

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, ChevronDown, ChevronRight, Calendar, TrendingUp, DollarSign, Settings,
  LogOut, Package, BarChart3, FileText, ShoppingBag, Wallet, BookOpen, Waves,
  Plus, Edit2, Trash2, Check, X, RefreshCcw, Download, Upload, ImageIcon,
  Bell, Menu, MessageSquare, MapPin, UserCheck, CreditCard, AlertTriangle, Shield, Eye, EyeOff,
  Activity, LayoutGrid, List, Grid, Star, Award, Clock, Info, Lock, Anchor, Ship, TrendingDown, Database
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

import { Button, Input, Select, Card, Pagination, Modal } from './UIComponents';


export function BackupView({ onUpdate }: { onUpdate: () => void }) {
  const [importing, setImporting] = useState(false);

  const handleExport = async (type: string) => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(type === 'full' ? '/api/backup/full' : `/api/export/${type}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = type === 'full' ? 'json' : 'csv';
        const prefix = type === 'full' ? 'backup_full' : `export_${type}`;
        a.download = `${prefix}_${format(new Date(), 'yyyy-MM-dd')}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) { console.error(e); }
  };

  const handleFullRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("ATTENTION: Cette action va ÉCRASER TOUTES les données actuelles de l'application par celles du fichier de sauvegarde. Voulez-vous continuer ?")) {
      e.target.value = '';
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
        credentials: 'include'
      });

      if (res.ok) {
        alert('Restauration complète réussie. L\'application va se recharger.');
        window.location.reload();
      } else {
        const err = await res.json();
        alert(`Erreur lors de la restauration: ${err.error || 'Inconnue'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau lors de la restauration');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`Voulez-vous vraiment importer ces données pour ${type} ? Cela pourrait créer des doublons.`)) {
      e.target.value = '';
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/import/${type}`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
        credentials: 'include'
      });

      if (res.ok) {
        alert('Importation réussie');
        onUpdate();
      } else {
        const err = await res.json();
        alert(`Erreur lors de l'importation: ${err.error || 'Inconnue'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau lors de l\'importation');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Section */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Revenus</h3>
              <p className="text-xs text-slate-500">Gérer les données de revenus</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleExport('revenue')}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all shadow-sm"
            >
              <Download size={18} /> Exporter les revenus (CSV)
            </button>

            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleImport(e, 'revenue')}
                className="hidden"
                id="import-revenue"
                disabled={importing}
              />
              <label
                htmlFor="import-revenue"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-600 font-bold hover:bg-emerald-50 transition-all cursor-pointer ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload size={18} /> {importing ? 'Importation...' : 'Importer des revenus (CSV)'}
              </label>
            </div>
          </div>
        </Card>

        {/* Expenses Section */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-600">
              <TrendingDown size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Dépenses</h3>
              <p className="text-xs text-slate-500">Gérer les données de dépenses</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleExport('expenses')}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all shadow-sm"
            >
              <Download size={18} /> Exporter les dépenses (CSV)
            </button>

            <div className="relative">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleImport(e, 'expenses')}
                className="hidden"
                id="import-expenses"
                disabled={importing}
              />
              <label
                htmlFor="import-expenses"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-rose-200 text-rose-600 font-bold hover:bg-rose-50 transition-all cursor-pointer ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload size={18} /> {importing ? 'Importation...' : 'Importer des dépenses (CSV)'}
              </label>
            </div>
          </div>
        </Card>

        {/* Reservations Section */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Réservations</h3>
              <p className="text-xs text-slate-500">Gérer les réservations clients</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => handleExport('reservations')} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-sm">
              <Download size={18} /> Exporter (CSV)
            </button>
            <div className="relative">
              <input type="file" accept=".csv" onChange={(e) => handleImport(e, 'reservations')} className="hidden" id="import-reservations" disabled={importing} />
              <label htmlFor="import-reservations" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 font-bold hover:bg-blue-50 transition-all cursor-pointer">
                <Upload size={18} /> Importer (CSV)
              </label>
            </div>
          </div>
        </Card>

        {/* Clients Section */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Clients</h3>
              <p className="text-xs text-slate-500">Gérer la base de données clients</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => handleExport('clients')} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-sm">
              <Download size={18} /> Exporter (CSV)
            </button>
            <div className="relative">
              <input type="file" accept=".csv" onChange={(e) => handleImport(e, 'clients')} className="hidden" id="import-clients" disabled={importing} />
              <label htmlFor="import-clients" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-50 transition-all cursor-pointer">
                <Upload size={18} /> Importer (CSV)
              </label>
            </div>
          </div>
        </Card>

        {/* Stock Section */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
              <Package size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Stock</h3>
              <p className="text-xs text-slate-500">Gérer l'inventaire du matériel</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button onClick={() => handleExport('stock')} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700 transition-all shadow-sm">
              <Download size={18} /> Exporter (CSV)
            </button>
            <div className="relative">
              <input type="file" accept=".csv" onChange={(e) => handleImport(e, 'stock')} className="hidden" id="import-stock" disabled={importing} />
              <label htmlFor="import-stock" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-amber-200 text-amber-600 font-bold hover:bg-amber-50 transition-all cursor-pointer">
                <Upload size={18} /> Importer (CSV)
              </label>
            </div>
          </div>
        </Card>

        {/* Full Backup Section */}
        <Card className="p-6 space-y-6 bg-slate-900 text-white md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-800 text-indigo-400">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Sauvegarde Complète</h3>
              <p className="text-xs text-slate-400">Exporter ou restaurer l'intégralité de la base de données (JSON)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleExport('full')}
              className="flex items-center justify-center gap-2 py-4 rounded-xl bg-white text-slate-900 font-black hover:bg-slate-100 transition-all shadow-lg"
            >
              <Download size={20} /> Télécharger la sauvegarde complète
            </button>

            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFullRestore}
                className="hidden"
                id="restore-full"
                disabled={importing}
              />
              <label
                htmlFor="restore-full"
                className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/50 text-slate-300 font-black hover:bg-slate-800 transition-all cursor-pointer ${importing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <RefreshCcw size={20} className={importing ? 'animate-spin' : ''} /> {importing ? 'Restauration...' : 'Restaurer une sauvegarde complète'}
              </label>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest text-center font-bold">
            Note: La restauration écrasera toutes les données actuelles.
          </p>
        </Card>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex gap-4">
          <div className="p-2 bg-amber-100 text-amber-700 rounded-lg h-fit">
            <Shield size={20} />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 mb-1">Attention lors de l'importation</h4>
            <p className="text-sm text-amber-800 leading-relaxed">
              L'importation de données ajoute les nouvelles entrées à votre base de données existante.
              Assurez-vous que le fichier CSV respecte le format d'exportation standard pour éviter toute erreur.
              Il est recommandé de faire une exportation de sécurité avant d'importer de nouvelles données.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, ChevronDown, ChevronRight, Calendar, TrendingUp, DollarSign, Settings,
  LogOut, Package, BarChart3, FileText, ShoppingBag, Wallet, BookOpen, Waves,
  Plus, Edit2, Trash2, Check, X, RefreshCcw, Download, Upload, ImageIcon,
  Bell, Menu, MessageSquare, MapPin, UserCheck, CreditCard, AlertTriangle, Shield, Eye, EyeOff,
  Activity, LayoutGrid, List, Grid, Star, Award, Clock, Info, Lock, Anchor, Ship, RotateCcw
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import L from 'leaflet';
import {
  Settings as AppSettings, User, Revenue, Expense, Lesson, Staff, Category,
  Log, Stock, DebtLoan, Rental, Conseil, Spot, PublicService, Reservation,
  LandingPageContent, ContactMessage, DashboardStats
} from '../../types';

const ITEMS_PER_PAGE = 10;

function hasPermission(user: User, codename: string): boolean {
  if (!user) return false;
  if (user.role === 'administrateur') return true;
  return user.permissions?.includes(codename) ?? false;
}

import { Button, Input, Select, Card, Pagination, Modal } from './UIComponents';
import { ClientPurchase, Client } from '../../types';


export function PurchaseHistoryModal({ client, onClose, onUpdate }: { client: Client, onClose: () => void, onUpdate: () => void }) {
  const [purchases, setPurchases] = useState<ClientPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('auth_token');
      try {
        const res = await fetch(`/api/clients/${client.id}/purchases`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setPurchases(data);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchHistory();
  }, [client.id]);

  const handleDeletePurchase = async (purchaseId: number) => {
    if (!confirm('Annuler cet achat ? Les séances ajoutées seront retirées.')) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/clients/${client.id}/purchases/${purchaseId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (res.ok) {
        // Refresh local history
        const updated = purchases.filter(p => p.id !== purchaseId);
        setPurchases(updated);
        // Trigger global update
        if (onUpdate) onUpdate();
      } else {
        const err = await res.json();
        alert(`Erreur: ${err.error || 'Impossible d\'annuler'}`);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <Modal title={`Historique d'achats - ${client.full_name}`} onClose={onClose} maxWidth="max-w-2xl">
      {loading ? (
        <div className="py-12 flex justify-center"><RotateCcw className="animate-spin text-indigo-600" /></div>
      ) : purchases.length === 0 ? (
        <div className="py-12 text-center text-slate-400 italic">Aucun achat enregistré</div>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-premium">
          {purchases.map(p => (
            <div key={p.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex justify-between items-center hover:bg-white transition-all hover:shadow-sm">
              <div>
                <p className="text-sm font-bold text-slate-900">{p.service_name}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {p.date ? format(new Date(p.date), 'dd MMMM yyyy', { locale: fr }) : ''}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-black text-indigo-600">{p.price} DH</p>
                  {p.sessions_added > 0 && (
                    <p className="text-[10px] font-bold text-emerald-600">+{p.sessions_added} séances</p>
                  )}
                </div>
                <button 
                  onClick={() => handleDeletePurchase(p.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  title="Annuler l'achat"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}


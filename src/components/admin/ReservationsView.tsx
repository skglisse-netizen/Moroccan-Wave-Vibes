import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, ChevronDown, ChevronRight, Calendar, TrendingUp, DollarSign, Settings,
  LogOut, Package, BarChart3, FileText, ShoppingBag, Wallet, BookOpen, Waves,
  Plus, Edit2, Trash2, Check, X, RefreshCcw, Download, Upload, ImageIcon,
  Bell, Menu, MessageSquare, MapPin, UserCheck, CreditCard, AlertTriangle, Shield, Eye, EyeOff,
  Activity, LayoutGrid, List, Grid, Star, Award, Clock, Info, Lock, Anchor, Ship, CheckCircle2
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


export function ReservationsView({ reservations, services, onUpdate, settings, onUpdateSettings, user, content, onUpdateContent }: { 
  reservations: Reservation[], 
  services: PublicService[], 
  onUpdate: () => void, 
  settings: AppSettings, 
  onUpdateSettings: () => void, 
  user: User,
  content?: LandingPageContent[],
  onUpdateContent?: (section: string, data: any) => Promise<void>
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Reservation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState({
    reserve_title: settings?.reserve_title || '',
    reserve_subtitle: settings?.reserve_subtitle || '',
    reserve_layout: settings?.reserve_layout || 'split',
    reserve_bg_image: settings?.reserve_bg_image || '',
  });

  useEffect(() => {
    setConfigForm({
      reserve_title: settings?.reserve_title || '',
      reserve_subtitle: settings?.reserve_subtitle || '',
      reserve_layout: settings?.reserve_layout || 'split',
      reserve_bg_image: settings?.reserve_bg_image || '',
    });
  }, [settings]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service_id: '',
    date: '',
    time: '',
    guests: 1
  });

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission(user, 'change_settings')) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...settings, ...configForm }),
        credentials: 'include'
      });
      if (res.ok) {
        onUpdateSettings();
        setShowConfig(false);
      }
    } catch (e) { console.error(e); }
  };


  const filteredReservations = (reservations || []).filter(r => {
    const matchesSearch = (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.phone || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || r.date === dateFilter;
    const matchesService = !serviceFilter || r.service_id.toString() === serviceFilter;
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesDate && matchesService && matchesStatus;
  });

  const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);
  const paginatedData = filteredReservations.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleStatus = async (id: number, status: string) => {
    if (!hasPermission(user, 'change_reservations')) return;
    const token = localStorage.getItem('auth_token');
    await fetch(`/api/admin/reservations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ status }),
      credentials: 'include'
    });
    onUpdate();
  };

  const handleEdit = (r: Reservation) => {
    setEditingItem(r);
    setFormData({
      name: r.name,
      email: r.email,
      phone: r.phone || '',
      service_id: r.service_id.toString(),
      date: r.date,
      time: r.time,
      guests: r.guests
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!hasPermission(user, 'change_reservations')) {
      alert("Vous n'avez pas la permission de modifier cette réservation.");
      return;
    }
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/admin/reservations/${editingItem.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...formData,
          service_id: parseInt(formData.service_id),
          guests: formData.guests
        }),
        credentials: 'include'
      });
      if (res.ok) {
        setShowEditModal(false);
        onUpdate();
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!hasPermission(user, 'delete_reservations')) {
      alert("Vous n'avez pas la permission de supprimer cette réservation.");
      return;
    }
    if (!confirm('Supprimer cette réservation ?')) return;
    const token = localStorage.getItem('auth_token');
    await fetch(`/api/admin/reservations/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    onUpdate();
  };

  const sectionData = (content || []).find(c => c.section === 'reserve') || { section: 'reserve', button_label: 'Réserver', is_active: true };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Gestion des Réservations</h3>
        <div className="flex items-center gap-3">
          {hasPermission(user, 'change_settings') && (
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-bold ${showConfig ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              <Settings size={16} /> Configuration Page Publique
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-6 border-2 border-indigo-100 bg-indigo-50/30">
              <form onSubmit={handleConfigSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Input
                      label="Titre principal"
                      value={configForm.reserve_title}
                      onChange={(e) => setConfigForm({ ...configForm, reserve_title: e.target.value })}
                    />
                    <Input
                      label="Sous-titre"
                      value={configForm.reserve_subtitle}
                      onChange={(e) => setConfigForm({ ...configForm, reserve_subtitle: e.target.value })}
                    />
                    <Select
                      label="Layout du formulaire"
                      value={configForm.reserve_layout}
                      onChange={(e) => setConfigForm({ ...configForm, reserve_layout: e.target.value })}
                      options={[
                        { value: 'centered', label: 'Centré Simple' },
                        { value: 'split', label: 'Séparé (Image / Formulaire)' }
                      ]}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-indigo-100/50">
                      <div className="flex-1 w-full">
                        <Input 
                          label="Nom du bouton (Menu)" 
                          defaultValue={sectionData.button_label} 
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            const newVal = e.target.value;
                            if (newVal !== sectionData.button_label && onUpdateContent) {
                              onUpdateContent('reservations', { ...sectionData, button_label: newVal });
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Visibilité Publique</label>
                        <button
                          type="button"
                          onClick={() => onUpdateContent && onUpdateContent('reservations', { ...sectionData, is_active: !sectionData.is_active })}
                          className={`w-12 h-6 rounded-full relative transition-colors ${sectionData.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${sectionData.is_active ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 md:pt-0 md:pl-6 border-t md:border-t-0 md:border-l border-indigo-100/50">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Arrière-plan de la Page</label>
                    <div className="flex flex-col gap-4">
                      {configForm.reserve_bg_image ? (
                        <div className="relative group aspect-video">
                          <img src={configForm.reserve_bg_image} alt="Fond Réservations" className="w-full h-full object-cover rounded-xl border border-slate-200" />
                          <button
                            type="button"
                            onClick={() => setConfigForm({ ...configForm, reserve_bg_image: '' })}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-rose-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-50 flex flex-col items-center justify-center rounded-xl border border-slate-200 text-slate-400 gap-2">
                          <ImageIcon size={32} />
                          <span className="text-xs font-bold uppercase tracking-widest opacity-50">Aucune image</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setConfigForm(prev => ({ ...prev, reserve_bg_image: reader.result as string }));
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white file:text-indigo-700 hover:file:bg-indigo-50 transition-all cursor-pointer border border-slate-100 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-indigo-100">
                  <Button type="submit" className="shadow-md">
                    <Check size={16} /> Enregistrer la configuration
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto max-h-[80vh] scrollbar-premium">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex flex-col gap-1.5">
                    <span>Date/Heure</span>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal lowercase"
                    />
                  </div>
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex flex-col gap-1.5">
                    <span>Client</span>
                    <input
                      type="text"
                      placeholder="Filtrer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal"
                    />
                  </div>
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex flex-col gap-1.5">
                    <span>Service</span>
                    <select
                      value={serviceFilter}
                      onChange={(e) => setServiceFilter(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal"
                    >
                      <option value="">Tous</option>
                      {services.map(s => {
                        const finalPrice = s.discount_percentage > 0
                          ? Math.round(s.price * (1 - s.discount_percentage / 100))
                          : s.price;
                        return (
                          <option key={s.id} value={s.id}>
                            {s.name} - {finalPrice} DH {s.discount_percentage > 0 ? `(Promo -${s.discount_percentage}%)` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Pers.
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex flex-col gap-1.5">
                    <span>Statut</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal"
                    >
                      <option value="">Tous</option>
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmé</option>
                      <option value="cancelled">Annulé</option>
                    </select>
                  </div>
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      {(dateFilter || searchTerm || serviceFilter || statusFilter) && (
                        <button
                          onClick={() => { setDateFilter(''); setSearchTerm(''); setServiceFilter(''); setStatusFilter(''); }}
                          className="flex items-center gap-1 text-[10px] text-rose-600 hover:text-white hover:bg-rose-500 font-bold uppercase px-2 py-1 border border-rose-200 rounded-md transition-all shadow-sm"
                        >
                          <RefreshCcw size={10} />
                          Réinitialiser
                        </button>
                      )}
                      <span>Actions</span>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData?.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-4 py-2">
                    <p className="text-[11px] font-bold text-slate-900">
                      {r.date && !isNaN(new Date(r.date).getTime())
                        ? format(new Date(r.date), 'dd/MM/yyyy')
                        : 'Date invalide'}
                    </p>
                    <p className="text-[10px] text-slate-500">{r.time}</p>
                  </td>
                  <td className="px-4 py-2">
                    <p className="text-[11px] font-bold text-slate-900">{r.name}</p>
                    <p className="text-[10px] text-slate-500">{r.phone} | {r.email}</p>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-[11px] font-medium text-slate-600">{r.service_name}</span>
                  </td>
                  <td className="px-4 py-2 text-[11px] font-bold text-slate-900">{r.guests}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${r.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' :
                      r.status === 'cancelled' ? 'bg-rose-100 text-rose-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                      {r.status === 'confirmed' ? 'Confirmé' : r.status === 'cancelled' ? 'Annulé' : 'En attente'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission(user, 'change_reservations') && (
                        <>
                          {r.status === 'pending' && (
                            <button onClick={() => handleStatus(r.id, 'confirmed')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Confirmer">
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                          {r.status !== 'cancelled' && (
                            <button onClick={() => handleStatus(r.id, 'cancelled')} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg" title="Annuler">
                              <X size={14} />
                            </button>
                          )}
                          <button onClick={() => handleEdit(r)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Modifier">
                            <Edit2 size={14} />
                          </button>
                        </>
                      )}
                      {hasPermission(user, 'delete_reservations') && (
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!paginatedData || paginatedData.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium text-[11px]">Aucune réservation trouvée</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {showEditModal && (
        <Modal title="Modifier la réservation" onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nom" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            <Input label="Téléphone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              <Input label="Heure" type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} required />
            </div>
            <Select
              label="Service"
              value={formData.service_id}
              onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
              options={services.map(s => ({ value: s.id.toString(), label: s.name }))}
            />
            <Input label="Nombre de personnes" type="number" value={formData.guests.toString()} onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) || 1 })} required />
            <Button type="submit" className="w-full">Enregistrer les modifications</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}


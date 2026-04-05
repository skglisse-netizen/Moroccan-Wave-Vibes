import React, { useState, useEffect, useRef, useCallback } from 'react';
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

import { Button, Input, Select, Card, Pagination, Modal } from './UIComponents';


export function StaffView({ staff, categories, onUpdate, user }: { staff: Staff[], categories: Category[], onUpdate: () => void, user: User }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    birth_date: '',
    cin: '',
    type: 'moniteur',
    status: 'journalier' as 'journalier' | 'salarie',
    matricule: ''
  });

  const filteredStaff = staff.filter(s => {
    const matchesSearch = (s.full_name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (s.cin || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (s.matricule || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesType = !typeFilter || s.type === typeFilter;
    const matchesStatus = !statusFilter || s.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStaff.length / ITEMS_PER_PAGE);
  const paginatedData = filteredStaff.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  (window as any).showModal = (show: boolean) => {
    if (show) {
      setEditingItem(null);
      setFormData({
        full_name: '',
        birth_date: '',
        cin: '',
        type: 'moniteur',
        status: 'journalier',
        matricule: ''
      });
    }
    setShowModal(show);
  };

  const handleEdit = (item: Staff) => {
    setEditingItem(item);
    setFormData({
      full_name: item.full_name,
      birth_date: item.birth_date,
      cin: item.cin,
      type: item.type,
      status: item.status,
      matricule: item.matricule || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem ? `/api/staff/${editingItem.id}` : '/api/staff';
    const method = editingItem ? 'PUT' : 'POST';
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (res.ok) {
        setShowModal(false);
        onUpdate();
        setEditingItem(null);
      } else {
        const err = await res.json();
        alert(`Erreur: ${err.error || 'Impossible d\'enregistrer le personnel'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Une erreur réseau est survenue');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer ce membre du personnel ?')) {
      const token = localStorage.getItem('auth_token');
      try {
        const res = await fetch(`/api/staff/${id}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          onUpdate();
        } else {
          const err = await res.json();
          alert(`Erreur: ${err.error || 'Impossible de supprimer'}`);
        }
      } catch (e) {
        alert('Erreur réseau lors de la suppression');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {hasPermission(user, 'add_staff') && (
          <button
            onClick={() => (window as any).showModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm font-bold"
          >
            <Plus size={16} /> Nouveau membre
          </button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto max-h-[80vh] scrollbar-premium">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex flex-col gap-1.5">
                    <span>Nom Complet</span>
                    <input
                      type="text"
                      placeholder="Filtrer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal"
                    />
                  </div>
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Matricule</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">CIN</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex flex-col gap-1.5">
                    <span>Type</span>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal"
                    >
                      <option value="">Tous</option>
                      <option value="moniteur">Moniteur</option>
                      <option value="aide_moniteur">Aide Moniteur</option>
                      <option value="administratif">Administratif</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
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
                      <option value="salarie">Salarié</option>
                      <option value="journalier">Journalier</option>
                    </select>
                  </div>
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      {(searchTerm || typeFilter || statusFilter) && (
                        <button
                          onClick={() => { setSearchTerm(''); setTypeFilter(''); setStatusFilter(''); }}
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
              {paginatedData?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-4 py-2">
                    <p className="text-[11px] font-semibold text-slate-900">{item.full_name}</p>
                    <p className="text-[10px] text-slate-500">
                      {item.birth_date && !isNaN(new Date(item.birth_date).getTime())
                        ? `Né(e) le ${format(new Date(item.birth_date), 'dd/MM/yyyy')}`
                        : 'Date de naissance non renseignée'}
                    </p>
                  </td>
                  <td className="px-4 py-2 text-[11px] font-mono text-slate-600">{item.matricule || '-'}</td>
                  <td className="px-4 py-2 text-[11px] text-slate-600">{item.cin}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-indigo-50 text-indigo-600 uppercase">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${item.status === 'salarie' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
                      }`}>
                      {item.status === 'salarie' ? 'Salarié' : 'Journalier'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission(user, 'change_staff') && (
                        <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <Edit2 size={14} />
                        </button>
                      )}
                      {hasPermission(user, 'delete_staff') && (
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {showModal && (
        <Modal title={editingItem ? "Modifier le personnel" : "Ajouter du personnel"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nom Complet" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="CIN" value={formData.cin} onChange={(e) => setFormData({ ...formData, cin: e.target.value })} required />
              <Input 
                label="Matricule" 
                value={editingItem ? formData.matricule : "Auto-généré (ST0000)"} 
                readOnly 
                className="bg-slate-100 opacity-75 cursor-not-allowed font-mono text-xs" 
              />
            </div>
            <Input label="Date de Naissance" type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={categories.filter(c => c.type === 'staff').map(c => ({ value: c.name.toLowerCase().replace(/ /g, '_'), label: c.name }))}
              />
              <Select
                label="Statut"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'journalier', label: 'Journalier' },
                  { value: 'salarie', label: 'Salarié' }
                ]}
              />
            </div>
            <Button type="submit" className="w-full">Enregistrer</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}


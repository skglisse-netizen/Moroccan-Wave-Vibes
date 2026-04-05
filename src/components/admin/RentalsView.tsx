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


export function RentalsView({ rentals, stock, onUpdate, user }: { rentals: Rental[], stock: Stock[], onUpdate: () => void, user: User }) {
  const [showModal, setShowModal] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    equipment_id: '',
    quantity: '1',
    total_price: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const safeRentals = Array.isArray(rentals) ? rentals : [];
  const filteredRentals = safeRentals.filter(r => {
    const matchesSearch = (r.customer_name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (r.equipment_name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRentals.length / ITEMS_PER_PAGE) || 1;
  const paginatedData = filteredRentals.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const rentableStock = stock.filter(s => !!s.is_rentable);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!editingRental;
    const requiredPermission = isEditing ? 'change_rentals' : 'add_rentals';
    
    if (!hasPermission(user, requiredPermission)) {
      alert(`Vous n'avez pas la permission de ${isEditing ? 'modifier' : 'créer'} une location.`);
      return;
    }
    const token = localStorage.getItem('auth_token');
    const url = editingRental ? `/api/admin/rentals/${editingRental.id}` : '/api/admin/rentals';
    const method = editingRental ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...formData,
          equipment_id: parseInt(formData.equipment_id),
          quantity: parseInt(formData.quantity),
          total_price: parseFloat(formData.total_price),
          date: formData.date || format(new Date(), 'yyyy-MM-dd'),
          start_time: editingRental ? editingRental.start_time : new Date().toISOString()
        }),
        credentials: 'include'
      });
      if (res.ok) {
        setShowModal(false);
        setEditingRental(null);
        onUpdate();
        setFormData({ customer_name: '', customer_phone: '', equipment_id: '', quantity: '1', total_price: '', date: format(new Date(), 'yyyy-MM-dd') });
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de la location');
      }
    } catch (e) { console.error(e); }
  };

  const handleReturn = async (id: number) => {
    if (!hasPermission(user, 'change_rentals')) {
      alert("Vous n'avez pas la permission d'effectuer cette action.");
      return;
    }
    if (!confirm('Marquer ce matériel comme retourné ?')) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/admin/rentals/${id}/return`, {
        method: 'PATCH',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (e) { console.error(e); }
  };



  const handleDelete = async (id: number) => {
    if (!hasPermission(user, 'delete_rentals')) {
      alert("Vous n'avez pas la permission de supprimer cette location.");
      return;
    }
    if (!confirm('Supprimer cette location ? (Le stock sera restauré si la location est active)')) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/admin/rentals/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (e) { console.error(e); }
  };

  const handleEdit = (rental: Rental) => {
    setEditingRental(rental);
    setFormData({
      customer_name: rental.customer_name,
      customer_phone: rental.customer_phone,
      equipment_id: rental.equipment_id.toString(),
      quantity: rental.quantity.toString(),
      total_price: rental.total_price.toString(),
      date: rental.date || format(new Date(), 'yyyy-MM-dd')
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {hasPermission(user, 'add_rentals') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm font-bold"
          >
            <Plus size={16} /> Nouvelle Location
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
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Matériel</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Début</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Fin</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Prix</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex flex-col gap-1.5">
                    <span>Statut</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal"
                    >
                      <option value="">Tous</option>
                      <option value="active">En cours</option>
                      <option value="returned">Retourné</option>
                    </select>
                  </div>
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      {(searchTerm || statusFilter) && (
                        <button
                          onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
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
              {paginatedData.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-4 py-2">
                    <p className="text-[11px] font-bold text-slate-900">{r.customer_name}</p>
                    <p className="text-[10px] text-slate-500">{r.customer_phone}</p>
                  </td>
                  <td className="px-4 py-2 text-[11px] text-slate-600">
                    {r.date ? format(new Date(r.date), 'dd/MM/yyyy') : '-'}
                  </td>
                  <td className="px-4 py-2">
                    <p className="text-[11px] font-medium text-slate-700">{r.equipment_name} (x{r.quantity})</p>
                  </td>
                  <td className="px-4 py-2 text-[11px] text-slate-600">
                    {r.start_time && !isNaN(new Date(r.start_time).getTime()) ? format(new Date(r.start_time), 'dd/MM/yyyy HH:mm') : '-'}
                  </td>
                  <td className="px-4 py-2 text-[11px] text-slate-600">
                    {r.end_time && !isNaN(new Date(r.end_time).getTime()) ? format(new Date(r.end_time), 'dd/MM/yyyy HH:mm') : '-'}
                  </td>
                  <td className="px-4 py-2 text-[11px] font-bold text-slate-900">{r.total_price} DH</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                      r.status === 'active' ? 'bg-indigo-100 text-indigo-600' : 
                      'bg-emerald-100 text-emerald-600'
                    }`}>
                      {r.status === 'active' ? 'En cours' : 'Retourné'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission(user, 'change_rentals') && r.status === 'active' && (
                        <button
                          onClick={() => handleReturn(r.id)}
                          className="text-[10px] font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 px-2 py-1 rounded-lg transition-all uppercase"
                        >
                          Retour
                        </button>
                      )}
                      {hasPermission(user, 'change_rentals') && (
                        <button
                          onClick={() => handleEdit(r)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Modifier"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}

                      {hasPermission(user, 'delete_rentals') && (
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Supprimer"
                        >
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
        <Modal title={editingRental ? "Modifier Location" : "Nouvelle Location"} onClose={() => { setShowModal(false); setEditingRental(null); }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nom du client" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} required />
            <Input label="Téléphone" value={formData.customer_phone} onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} required />
            <Select
              label="Matériel"
              value={formData.equipment_id}
              onChange={(e) => {
                const item = rentableStock.find(s => s.id === parseInt(e.target.value));
                setFormData({
                  ...formData,
                  equipment_id: e.target.value,
                  total_price: item ? (item.rental_price || 0).toString() : ''
                });
              }}
              options={[
                { value: '', label: 'Sélectionner un matériel' },
                ...rentableStock.map(s => ({ value: s.id.toString(), label: `${s.name} (${s.quantity} dispo) - ${s.rental_price} DH` }))
              ]}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Quantité" type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
              <Input label="Date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            </div>
            <Input label="Prix Total (DH)" type="number" value={formData.total_price} onChange={(e) => setFormData({ ...formData, total_price: e.target.value })} required />
            <Button type="submit" className="w-full">Enregistrer la location</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}


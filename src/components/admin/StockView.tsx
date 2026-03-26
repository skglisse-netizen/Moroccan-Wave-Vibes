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


export function StockView({ stock, categories, onUpdate, user }: { stock: Stock[], categories: Category[], onUpdate: () => void, user: User }) {
  const [showModal, setShowModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Stock | null>(null);
  const [selectedItem, setSelectedItem] = useState<Stock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({ name: '', quantity: '', price_unit: '', category: '', is_rentable: false, rental_price: '' });
  const [sellData, setSellData] = useState({ quantity: '1', price_sale: '', date: format(new Date(), 'yyyy-MM-dd') });

  const filteredStock = stock.filter(s => {
    const matchesSearch = (s.name || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesCategory = !categoryFilter || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredStock.length / ITEMS_PER_PAGE);
  const paginatedData = filteredStock.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem ? `/api/stock/${editingItem.id}` : '/api/stock';
    const method = editingItem ? 'PUT' : 'POST';
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity) || 0,
          price_unit: parseFloat(formData.price_unit) || 0,
          rental_price: parseFloat(formData.rental_price) || 0
        }),
        credentials: 'include'
      });
      if (res.ok) {
        setShowModal(false);
        onUpdate();
        setEditingItem(null);
      }
    } catch (e) { console.error(e); }
  };

  const handleSell = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/stock/${selectedItem.id}/sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          quantity: parseInt(sellData.quantity),
          price_sale: parseFloat(sellData.price_sale),
          date: sellData.date
        }),
        credentials: 'include'
      });
      if (res.ok) {
        setShowSellModal(false);
        onUpdate();
        setSelectedItem(null);
        setSellData({ quantity: '1', price_sale: '', date: format(new Date(), 'yyyy-MM-dd') });
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de la vente');
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce matériel ?')) return;
    const token = localStorage.getItem('auth_token');
    await fetch(`/api/stock/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto max-h-[80vh] scrollbar-premium">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex flex-col gap-1.5">
                    <span>Nom</span>
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
                    <span>Catégorie</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal"
                    >
                      <option value="">Toutes</option>
                      {categories.filter(c => c.type === 'expense').map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quantité</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Prix Unitaire</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Prix Location</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      {(searchTerm || categoryFilter) && (
                        <button
                          onClick={() => { setSearchTerm(''); setCategoryFilter(''); }}
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
                  <td className="px-4 py-2 text-[11px] font-semibold text-slate-900">{item.name}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-wider border border-slate-200 w-fit">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${item.quantity > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {item.quantity} en stock
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[11px] text-slate-600 font-medium">{item.price_unit.toLocaleString()} DH</td>
                  <td className="px-4 py-2">
                    {item.is_rentable ? (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-bold uppercase">
                        {item.rental_price} DH
                      </span>
                    ) : (
                      <span className="text-slate-300 text-[10px]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission(user, 'change_stock') && (
                        <>
                          <button
                            onClick={() => { setSelectedItem(item); setSellData({ ...sellData, price_sale: (item.price_unit * 1.2).toString() }); setShowSellModal(true); }}
                            className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-bold hover:bg-indigo-100 transition-all uppercase"
                          >
                            <DollarSign size={10} /> Vendre
                          </button>
                          <button onClick={() => { setEditingItem(item); setFormData({ name: item.name, quantity: item.quantity.toString(), price_unit: item.price_unit.toString(), category: item.category, is_rentable: !!item.is_rentable, rental_price: (item.rental_price || '').toString() }); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                            <Edit2 size={14} />
                          </button>
                        </>
                      )}
                      {hasPermission(user, 'delete_stock') && (
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
        <Modal title={editingItem ? "Modifier le matériel" : "Nouveau matériel"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nom du matériel" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Quantité" type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} required />
              <Input label="Prix Unitaire (Achat)" type="number" step="0.01" value={formData.price_unit} onChange={(e) => setFormData({ ...formData, price_unit: e.target.value })} required />
            </div>
            <Select
              label="Catégorie"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={categories.filter(c => c.type === 'expense').map(c => ({ value: c.name, label: c.name }))}
            />
            <div className="p-4 bg-slate-50 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Disponible à la location</span>
                <input
                  type="checkbox"
                  checked={formData.is_rentable}
                  onChange={(e) => setFormData({ ...formData, is_rentable: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              {formData.is_rentable && (
                <Input
                  label="Prix de location (par session)"
                  type="number"
                  step="0.01"
                  value={formData.rental_price}
                  onChange={(e) => setFormData({ ...formData, rental_price: e.target.value })}
                  required
                />
              )}
            </div>
            <Button type="submit" className="w-full">{editingItem ? 'Enregistrer les modifications' : 'Ajouter au stock'}</Button>
          </form>
        </Modal>
      )}

      {showSellModal && selectedItem && (
        <Modal title={`Vendre: ${selectedItem.name}`} onClose={() => setShowSellModal(false)}>
          <form onSubmit={handleSell} className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl mb-4">
              <p className="text-sm text-slate-500">Stock disponible: <span className="font-bold text-slate-900">{selectedItem.quantity}</span></p>
              <p className="text-sm text-slate-500">Prix d'achat: <span className="font-bold text-slate-900">{selectedItem.price_unit}</span></p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Quantité à vendre" type="number" min="1" max={selectedItem.quantity} value={sellData.quantity} onChange={(e) => setSellData({ ...sellData, quantity: e.target.value })} required />
              <Input label="Prix de vente (Unitaire)" type="number" step="0.01" value={sellData.price_sale} onChange={(e) => setSellData({ ...sellData, price_sale: e.target.value })} required />
            </div>
            <Input label="Date de vente" type="date" value={sellData.date} onChange={(e) => setSellData({ ...sellData, date: e.target.value })} required />
            <div className="p-4 bg-emerald-50 rounded-xl">
              <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Total Revenu</p>
              <p className="text-xl font-bold text-emerald-700">{(parseInt(sellData.quantity) * parseFloat(sellData.price_sale || '0')).toLocaleString()}</p>
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Confirmer la vente</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}


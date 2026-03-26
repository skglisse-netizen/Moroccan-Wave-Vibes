import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, ChevronDown, ChevronRight, Calendar, TrendingUp, DollarSign, Settings,
  LogOut, Package, BarChart3, FileText, ShoppingBag, Wallet, BookOpen, Waves,
  Plus, Edit2, Trash2, Check, X, RefreshCcw, Download, Upload, ImageIcon,
  Bell, Menu, MessageSquare, MapPin, UserCheck, CreditCard, AlertTriangle, Shield, Eye, EyeOff,
  Activity, LayoutGrid, List, Grid, Star, Award, Clock, Info, Lock, Anchor, Ship, TrendingDown
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


export function CategoriesView({ categories, onUpdate, user }: { categories: Category[], onUpdate: () => void, user: User }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'expense', parent_id: null as number | null });

  (window as any).showModal = (show: boolean) => {
    if (show) {
      setEditingItem(null);
      setFormData({ name: '', type: 'expense', parent_id: null });
    }
    setShowModal(show);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem ? `/api/categories/${editingItem.id}` : '/api/categories';
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
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette catégorie ?')) return;
    const token = localStorage.getItem('auth_token');
    await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    onUpdate();
  };

  const groupedCategories = {
    revenue: categories.filter(c => c.type === 'revenue' && !c.parent_id),
    expense: categories.filter(c => c.type === 'expense' && !c.parent_id),
    staff: categories.filter(c => c.type === 'staff' && !c.parent_id)
  };

  const getSubCategories = (parentId: number) => categories.filter(c => c.parent_id === parentId);

  const [currentPages, setCurrentPages] = useState({ revenue: 1, expense: 1, staff: 1 });

  const getPaginatedData = (type: keyof typeof groupedCategories) => {
    const items = groupedCategories[type];
    const page = currentPages[type];
    return items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {Object.entries(groupedCategories).map(([type, items]) => {
        const typeColor = type === 'revenue' ? 'emerald' : type === 'expense' ? 'rose' : 'indigo';
        const typeLabel = type === 'revenue' ? 'Revenus' : type === 'expense' ? 'Dépenses' : 'Personnel';
        return (
          <Card key={type} className="overflow-hidden">
            <div className={`px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-${typeColor}-50/30`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-${typeColor}-500 text-white`}>
                  {type === 'revenue' ? <TrendingUp size={18} /> : type === 'expense' ? <TrendingDown size={18} /> : <Users size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{typeLabel}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{items.length} type(s)</p>
                </div>
              </div>
              {hasPermission(user, 'add_categories') && (
                <button
                  onClick={() => { setEditingItem(null); setFormData({ name: '', type: type as any, parent_id: null }); setShowModal(true); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-dashed border-${typeColor}-200 text-${typeColor}-500 hover:bg-${typeColor}-50 transition-all text-xs font-bold`}
                >
                  <Plus size={14} /> Ajouter
                </button>
              )}
            </div>

            <div className="overflow-auto max-h-[60vh] scrollbar-premium">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {getPaginatedData(type as any).length > 0 ? getPaginatedData(type as any).map((cat) => (
                    <React.Fragment key={cat.id}>
                      <tr className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-6 py-3 text-sm font-semibold text-slate-800">{cat.name}</td>
                        <td className="px-6 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            {hasPermission(user, 'change_categories') && (
                              <button
                                onClick={() => { setEditingItem(cat); setFormData({ name: cat.name, type: cat.type, parent_id: cat.parent_id || null }); setShowModal(true); }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              >
                                <Edit2 size={14} />
                              </button>
                            )}
                            {hasPermission(user, 'delete_categories') && (
                              <button
                                onClick={() => handleDelete(cat.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {getSubCategories(cat.id).map(sub => (
                        <tr key={sub.id} className="hover:bg-slate-50/50 transition-all group bg-slate-50/20">
                          <td className="px-10 py-2 text-xs font-medium text-slate-500 flex items-center gap-2">
                            <ChevronRight size={12} /> {sub.name}
                          </td>
                          <td className="px-6 py-2 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              {hasPermission(user, 'change_categories') && (
                                <button
                                  onClick={() => { setEditingItem(sub); setFormData({ name: sub.name, type: sub.type, parent_id: sub.parent_id || null }); setShowModal(true); }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                >
                                  <Edit2 size={12} />
                                </button>
                              )}
                              {hasPermission(user, 'delete_categories') && (
                                <button
                                  onClick={() => handleDelete(sub.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-slate-400 text-sm italic">Aucun type défini</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPages[type as keyof typeof currentPages]}
              totalPages={Math.ceil(items.length / ITEMS_PER_PAGE)}
              onPageChange={(page) => setCurrentPages({ ...currentPages, [type]: page })}
            />
          </Card>
        );
      })}

      {showModal && (
        <Modal title={editingItem ? "Modifier catégorie" : "Nouvelle catégorie"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nom" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Select
              label="Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value, parent_id: null })}
              options={[
                { value: 'expense', label: 'Dépense' },
                { value: 'revenue', label: 'Revenu' },
                { value: 'staff', label: 'Personnel' }
              ]}
            />
            <Select
              label="Catégorie Parente (Optionnel)"
              value={formData.parent_id || ''}
              onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? parseInt(e.target.value) : null })}
              options={[
                { value: '', label: 'Aucune (Catégorie principale)' },
                ...categories
                  .filter(c => c.type === formData.type && !c.parent_id && c.id !== editingItem?.id)
                  .map(c => ({ value: c.id, label: c.name }))
              ]}
            />
            <Button type="submit" className="w-full">Enregistrer</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}


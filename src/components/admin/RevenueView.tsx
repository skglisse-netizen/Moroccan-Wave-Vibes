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

// UI Components
function Button({ children, onClick, type = 'button', className = '', disabled = false, variant = 'default' }: { children: React.ReactNode, onClick?: any, type?: 'button'|'submit'|'reset', className?: string, disabled?: boolean, variant?: string }) {
  const base = 'px-4 py-2 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants: any = {
    default: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${variants[variant] || variants.default} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder = '', required = false, className = '', ...rest }: { label?: string, value?: any, onChange?: any, type?: string, placeholder?: string, required?: boolean, className?: string, [key: string]: any }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm ${className}`}
        {...rest}
      />
    </div>
  );
}

function Select({ label, value, onChange, options, className = '', required = false }: { label?: string, value?: any, onChange?: any, options?: any[], className?: string, required?: boolean }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>}
      <select value={value} onChange={onChange} required={required} className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm ${className}`}>
        {options?.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`}>{children}</div>;
}

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
        className="px-3 py-1 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-all">
        ‹
      </button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button key={i + 1} onClick={() => onPageChange(i + 1)}
          className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
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

function Modal({ title, children, onClose, maxWidth = "max-w-lg" }: { title?: string, children: React.ReactNode, onClose: () => void, maxWidth?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full ${maxWidth} bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col`}
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


export function RevenueView({ revenue, categories, onUpdate, user }: { revenue: Revenue[], categories: Category[], onUpdate: () => void, user: User }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Revenue | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    sub_category: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [lessonDetails, setLessonDetails] = useState<any>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [categoryFilter, setCategoryFilter] = useState('');


  const filteredRevenue = revenue.filter(r => {
    const matchesSearch = (r.description || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesDate = !dateFilter || r.date === dateFilter;
    const matchesCategory = !categoryFilter || r.type === categoryFilter;
    return matchesSearch && matchesDate && matchesCategory;
  });

  const totalPages = Math.ceil(filteredRevenue.length / ITEMS_PER_PAGE);
  const paginatedData = filteredRevenue.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const fetchLessonDetails = async (lessonId: number) => {
    const token = localStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
      const res = await fetch('/api/lessons', { credentials: 'include', headers });
      if (res.ok) {
        const lessons: Lesson[] = await res.json();
        const lesson = lessons.find(l => l.id === lessonId);
        if (lesson) {
          setLessonDetails(lesson);
          setShowLessonModal(true);
        }
      }
    } catch (e) { console.error(e); }
  };

  (window as any).showModal = (show: boolean) => {
    if (show) {
      setEditingItem(null);
      setFormData({ description: '', amount: '', category: categories.find(c => c.type === 'revenue')?.name || '', sub_category: '', date: format(new Date(), 'yyyy-MM-dd') });
    }
    setShowModal(show);
  };

  const handleEdit = (item: Revenue) => {
    setEditingItem(item);
    setFormData({
      description: item.description,
      amount: item.amount.toString(),
      category: item.category,
      sub_category: item.sub_category || '',
      date: item.date
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem ? `/api/revenue/${editingItem.id}` : '/api/revenue';
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
          amount: parseFloat(formData.amount) || 0
        }),
        credentials: 'include'
      });

      if (res.ok) {
        setShowModal(false);
        onUpdate();
        setEditingItem(null);
        setFormData({ description: '', amount: '', category: '', sub_category: '', date: format(new Date(), 'yyyy-MM-dd') });
      } else {
        const err = await res.json();
        alert(`Erreur: ${err.error || 'Impossible d\'enregistrer le revenu'}`);
      }
    } catch (err) {
      console.error('Error saving revenue:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce revenu ?')) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/revenue/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error deleting revenue:', err);
    }
  };

  const handleCancelRental = async (rentalId: number) => {
    if (!hasPermission(user, 'change_rentals')) {
      alert("Vous n'avez pas la permission d'effectuer cette action.");
      return;
    }
    if (!confirm('Annuler cette location ? (Le stock sera restauré et le revenu supprimé)')) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/admin/rentals/${rentalId}/cancel`, {
        method: 'PATCH',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (res.ok) {
        onUpdate();
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de l\'annulation');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {hasPermission(user, 'add_revenue') && (
          <button
            onClick={() => (window as any).showModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm font-bold"
          >
            <Plus size={16} /> Nouveau revenu
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
                    <span>Date</span>
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
                    <span>Description</span>
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
                    <span>Type</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal"
                    >
                      <option value="">Toutes</option>
                      {categories.filter(c => c.type === 'revenue' && !c.parent_id).map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      {(dateFilter || searchTerm || categoryFilter) && (
                        <button
                          onClick={() => { setDateFilter(''); setSearchTerm(''); setCategoryFilter(''); }}
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
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-4 py-2 text-[11px] text-slate-600 font-medium">
                    {item.date && !isNaN(new Date(item.date).getTime())
                      ? format(new Date(item.date), 'dd/MM/yyyy')
                      : 'Date invalide'}
                  </td>
                  <td className="px-4 py-2">
                    <p className="text-[11px] font-bold text-slate-900">{item.description}</p>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col gap-1">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-wider border border-emerald-100 w-fit">
                        {item.category}
                      </span>
                      {item.sub_category && (
                        <span className="text-[9px] text-slate-400 font-bold ml-1 uppercase">{item.sub_category}</span>
                      )}
                      {item.type === 'rental' && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-bold uppercase w-fit">Location</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-[11px] font-black text-slate-900">
                    {item.amount.toLocaleString()} DH
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      {item.lesson_id && (
                        <button
                          onClick={() => fetchLessonDetails(item.lesson_id!)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="Détails du cours"
                        >
                          <Calendar size={14} />
                        </button>
                      )}
                      {hasPermission(user, 'change_revenue') && (
                        <button onClick={() => handleEdit(item)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <Edit2 size={14} />
                        </button>
                      )}
                      {item.rental_id && hasPermission(user, 'change_rentals') && (
                        <button
                          onClick={() => handleCancelRental(item.rental_id!)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Annuler la location"
                        >
                          <X size={14} />
                        </button>
                      )}
                      {hasPermission(user, 'delete_revenue') && (
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
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
        <Modal title={editingItem ? "Modifier revenu" : "Nouveau revenu"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
            <Input label="Montant" type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
            <Input label="Date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            <Select
              label="Catégorie"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value, sub_category: '' })}
              options={categories.filter(c => c.type === 'revenue' && !c.parent_id).map(c => ({ value: c.name, label: c.name }))}
              required
            />
            {formData.category && categories.some(c => c.parent_id === categories.find(cat => cat.name === formData.category)?.id) && (
              <Select
                label="Sous-catégorie"
                value={formData.sub_category}
                onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                options={categories
                  .filter(c => c.parent_id === categories.find(cat => cat.name === formData.category)?.id)
                  .map(c => ({ value: c.name, label: c.name }))}
              />
            )}
            <Button type="submit" className="w-full">Enregistrer</Button>
          </form>
        </Modal>
      )}

      {showLessonModal && lessonDetails && (
        <Modal title="Informations du Cours" onClose={() => setShowLessonModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Titre</p>
                <p className="text-sm font-semibold">{lessonDetails.title}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Date & Heure</p>
                <p className="text-sm font-semibold">{lessonDetails.date} à {lessonDetails.time}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Élèves</p>
                <p className="text-sm font-semibold">{lessonDetails.student_count}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Type</p>
                <p className="text-sm font-semibold">{lessonDetails.type === 'individual' ? 'Particulier' : 'Collectif'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Moniteurs</p>
              <div className="flex flex-wrap gap-2">
                {lessonDetails.instructors?.map(s => (
                  <span key={s.id} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                    {s.full_name}
                  </span>
                ))}
              </div>
            </div>
            {lessonDetails.assistants && lessonDetails.assistants.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Aides Moniteurs</p>
                <div className="flex flex-wrap gap-2">
                  {lessonDetails.assistants.map(s => (
                    <span key={s.id} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                      {s.full_name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={() => setShowLessonModal(false)} className="w-full mt-4">Fermer</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}


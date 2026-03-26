import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, ChevronDown, ChevronRight, Calendar, TrendingUp, DollarSign, Settings,
  LogOut, Package, BarChart3, FileText, ShoppingBag, Wallet, BookOpen, Waves,
  Plus, Edit2, Trash2, Check, X, RefreshCcw, Download, Upload, ImageIcon,
  Bell, Menu, MessageSquare, MapPin, UserCheck, CreditCard, AlertTriangle, Shield, Eye, EyeOff,
  Activity, LayoutGrid, List, Grid, Star, Award, Clock, Info, Lock, Anchor, Ship,
  History, Search, CheckCircle2, RotateCcw
} from 'lucide-react';
import { MultiSelectDropdown } from '../ui/MultiSelectDropdown';
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
function Button({ children, onClick, type = 'button', className = '', disabled = false, variant = 'default' }: { children: React.ReactNode, onClick?: any, type?: 'button' | 'submit' | 'reset', className?: string, disabled?: boolean, variant?: string }) {
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

function Select({ label, value, onChange, options, className = '' }: { label?: string, value?: any, onChange?: any, options?: any[], className?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>}
      <select value={value} onChange={onChange} className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm ${className}`}>
        {options?.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Card({ children, className = '', ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) {
  return <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`} {...props}>{children}</div>;
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


export function LessonsView({ lessons, staff, clients, onUpdate, user }: { lessons: Lesson[], staff: Staff[], clients: Client[], onUpdate: () => void, user: User }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Lesson | null>(null);
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    instructor_ids: [] as number[],
    assistant_ids: [] as number[],
    student_count: '1',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '10:00',
    type: 'group',
    client_ids: [] as number[]
  });
  const [showHistory, setShowHistory] = useState(false);
  const [filterClientId, setFilterClientId] = useState<number | null>(null);
  const [historyDateFilter, setHistoryDateFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  const filterLessons = () => {
    return lessons?.filter(l => {
      const matchesDate = showHistory
        ? (!historyDateFilter || l.date === historyDateFilter)
        : l.date === filterDate;
      const matchesSearch = (l.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
        l.instructors?.some(i => (i.full_name || '').toLowerCase().includes((searchTerm || '').toLowerCase())) ||
        l.assistants?.some(a => (a.full_name || '').toLowerCase().includes((searchTerm || '').toLowerCase())) ||
        l.clients?.some(c => (c.full_name || '').toLowerCase().includes((searchTerm || '').toLowerCase()));
      const matchesClient = filterClientId ? l.clients?.some(c => c.id === filterClientId) : true;
      const matchesHistory = showHistory ? l.status === 'completed' : l.status === 'scheduled';

      return matchesDate && matchesSearch && matchesClient && matchesHistory;
    }) || [];
  };

  const filteredLessons = filterLessons();
  const totalPages = Math.ceil(filteredLessons.length / ITEMS_PER_PAGE);
  const paginatedData = filteredLessons.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const instructors = staff.filter(s => s.type === 'moniteur' || s.type === 'MONITEUR');
  const assistants = staff.filter(s => s.type === 'aide_moniteur' || s.type === 'AIDE_MONITEUR');

  (window as any).showModal = (show: boolean) => {
    if (show) {
      setEditingItem(null);
      setFormData({
        title: '',
        instructor_ids: [],
        assistant_ids: [],
        student_count: '1',
        date: filterDate,
        time: '10:00',
        type: 'group',
        client_ids: []
      });
    }
    setShowModal(show);
  };

  const handleEdit = (item: Lesson) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      instructor_ids: item.instructors?.map(i => i.id) || [],
      assistant_ids: item.assistants?.map(a => a.id) || [],
      student_count: item.student_count.toString(),
      date: item.date,
      time: item.time,
      type: item.type,
      client_ids: item.clients?.map(c => c.id) || []
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.instructor_ids.length === 0 && formData.assistant_ids.length === 0) {
      alert("Veuillez sélectionner au moins un moniteur ou un aide moniteur.");
      return;
    }

    if (formData.client_ids.length === 0) {
      alert("Veuillez sélectionner au moins un client.");
      return;
    }

    const url = editingItem ? `/api/lessons/${editingItem.id}` : '/api/lessons';
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
          student_count: parseInt(formData.student_count) || 0
        }),
        credentials: 'include'
      });

      if (res.ok) {
        setShowModal(false);
        onUpdate();
        setEditingItem(null);
      } else {
        const err = await res.json();
        alert(`Erreur: ${err.error || 'Impossible d\'enregistrer le cours'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Une erreur réseau est survenue');
    }
  };

  const handleStatusUpdate = async (id: number, status: 'scheduled' | 'completed') => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/lessons/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer ce cours ?')) {
      const token = localStorage.getItem('auth_token');
      try {
        const res = await fetch(`/api/lessons/${id}`, {
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
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-4 md:gap-6 w-full md:w-auto">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm font-bold ${showHistory ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'
              }`}
          >
            <History size={18} /> {showHistory ? 'Voir Planning' : 'Voir Historique'}
          </button>

          {showHistory && (
            <>
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <Users className="text-indigo-600" size={18} />
                <select
                  value={filterClientId || ''}
                  onChange={(e) => setFilterClientId(e.target.value ? parseInt(e.target.value) : null)}
                  className="bg-transparent border-none focus:ring-0 text-slate-900 font-bold text-sm outline-none"
                >
                  <option value="">Tous les clients</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                <Calendar className="text-indigo-600" size={18} />
                <input
                  type="date"
                  value={historyDateFilter}
                  onChange={(e) => setHistoryDateFilter(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-slate-900 font-bold text-sm"
                />
                {historyDateFilter && (
                  <button onClick={() => setHistoryDateFilter('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={14} />
                  </button>
                )}
              </div>
            </>
          )}

          {!showHistory && (
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <Calendar className="text-indigo-600" size={18} />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-slate-900 font-bold text-sm"
              />
            </div>
          )}

          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher un cours ou moniteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-full md:w-64 outline-none transition-all"
            />
          </div>
          <div className="text-sm text-slate-500 font-bold border-l border-slate-200 pl-6 hidden lg:block">
            {filteredLessons.length} cours {showHistory ? 'trouvé(s)' : 'prévu(s)'}
          </div>
        </div>
        {hasPermission(user, 'add_lessons') && (
          <button
            onClick={() => (window as any).showModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-sm font-bold shadow-lg shadow-indigo-200 w-full md:w-auto justify-center"
          >
            <Plus size={16} /> Nouveau cours
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 max-h-[70vh] overflow-y-auto pr-2 scrollbar-premium">
        {paginatedData.map((lesson) => (
          <Card key={lesson.id} className={`p-3 transition-all group relative overflow-hidden rounded-xl border-slate-100 shadow-sm hover:shadow-md hover:shadow-indigo-500/10 ${lesson.status === 'completed' ? 'bg-white' : 'hover:border-indigo-200'}`}>
            {lesson.status === 'completed' && (
              <div className="absolute top-0 right-0 bg-[#00c58d] text-white text-[9px] font-black px-2.5 py-1 rounded-bl-xl uppercase tracking-[0.1em]">
                Réalisé
              </div>
            )}

            <div className="mb-2.5 flex justify-between items-start">
              <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${lesson.type === 'group' ? 'bg-[#eff6ff] text-[#2563eb]' : 'bg-[#faf5ff] text-[#9333ea]'
                }`}>
                {lesson.type === 'group' ? 'Collectif' : 'Particulier'}
              </span>
              {(hasPermission(user, 'change_lessons') || hasPermission(user, 'delete_lessons')) && lesson.status !== 'completed' && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  {hasPermission(user, 'change_lessons') && (
                    <button onClick={() => handleEdit(lesson)} className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-all">
                      <Edit2 size={12} />
                    </button>
                  )}
                  {hasPermission(user, 'delete_lessons') && (
                    <button onClick={() => handleDelete(lesson.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[15px] font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors uppercase truncate">{lesson.title}</h4>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-slate-600 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100/50">
                <Calendar size={14} className="text-indigo-500" />
                <span className="text-[12px] font-bold">{lesson.date ? format(new Date(lesson.date), 'dd MMM', { locale: fr }) : 'Non planifié'} à {lesson.time}</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest pl-0.5">
                  Moniteurs
                </div>
                <div className="flex flex-wrap gap-1">
                  {lesson.instructors?.length ? lesson.instructors.map(i => (
                    <span key={i.id} className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-black border border-indigo-100 shadow-sm shadow-indigo-100/50">
                      {i.full_name}
                    </span>
                  )) : <span className="text-[10px] italic text-slate-400 pl-0.5">Non assigné</span>}
                </div>
              </div>

              {lesson.assistants?.length ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest pl-0.5">
                    Assistants
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {lesson.assistants.map(a => (
                      <span key={a.id} className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-black border border-amber-100 shadow-sm shadow-amber-100/50">
                        {a.full_name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest pl-0.5">
                    Élèves
                  </div>
                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mr-1">{lesson.clients?.length || 0}/{lesson.student_count}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {lesson.clients && lesson.clients.length > 0 ? (
                    lesson.clients.map(c => (
                      <div key={c.id} className="flex items-center gap-1 bg-white border border-slate-100 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        {c.full_name}
                        {c.is_subscriber && (
                          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" title="Abonné" />
                        )}
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] italic text-slate-400 pl-0.5">Aucun élève inscrit</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-50">
              {lesson.status !== 'completed' ? (
                <button
                  onClick={() => handleStatusUpdate(lesson.id, 'completed')}
                  disabled={!hasPermission(user, 'complete_lessons')}
                  className={`w-full py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-bold hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-1.5 ${!hasPermission(user, 'complete_lessons') ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  <CheckCircle2 size={12} />
                  Marquer réalisé
                </button>
              ) : (
                lesson.status === 'completed' && hasPermission(user, 'remettre_lessons') && (
                  <button
                    onClick={() => handleStatusUpdate(lesson.id, 'scheduled')}
                    className="w-full py-1.5 bg-[#f1f5f9] text-[#475569] rounded-lg text-[11px] font-bold hover:bg-[#e2e8f0] transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={12} />
                    Remettre en planning
                  </button>
                )
              )}
            </div>
          </Card>
        ))}
      </div>

      {
        filteredLessons.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <Calendar size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-lg font-medium">{showHistory ? 'Aucun cours dans l\'historique' : 'Aucun cours prévu pour cette date'}</p>
            <p className="text-sm">Changez de date ou filtrez vos recherches.</p>
          </div>
        )
      }

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {showModal && (
        <Modal title={editingItem ? "Modifier le cours" : "Nouveau cours"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input label="Titre du cours" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Initiation Débutant" required />

            <div className="grid grid-cols-2 gap-4">
              <MultiSelectDropdown
                label="Moniteurs"
                options={instructors}
                selected={formData.instructor_ids}
                onChange={(ids: number[]) => setFormData({ ...formData, instructor_ids: ids })}
                placeholder="Choisir moniteur(s)"
              />
              <MultiSelectDropdown
                label="Aides Moniteurs"
                options={assistants}
                selected={formData.assistant_ids}
                onChange={(ids: number[]) => setFormData({ ...formData, assistant_ids: ids })}
                placeholder="Choisir aide(s)"
              />
            </div>

            <MultiSelectDropdown
              label="Clients (Élèves)"
              options={clients.map(c => ({ id: c.id, full_name: `${c.full_name} ${c.is_subscriber ? '(Abonné)' : ''}` }))}
              selected={formData.client_ids}
              onChange={(ids: number[]) => setFormData({ ...formData, client_ids: ids, student_count: ids.length.toString() })}
              placeholder="Sélectionner les clients"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input label="Date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              <Input label="Heure" type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Nombre d'élèves" type="number" value={formData.student_count} onChange={(e) => setFormData({ ...formData, student_count: e.target.value })} required />
              <Select
                label="Type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: 'group', label: 'Collectif' },
                  { value: 'individual', label: 'Particulier' }
                ]}
              />
            </div>
            <Button type="submit" className="w-full py-2.5">Enregistrer le cours</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}


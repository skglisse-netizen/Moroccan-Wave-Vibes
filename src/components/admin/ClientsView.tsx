import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, ChevronDown, ChevronRight, Calendar, TrendingUp, DollarSign, Settings,
  LogOut, Package, BarChart3, FileText, ShoppingBag, Wallet, BookOpen, Waves,
  Plus, Edit2, Trash2, Check, X, RefreshCcw, Download, Upload, ImageIcon,
  Bell, Menu, MessageSquare, MapPin, UserCheck, CreditCard, AlertTriangle, Shield, Eye, EyeOff,
  Activity, LayoutGrid, List, Grid, Star, Award, Clock, Info, Lock, Anchor, Ship, CheckCircle2, History
} from 'lucide-react';
import { PurchaseHistoryModal } from './PurchaseHistoryModal';
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


export function ClientsView({ clients, services, onUpdate, user }: { clients: Client[], services: PublicService[], onUpdate: () => void, user: User }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    is_subscriber: false,
    total_sessions: 0,
    remaining_sessions: 0
  });

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryClient, setSelectedHistoryClient] = useState<Client | null>(null);

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const service = services.find(s => s.id.toString() === serviceId);
    
    if (service) {
      const isPack = !!(service.sessions_count && service.sessions_count > 0);
      if (!editingItem) {
        // If we are creating a new client, we initialize the values
        setFormData(prev => ({
          ...prev,
          is_subscriber: isPack,
          total_sessions: isPack ? (service.sessions_count || 0) : 0,
          remaining_sessions: isPack ? (service.sessions_count || 0) : 0
        }));
      } else if (isPack) {
        // If editing and it's a pack, ensure is_subscriber is true
        setFormData(prev => ({ ...prev, is_subscriber: true }));
      }
    }
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = (c.full_name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (c.phone || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (c.email || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedData = filteredClients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    const url = editingItem ? `/api/clients/${editingItem.id}` : '/api/clients';
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ ...formData, selected_service_id: selectedServiceId }),
        credentials: 'include'
      });
      if (res.ok) {
        setShowModal(false);
        onUpdate();
        setEditingItem(null);
        setSelectedServiceId('');
        setFormData({ full_name: '', phone: '', email: '', address: '', is_subscriber: false, total_sessions: 0, remaining_sessions: 0 });
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce client ?')) return;
    const token = localStorage.getItem('auth_token');
    await fetch(`/api/clients/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    onUpdate();
  };

  const handleEdit = (client: Client) => {
    setEditingItem(client);
    setFormData({
      full_name: client.full_name,
      phone: client.phone,
      email: client.email || '',
      address: client.address || '',
      is_subscriber: !!client.is_subscriber,
      total_sessions: client.total_sessions || 0,
      remaining_sessions: client.remaining_sessions || 0
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {hasPermission(user, 'add_clients') && (
          <button
            onClick={() => { setEditingItem(null); setSelectedServiceId(''); setFormData({ full_name: '', phone: '', email: '', address: '', is_subscriber: false, total_sessions: 0, remaining_sessions: 0 }); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm font-bold"
          >
            <Plus size={16} /> Nouveau Client
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
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Séances Restantes</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
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
              {paginatedData.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-4 py-2">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-900">{c.full_name}</span>
                      <span className="text-[10px] text-slate-500">{c.phone}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {c.is_subscriber ? (
                      <div className="flex flex-col items-center">
                        <span className="text-[11px] font-black text-slate-900">{c.remaining_sessions}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">sur {c.total_sessions}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-bold">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${c.is_subscriber ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'}`}>
                        {c.is_subscriber ? 'Abonné' : 'Occasionnel'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => { setSelectedHistoryClient(c); setShowHistoryModal(true); }}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Historique d'achats"
                      >
                        <History size={14} />
                      </button>
                      {hasPermission(user, 'change_clients') && (
                        <button onClick={() => handleEdit(c)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <Edit2 size={14} />
                        </button>
                      )}
                      {hasPermission(user, 'delete_clients') && (
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic text-[11px]">Aucun client trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {showModal && (
        <Modal title={editingItem ? "Modifier le Client" : "Nouveau Client"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
              <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Affecter un service / pack</label>
              <Select 
                value={selectedServiceId} 
                onChange={(e) => handleServiceChange(e.target.value)}
                options={[
                  { value: '', label: '-- Choisir un service --' },
                  ...services.filter(s => s.is_active).map(s => ({ 
                    value: s.id.toString(), 
                    label: `${s.name} (${s.price} DH${s.sessions_count ? ` - ${s.sessions_count} séances` : ''}${s.discount_percentage ? ` - Remise ${s.discount_percentage}%` : ''})` 
                  }))
                ]}
              />
              {selectedServiceId && (
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Prix à régler:</span>
                  <div className="flex items-center gap-2">
                    {services.find(s => s.id.toString() === selectedServiceId)?.discount_percentage ? (
                      <>
                        <span className="text-[10px] text-slate-400 line-through font-bold">
                          {services.find(s => s.id.toString() === selectedServiceId)?.price} DH
                        </span>
                        <span className="text-xs font-black text-emerald-600">
                          {Math.round((services.find(s => s.id.toString() === selectedServiceId)?.price || 0) * (1 - (services.find(s => s.id.toString() === selectedServiceId)?.discount_percentage || 0) / 100))} DH
                        </span>
                      </>
                    ) : (
                      <span className="text-xs font-black text-slate-900">
                        {services.find(s => s.id.toString() === selectedServiceId)?.price} DH
                      </span>
                    )}
                  </div>
                </div>
              )}
              {selectedServiceId && services.find(s => s.id.toString() === selectedServiceId)?.discount_percentage ? (
                <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Ce service bénéficie d'une remise de {services.find(s => s.id.toString() === selectedServiceId)?.discount_percentage}%
                </p>
              ) : null}
              {selectedServiceId && editingItem && services.find(s => s.id.toString() === selectedServiceId)?.sessions_count ? (
                <p className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 mt-1">
                  <Plus size={12} /> {services.find(s => s.id.toString() === selectedServiceId)?.sessions_count} séances seront ajoutées au solde actuel.
                </p>
              ) : null}
            </div>

            <Input label="Nom complet" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Téléphone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <Input label="Adresse" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            
            {formData.is_subscriber && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nombre total de séances"
                  type="number"
                  value={formData.total_sessions}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setFormData({
                      ...formData,
                      total_sessions: val,
                      remaining_sessions: editingItem ? formData.remaining_sessions : val
                    });
                  }}
                  required={formData.is_subscriber}
                  readOnly
                  className="bg-slate-100 opacity-75 cursor-not-allowed"
                />
                <Input
                  label="Séances restantes"
                  type="number"
                  value={formData.remaining_sessions}
                  onChange={(e) => setFormData({ ...formData, remaining_sessions: parseInt(e.target.value) || 0 })}
                  required={formData.is_subscriber}
                  readOnly
                  className="bg-slate-100 opacity-75 cursor-not-allowed"
                />
              </div>
            )}
            <Button type="submit" className="w-full">{editingItem ? 'Mettre à jour' : 'Enregistrer'}</Button>
          </form>
        </Modal>
      )}
      {showHistoryModal && selectedHistoryClient && (
        <PurchaseHistoryModal client={selectedHistoryClient} onClose={() => setShowHistoryModal(false)} onUpdate={onUpdate} />
      )}
    </div>
  );
}


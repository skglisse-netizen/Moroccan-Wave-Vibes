import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'motion/react';
import {
  Mail, Search, MailOpen, Trash2, Plus, Check, X, ChevronDown, ChevronRight,
  Mail as MailIcon, Trash2 as TrashIcon, Info, AlertTriangle, MessageSquare,
  Clock, Calendar, User as UserIcon, UserCheck, Shield, CreditCard, MapPin, Bell, Menu,
  Activity, LayoutGrid, List, Grid, Star, Award, Lock, Anchor, Ship, Waves,
  TrendingUp, DollarSign, Settings, LogOut, Package, BarChart3, FileText,
  ShoppingBag, Wallet, BookOpen, Edit2, RefreshCcw, Download, Upload, ImageIcon,
  Eye, EyeOff
} from 'lucide-react';
import { User, ContactMessage } from '../../types';

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

function Card({ children, className = '', ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) {
  return <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 ${className}`} {...props}>{children}</div>;
}

export function MessagesView({ messages, onUpdate, user }: { messages: ContactMessage[], onUpdate: () => void, user: User }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'read'>('all');

  const getInitials = (name: string) => {
    return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const filteredMessages = messages.filter(m => {
    const matchesSearch = (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.subject || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filterMode === 'unread') return matchesSearch && !m.is_read;
    if (filterMode === 'read') return matchesSearch && m.is_read;
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredMessages.length / ITEMS_PER_PAGE);
  const paginatedData = filteredMessages.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleMarkAsRead = async (id: number) => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/contact_messages/${id}/read`, {
        method: 'PATCH',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (res.ok) {
        onUpdate();
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage({ ...selectedMessage, is_read: true });
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!hasPermission(user, 'delete_contactmessage')) {
      alert("Vous n'avez pas la permission de supprimer ce message.");
      return;
    }
    if (!confirm('Supprimer ce message ?')) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/contact_messages/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (res.ok) {
        onUpdate();
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage(null);
        }
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-160px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
            <Mail size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Messages</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Gérer les demandes de contact</p>
          </div>
        </div>

        <div className="relative flex-1 md:flex-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 w-full md:w-64 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        <Card className="lg:col-span-4 overflow-hidden flex flex-col border-slate-200/60 shadow-sm bg-white/50 backdrop-blur-sm">
          <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex gap-1">
            <button
              onClick={() => setFilterMode('all')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${filterMode === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${filterMode === 'unread' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Non lus {messages?.filter(m => !m.is_read).length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-[10px]">{messages.filter(m => !m.is_read).length}</span>}
            </button>
            <button
              onClick={() => setFilterMode('read')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${filterMode === 'read' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Lus
            </button>
          </div>
          <div className="overflow-y-auto flex-1 scrollbar-premium">
            {paginatedData.map((message) => (
              <div
                key={message.id}
                onClick={() => {
                  setSelectedMessage(message);
                  if (!message.is_read) handleMarkAsRead(message.id);
                }}
                className={`p-4 border-b border-slate-50 cursor-pointer transition-all relative group ${selectedMessage?.id === message.id ? 'bg-white shadow-[inset_4px_0_0_0_#4f46e5]' : 'hover:bg-white/80'}`}
              >
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${!message.is_read ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                    {getInitials(message.name || 'User')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className={`text-[13px] truncate ${!message.is_read ? 'text-slate-900 font-bold' : 'text-slate-600 font-semibold'}`}>{message.name}</span>
                      <span className="text-[10px] text-slate-400 font-black uppercase whitespace-nowrap ml-2">
                        {message.created_at ? format(new Date(message.created_at), 'dd/MM HH:mm') : ''}
                      </span>
                    </div>
                    <div className={`text-[12px] truncate mb-1 ${!message.is_read ? 'text-indigo-600 font-bold' : 'text-slate-500'}`}>
                      {message.subject}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate font-medium">{message.message}</div>
                  </div>
                  {!message.is_read && (
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                  )}
                </div>
              </div>
            ))}
            {paginatedData.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center opacity-40">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
                  <MailOpen size={32} className="text-slate-400" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-1">Boîte Vide</h4>
                <p className="text-xs font-bold text-slate-500">Aucun message ne correspond à vos critères.</p>
              </div>
            )}
          </div>
          <div className="p-3 border-t border-slate-100 bg-white shadow-sm shrink-0">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </Card>

        <Card className="lg:col-span-8 overflow-hidden flex flex-col border-slate-200/60 shadow-xl bg-white relative">
          {selectedMessage ? (
            <div className="flex flex-col h-full bg-slate-50/10">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-100">
                    {getInitials(selectedMessage.name || 'U')}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{selectedMessage.subject}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-slate-700">{selectedMessage.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold">&lt;{selectedMessage.email}&gt;</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="mr-4 text-right hidden md:block">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reçu le</p>
                    <p className="text-xs font-bold text-slate-700">
                      {selectedMessage.created_at ? format(new Date(selectedMessage.created_at), 'dd MMM yyyy à HH:mm', { locale: fr }) : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasPermission(user, 'change_contactmessage') && (
                      <button
                        onClick={() => onUpdate()}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        title="Rafraîchir"
                      >
                        <Mail size={18} />
                      </button>
                    )}
                    {hasPermission(user, 'delete_contactmessage') && (
                      <button
                        onClick={() => handleDelete(selectedMessage.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-8 overflow-y-auto flex-1 scrollbar-premium">
                <div className="max-w-3xl mx-auto">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-slate-50 to-transparent rounded-tr-3xl"></div>
                    <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedMessage.message}
                    </div>
                  </div>
                  <div className="mt-8 flex items-center gap-4 text-slate-300">
                    <div className="flex-1 h-px bg-slate-100"></div>
                    <div className="text-[10px] font-black uppercase tracking-widest">Fin du message</div>
                    <div className="flex-1 h-px bg-slate-100"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 bg-slate-50/20">
              <div className="w-24 h-24 rounded-[2.5rem] bg-white flex items-center justify-center mb-6 shadow-xl shadow-slate-200/50 border border-slate-100">
                <Mail size={32} className="text-indigo-600 opacity-40 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">Sélectionnez un message</h3>
              <p className="text-sm font-bold text-slate-400 max-w-xs text-center leading-relaxed">Choisissez une conversation dans la liste de gauche pour afficher son contenu détaillé.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

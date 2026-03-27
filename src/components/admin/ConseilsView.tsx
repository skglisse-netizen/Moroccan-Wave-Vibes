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


export function ConseilsView({ conseils, onUpdate, settings, onUpdateSettings, user , content, onUpdateContent}: { conseils: Conseil[], onUpdate: () => void, settings: AppSettings, onUpdateSettings: () => void, user: User , content?: any, onUpdateContent?: any}) {
  const [showModal, setShowModal] = useState(false);
  const [editingConseil, setEditingConseil] = useState<Conseil | null>(null);
  const [form, setForm] = useState({ title: '', content: '', image_url: '', is_active: true });
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfig, setShowConfig] = useState(false);

  const [configForm, setConfigForm] = useState({
    conseils_title: settings.conseils_title || '',
    conseils_subtitle: settings.conseils_subtitle || '',
    conseils_button_text: settings.conseils_button_text || 'En savoir plus',
    conseils_bg_image: settings.conseils_bg_image || '',
    conseils_layout: settings.conseils_layout || 'grid-3',
  });

  useEffect(() => {
    setConfigForm({
      conseils_title: settings.conseils_title || '',
      conseils_subtitle: settings.conseils_subtitle || '',
      conseils_button_text: settings.conseils_button_text || 'En savoir plus',
      conseils_bg_image: settings.conseils_bg_image || '',
      conseils_layout: settings.conseils_layout || 'grid-3',
    });
  }, [settings]);

  const handleConfigSubmit = async () => {
    if (!hasPermission(user, 'change_settings')) {
      alert("Vous n'avez pas la permission de modifier les paramètres.");
      return;
    }
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
        alert('Configuration mise à jour !');
      }
    } catch (e) { console.error(e); }
  };


  const totalPages = Math.ceil(conseils.length / ITEMS_PER_PAGE);
  const paginatedData = conseils.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const permission = editingConseil ? 'change_landing_page' : 'add_landing_page';
    if (!hasPermission(user, permission)) {
      alert("Vous n'avez pas la permission d'effectuer cette action.");
      return;
    }
    const token = localStorage.getItem('auth_token');
    const url = editingConseil ? `/api/admin/conseils/${editingConseil.id}` : '/api/admin/conseils';
    const method = editingConseil ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(form),
      credentials: 'include'
    });
    setShowModal(false);
    onUpdate();
  };

  const handleDelete = async (id: number) => {
    if (!hasPermission(user, 'delete_landing_page')) {
      alert("Vous n'avez pas la permission de supprimer cet élément.");
      return;
    }
    if (!confirm('Supprimer ce conseil ?')) return;
    const token = localStorage.getItem('auth_token');
    await fetch(`/api/admin/conseils/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    onUpdate();
  };

  const handleToggleActive = async (conseil: Conseil) => {
    if (!hasPermission(user, 'change_landing_page')) return;
    const token = localStorage.getItem('auth_token');
    await fetch(`/api/admin/conseils/${conseil.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ ...conseil, is_active: !conseil.is_active }),
      credentials: 'include'
    });
    onUpdate();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/upload/media', {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: formData,
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, image_url: data.url }));
      }
    } catch (err) { console.error(err); }
  };

  const sectionData = (content || []).find(c => c.section === 'conseils') || { section: 'conseils', button_label: 'Conseils', is_active: true };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Gestion des Conseils</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gérez le contenu informatif du site</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowConfig(!showConfig)}>
            <Settings size={18} /> Configuration
          </Button>
          <Button onClick={() => {
            setEditingConseil(null);
            setForm({ title: '', content: '', image_url: '', is_active: true });
            setShowModal(true);
          }}>
            <Plus size={18} /> Nouveau Conseil
          </Button>
        </div>
      </div>


      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-6 border-indigo-100 bg-indigo-50/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input
                    label="Titre de la section"
                    value={configForm.conseils_title}
                    onChange={(e) => setConfigForm({ ...configForm, conseils_title: e.target.value })}
                  />
                  <Input
                    label="Sous-titre de la section"
                    value={configForm.conseils_subtitle}
                    onChange={(e) => setConfigForm({ ...configForm, conseils_subtitle: e.target.value })}
                  />
                  <Input
                    label="Texte du bouton"
                    value={configForm.conseils_button_text}
                    onChange={(e) => setConfigForm({ ...configForm, conseils_button_text: e.target.value })}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-indigo-100/50">
                    <div className="flex-1 w-full">
                      <Input 
                        label="Nom du bouton (Menu)" 
                        defaultValue={sectionData.button_label} 
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                          const newVal = e.target.value;
                          if (newVal !== sectionData.button_label) {
                            onUpdateContent('conseils', { ...sectionData, button_label: newVal });
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Visibilité Publique</label>
                      <button
                        type="button"
                        onClick={() => onUpdateContent('conseils', { ...sectionData, is_active: !sectionData.is_active })}
                        className={`w-12 h-6 rounded-full relative transition-colors ${sectionData.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${sectionData.is_active ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 mt-2">
                    <Button onClick={handleConfigSubmit} className="w-full">
                      <Check size={16} /> Enregistrer la configuration
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 md:pt-0 md:pl-6 border-t md:border-t-0 md:border-l border-indigo-100/50">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Arrière-plan de la Page</label>
                  <div className="flex flex-col gap-4">
                    {configForm.conseils_bg_image ? (
                      <div className="relative group aspect-video">
                        <img src={configForm.conseils_bg_image} alt="Fond Conseils" className="w-full h-full object-cover rounded-xl border border-slate-200" />
                        <button
                          type="button"
                          onClick={() => setConfigForm({ ...configForm, conseils_bg_image: '' })}
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
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append('file', file);
                        const token = localStorage.getItem('auth_token');
                        try {
                          const res = await fetch('/api/upload/media', {
                            method: 'POST',
                            headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                            body: fd,
                            credentials: 'include'
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setConfigForm(prev => ({ ...prev, conseils_bg_image: data.url }));
                          }
                        } catch (err) { console.error(err); }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer border border-slate-100 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedData.map(c => (
          <Card key={c.id} className="p-6 relative group overflow-hidden border-slate-100 hover:shadow-lg transition-all">
            <div className="h-40 -mx-6 -mt-6 mb-6 bg-slate-100 relative">
              {c.image_url ? (
                <img src={c.image_url} alt={c.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <FileText size={48} />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => {
                    setEditingConseil(c);
                    setForm({ title: c.title, content: c.content, image_url: c.image_url || '', is_active: c.is_active });
                    setShowModal(true);
                  }}
                  className="p-2 bg-white/90 backdrop-blur text-indigo-600 rounded-xl shadow-sm hover:bg-white"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 bg-white/90 backdrop-blur text-rose-600 rounded-xl shadow-sm hover:bg-white"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900">{c.title}</h4>
              <button
                onClick={() => handleToggleActive(c)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${c.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
              >
                {c.is_active ? 'Actif' : 'Inactif'}
              </button>
            </div>
            <p className="text-sm text-slate-500 line-clamp-3 whitespace-pre-line">{c.content}</p>
          </Card>
        ))}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {showModal && (
        <Modal title={editingConseil ? "Modifier le conseil" : "Nouveau conseil"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Titre" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Contenu</label>
              <textarea
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm h-32"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Image</label>
              <div className="flex gap-2">
                <Input className="flex-1" placeholder="URL de l'image" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                <div className="relative">
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Button variant="secondary"><Upload size={16} /></Button>
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full">Enregistrer</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}


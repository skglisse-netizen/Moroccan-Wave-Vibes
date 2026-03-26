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


export function ServicesAdminView({ services, onUpdate, settings, onUpdateSettings, user , content, onUpdateContent}: { services: PublicService[], onUpdate: () => void, settings: AppSettings, onUpdateSettings: () => void, user: User , content?: any, onUpdateContent?: any}) {
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<PublicService | null>(null);
  const [serviceForm, setServiceForm] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    image_url: '', 
    is_active: true, 
    discount_percentage: '', 
    sessions_count: '',
    is_pack: false 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfig, setShowConfig] = useState(false);

  const [configForm, setConfigForm] = useState({
    services_title: settings.services_title || '',
    services_subtitle: settings.services_subtitle || '',
    services_bg_image: settings.services_bg_image || '',
    services_layout: settings.services_layout || 'grid-3',
  });

  useEffect(() => {
    setConfigForm({
      services_title: settings.services_title || '',
      services_subtitle: settings.services_subtitle || '',
      services_bg_image: settings.services_bg_image || '',
      services_layout: settings.services_layout || 'grid-3',
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



  const totalPages = Math.ceil(services.length / ITEMS_PER_PAGE);
  const paginatedData = services.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const permission = editingService ? 'change_landing_page' : 'add_landing_page';
    if (!hasPermission(user, permission)) {
      alert("Vous n'avez pas la permission d'effectuer cette action.");
      return;
    }
    const token = localStorage.getItem('auth_token');
    const url = editingService ? `/api/admin/public-services/${editingService.id}` : '/api/admin/public-services';
    const method = editingService ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        name: serviceForm.name,
        description: serviceForm.description,
        price: parseFloat(serviceForm.price) || 0,
        image_url: serviceForm.image_url,
        is_active: !!serviceForm.is_active,
        discount_percentage: parseInt(serviceForm.discount_percentage) || 0,
        sessions_count: parseInt(serviceForm.sessions_count) || 1,
        is_pack: !!serviceForm.is_pack
      }),
      credentials: 'include'
    });
    setShowServiceModal(false);
    onUpdate();
  };

  const handleDeleteService = async (id: number) => {
    if (!hasPermission(user, 'delete_landing_page')) {
      alert("Vous n'avez pas la permission de supprimer cet élément.");
      return;
    }
    if (!confirm('Supprimer ce service ?')) return;
    const token = localStorage.getItem('auth_token');
    await fetch(`/api/admin/public-services/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    onUpdate();
  };

  const handleToggleServiceActive = async (service: PublicService) => {
    const token = localStorage.getItem('auth_token');
    await fetch(`/api/admin/public-services/${service.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        ...service,
        is_active: !service.is_active
      }),
      credentials: 'include'
    });
    onUpdate();
  };

  const sectionData = (content || []).find(c => c.section === 'services') || { section: 'services', button_label: 'Services', is_active: true };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Services Publics</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gérez vos offres et tarifs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowConfig(!showConfig)}>
            <Settings size={18} /> Configuration
          </Button>
          <Button onClick={() => {
            setEditingService(null);
            setServiceForm({ 
              name: '', 
              description: '', 
              price: '', 
              image_url: '', 
              is_active: true, 
              discount_percentage: '', 
              sessions_count: '1',
              is_pack: false 
            });
            setShowServiceModal(true);
          }}>
            <Plus size={18} /> Ajouter un service
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
                    value={configForm.services_title}
                    onChange={(e) => setConfigForm({ ...configForm, services_title: e.target.value })}
                  />
                  <Input
                    label="Sous-titre de la section"
                    value={configForm.services_subtitle}
                    onChange={(e) => setConfigForm({ ...configForm, services_subtitle: e.target.value })}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-indigo-100/50">
                    <div className="flex-1 w-full">
                      <Input 
                        label="Nom du bouton (Menu)" 
                        defaultValue={sectionData.button_label} 
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                          const newVal = e.target.value;
                          if (newVal !== sectionData.button_label) {
                            onUpdateContent('services', { ...sectionData, button_label: newVal });
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Visibilité Publique</label>
                      <button
                        type="button"
                        onClick={() => onUpdateContent('services', { ...sectionData, is_active: !sectionData.is_active })}
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
                    {configForm.services_bg_image ? (
                      <div className="relative group aspect-video">
                        <img src={configForm.services_bg_image} alt="Fond Services" className="w-full h-full object-cover rounded-xl border border-slate-200" />
                        <button
                          type="button"
                          onClick={() => setConfigForm({ ...configForm, services_bg_image: '' })}
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
                          reader.onloadend = () => setConfigForm(prev => ({ ...prev, services_bg_image: reader.result as string }));
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white file:text-indigo-700 hover:file:bg-indigo-50 transition-all cursor-pointer border border-slate-100 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedData.map(s => (
          <Card key={s.id} className={`p-6 relative group overflow-hidden border-slate-100 hover:shadow-lg transition-all ${!s.is_active ? 'opacity-50' : ''}`}>
            <div className="h-40 -mx-6 -mt-6 mb-6 bg-slate-100 relative">
              {s.image_url ? (
                <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <MapPin size={48} />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button
                  onClick={() => {
                    setEditingService(s);
                    setServiceForm({ 
                      name: s.name, 
                      description: s.description, 
                      price: s.price.toString(), 
                      image_url: s.image_url || '', 
                      is_active: s.is_active,
                      discount_percentage: s.discount_percentage > 0 ? s.discount_percentage.toString() : '',
                      sessions_count: (!s.is_pack) ? '1' : (s.sessions_count || '1').toString(),
                      is_pack: !!s.is_pack
                    });
                    setShowServiceModal(true);
                  }}
                  className="p-2 bg-white/90 backdrop-blur text-indigo-600 rounded-xl shadow-sm hover:bg-white"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteService(s.id)}
                  className="p-2 bg-white/90 backdrop-blur text-rose-600 rounded-xl shadow-sm hover:bg-white"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900">{s.name}</h4>
              <button
                onClick={() => handleToggleServiceActive(s)}
                className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${s.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
              >
                {s.is_active ? 'Actif' : 'Inactif'}
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2 whitespace-pre-line">
              <span className="text-indigo-600 font-bold">{s.sessions_count || 1} {Number(s.sessions_count || 1) > 1 ? 'séances' : 'séance'} - </span>
              {s.description}
            </p>
            <div className="flex items-center gap-2">
              {s.discount_percentage > 0 ? (
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 line-through font-bold">{s.price} DH</span>
                  <span className="text-xl font-black text-indigo-600">{Math.round(s.price * (1 - (s.discount_percentage || 0) / 100))} DH</span>
                </div>
              ) : (
                <span className="text-xl font-black text-slate-900">{s.price} DH</span>
              )}
              {s.discount_percentage > 0 && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  -{s.discount_percentage}%
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {showServiceModal && (
        <Modal title={editingService ? "Modifier le service" : "Nouveau service"} onClose={() => setShowServiceModal(false)} maxWidth="max-w-lg">
          <form onSubmit={handleServiceSubmit} className="space-y-4">
            <Input label="Nom du service" value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} required />
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</label>
              <textarea
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm h-24"
                value={serviceForm.description}
                onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                required
              />
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Type de prestation</label>
              <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setServiceForm({ ...serviceForm, is_pack: false, sessions_count: '1' })}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${!serviceForm.is_pack ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  Service Simple
                </button>
                <button
                  type="button"
                  onClick={() => setServiceForm({ ...serviceForm, is_pack: true, sessions_count: serviceForm.sessions_count || '1' })}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${serviceForm.is_pack ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  Pack
                </button>
              </div>
            </div>

            <Input label="Prix (DH)" type="number" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} required />
            
            <div className="grid grid-cols-2 gap-4">
              <Input label="Remise (%)" type="number" value={serviceForm.discount_percentage} onChange={(e) => setServiceForm({ ...serviceForm, discount_percentage: e.target.value })} />
              <Input 
                label="Nombre de séances" 
                type="number" 
                value={serviceForm.sessions_count} 
                onChange={(e) => setServiceForm({ ...serviceForm, sessions_count: e.target.value })} 
                readOnly={!serviceForm.is_pack}
                min="1"
                className={!serviceForm.is_pack ? 'bg-slate-100 opacity-75 cursor-not-allowed' : ''}
              />
            </div>
            <Input label="URL de l'image" value={serviceForm.image_url} onChange={(e) => setServiceForm({ ...serviceForm, image_url: e.target.value })} />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={serviceForm.is_active}
                onChange={e => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="is_active" className="text-sm font-bold text-slate-700">Afficher sur le site</label>
            </div>
            <Button type="submit" className="w-full">{editingService ? 'Mettre à jour' : 'Ajouter'}</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}


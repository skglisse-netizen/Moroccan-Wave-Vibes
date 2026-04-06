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
import { LocationPickerMap } from './LocationPickerMap';


export function SpotsAdminView({ spots, onUpdate, settings, onUpdateSettings, user, content, onUpdateContent }: { spots: Spot[], onUpdate: () => void, settings: AppSettings, onUpdateSettings: () => void, user: User, content?: any, onUpdateContent?: any }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Spot | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfig, setShowConfig] = useState(false);
  const [configForm, setConfigForm] = useState({
    spots_title: settings?.spots_title || '',
    spots_subtitle: settings?.spots_subtitle || '',
    spots_content: settings?.spots_content || '',
    nav_color: settings?.nav_color || '#ffffff',
    spots_layout: settings?.spots_layout || 'split',
  });

  useEffect(() => {
    setConfigForm({
      spots_title: settings?.spots_title || '',
      spots_subtitle: settings?.spots_subtitle || '',
      spots_content: settings?.spots_content || '',
      nav_color: settings?.nav_color || '#ffffff',
      spots_layout: settings?.spots_layout || 'split',
    });
  }, [settings]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    lat: '',
    lng: '',
    difficulty: 'Débutant',
    image_url: '',
    suggestion_type: '',
    suggestion_name: '',
    suggestion_link: '',
    live_cam_url: '',
    suggestions: [] as { type: string, name: string, link: string }[],
    is_active: true
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  const updateLocation = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6)
    }));
  };

  const filteredSpots = spots.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = !difficultyFilter || s.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const totalPages = Math.ceil(filteredSpots.length / ITEMS_PER_PAGE);
  const paginatedData = filteredSpots.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      }
    } catch (e) { console.error(e); }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const permission = editingItem ? 'change_landing_page' : 'add_landing_page';
    if (!hasPermission(user, permission)) {
      alert("Vous n'avez pas la permission d'effectuer cette action.");
      return;
    }
    const token = localStorage.getItem('auth_token');
    const url = editingItem ? `/api/admin/spots/${editingItem.id}` : '/api/admin/spots';
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...formData,
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          is_active: formData.is_active
        }),
        credentials: 'include'
      });
      if (res.ok) {
        setShowModal(false);
        onUpdate();
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!hasPermission(user, 'delete_landing_page')) {
      alert("Vous n'avez pas la permission de supprimer cet élément.");
      return;
    }
    if (!confirm('Supprimer ce spot ?')) return;
    const token = localStorage.getItem('auth_token');
    await fetch(`/api/admin/spots/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    onUpdate();
  };

  const sectionData = (content || []).find(c => c.section === 'spots') || { section: 'spots', button_label: 'Spots', is_active: true };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Gestion des Spots</h3>
        <div className="flex items-center gap-3">
          {hasPermission(user, 'change_settings') && (
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all text-sm font-bold ${showConfig ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
            >
              <Settings size={16} /> Configuration Page Publique
            </button>
          )}
          <Button onClick={() => { setEditingItem(null); setFormData({ name: '', description: '', lat: '', lng: '', difficulty: 'Débutant', image_url: '', suggestion_type: '', suggestion_name: '', suggestion_link: '', live_cam_url: '', suggestions: [], is_active: true }); setShowModal(true); }}>
            <Plus size={18} /> Ajouter un Spot
          </Button>
        </div>
      </div>


      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-6 border-2 border-indigo-100 bg-indigo-50/30">
              <form onSubmit={handleConfigSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Input
                      label="Titre de la section"
                      value={configForm.spots_title}
                      onChange={(e) => setConfigForm({ ...configForm, spots_title: e.target.value })}
                    />
                    <Input
                      label="Sous-titre"
                      value={configForm.spots_subtitle}
                      onChange={(e) => setConfigForm({ ...configForm, spots_subtitle: e.target.value })}
                    />
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Description des spots</label>
                      <textarea
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm h-24"
                        value={configForm.spots_content}
                        onChange={(e) => setConfigForm({ ...configForm, spots_content: e.target.value })}
                        placeholder=""
                      />
                    </div>
                    <Select
                      label="Mise en page (Layout)"
                      value={configForm.spots_layout}
                      onChange={(e) => setConfigForm({ ...configForm, spots_layout: e.target.value })}
                      options={[
                        { value: 'split', label: 'Divisé (Carte + Spots)' },
                        { value: 'grid-2', label: 'Grille (2 colonnes)' },
                        { value: 'grid-1', label: 'Liste (1 colonne)' },
                        { value: 'horizontal-scroll', label: 'Défilement horizontal' }
                      ]}
                    />

                    <div className="space-y-2 pt-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Couleur d'arrière-plan de la Page</label>
                      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                        <input
                          type="color"
                          value={configForm.nav_color}
                          onChange={(e) => setConfigForm({ ...configForm, nav_color: e.target.value })}
                          className="w-10 h-10 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                        />
                        <span className="text-xs font-mono text-slate-500 uppercase font-bold">{configForm.nav_color}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-indigo-100/50">
                      <div className="flex-1 w-full">
                        <Input
                          label="Nom du bouton (Menu)"
                          defaultValue={sectionData.button_label}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            const newVal = e.target.value;
                            if (newVal !== sectionData.button_label) {
                              onUpdateContent('spots', { ...sectionData, button_label: newVal });
                            }
                          }}
                        />
                      </div>
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Visibilité Publique</label>
                        <button
                          type="button"
                          onClick={() => onUpdateContent('spots', { ...sectionData, is_active: !sectionData.is_active })}
                          className={`w-12 h-6 rounded-full relative transition-colors ${sectionData.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${sectionData.is_active ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
                <div className="flex justify-end pt-4 border-t border-indigo-100">
                  <Button type="submit" className="shadow-md">
                    <Check size={16} /> Enregistrer la configuration
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="overflow-hidden">
        <div className="overflow-auto scrollbar-premium max-h-[80vh]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-16">Image</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex flex-col gap-1.5 text-left">
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
                  <div className="flex flex-col gap-1.5 text-left">
                    <span>Difficulté</span>
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal"
                    >
                      <option value="">Toutes</option>
                      <option value="Débutant">Débutant</option>
                      <option value="Intermédiaire">Intermédiaire</option>
                      <option value="Avancé">Avancé</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Coordonnées</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      {(searchTerm || difficultyFilter) && (
                        <button
                          onClick={() => { setSearchTerm(''); setDifficultyFilter(''); }}
                          className="flex items-center gap-1 text-[10px] text-rose-600 hover:text-white hover:bg-rose-500 font-bold uppercase px-2 py-1 border border-rose-200 rounded-md transition-all shadow-sm"
                        >
                          <RefreshCcw size={10} />
                          <span className="hidden sm:inline">Réinitialiser</span>
                        </button>
                      )}
                      <span>Actions</span>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-4 py-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                      {s.image_url ? (
                        <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <MapPin size={16} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-[11px]">
                    <p className="font-bold text-slate-900">{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium line-clamp-1 max-w-[200px]">{s.description}</p>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                      {s.difficulty}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-[10px] font-mono text-slate-400">
                    {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => { setEditingItem(s); setFormData({ name: s.name, description: s.description, lat: s.lat.toString(), lng: s.lng.toString(), difficulty: s.difficulty, image_url: s.image_url || '', suggestion_type: s.suggestion_type || '', suggestion_name: s.suggestion_name || '', suggestion_link: s.suggestion_link || '', live_cam_url: s.live_cam_url || '', suggestions: s.suggestions || [], is_active: s.is_active ?? true }); setShowModal(true); }}
                        className="p-1.5 text-indigo-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 text-rose-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-slate-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">Aucun spot trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {showModal && (
        <Modal title={editingItem ? "Modifier le Spot" : "Nouveau Spot"} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Nom du spot" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</label>
              <textarea
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm h-24"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Localisation sur la carte</label>
              <LocationPickerMap
                lat={parseFloat(formData.lat) || 30.5442}
                lng={parseFloat(formData.lng) || -9.7088}
                onChange={updateLocation}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Latitude" type="number" step="any" value={formData.lat} onChange={(e) => setFormData({ ...formData, lat: e.target.value })} required />
                <Input label="Longitude" type="number" step="any" value={formData.lng} onChange={(e) => setFormData({ ...formData, lng: e.target.value })} required />
              </div>
            </div>
            <Select
              label="Difficulté"
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              options={[
                { value: 'Débutant', label: 'Débutant' },
                { value: 'Intermédiaire', label: 'Intermédiaire' },
                { value: 'Avancé', label: 'Avancé' },
                { value: 'Expert', label: 'Expert' }
              ]}
            />
            <div className="space-y-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
              <Input label="URL de l'image (Lien externe)" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
              
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OU</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Importer depuis votre PC</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setFormData(prev => ({ ...prev, image_url: reader.result as string }));
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer bg-white border border-slate-200 rounded-xl"
                />
                {formData.image_url && formData.image_url.startsWith('data:image') && (
                   <p className="text-[10px] text-emerald-600 font-bold mt-2">✓ Image locale importée ({Math.round(formData.image_url.length / 1024)} KB)</p>
                )}
              </div>
            </div>
            <Input label="URL Live Cam (ex: YouTube, MKS, etc.)" value={formData.live_cam_url} onChange={(e) => setFormData({ ...formData, live_cam_url: e.target.value })} />
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">Suggestions (Hébergements, Écoles, etc.)</h4>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, suggestions: [...formData.suggestions, { type: 'Surf Camp', name: '', link: '' }] })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                >
                  <Plus size={14} /> Ajouter une suggestion
                </button>
              </div>

              <div className="space-y-4">
                {formData.suggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 relative group/sugg">
                    <button
                      type="button"
                      onClick={() => {
                        const newSuggestions = [...formData.suggestions];
                        newSuggestions.splice(index, 1);
                        setFormData({ ...formData, suggestions: newSuggestions });
                      }}
                      className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-600 opacity-0 group-hover/sugg:opacity-100 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Type"
                        value={suggestion.type}
                        onChange={(e) => {
                          const newSuggestions = [...formData.suggestions];
                          newSuggestions[index].type = e.target.value;
                          setFormData({ ...formData, suggestions: newSuggestions });
                        }}
                        options={[
                          { value: 'Surf Camp', label: 'Surf Camp' },
                          { value: 'Hostel', label: 'Hostel' },
                          { value: 'Surf Club', label: 'Surf Club' },
                          { value: 'Hôtel', label: 'Hôtel' },
                          { value: 'Restaurant', label: 'Restaurant' },
                          { value: 'Autre', label: 'Autre' }
                        ]}
                      />
                      <Input
                        label="Nom"
                        value={suggestion.name}
                        onChange={(e) => {
                          const newSuggestions = [...formData.suggestions];
                          newSuggestions[index].name = e.target.value;
                          setFormData({ ...formData, suggestions: newSuggestions });
                        }}
                        placeholder="Ex: Surf Maroc"
                      />
                    </div>
                    <Input
                      label="Lien (URL)"
                      value={suggestion.link}
                      onChange={(e) => {
                        const newSuggestions = [...formData.suggestions];
                        newSuggestions[index].link = e.target.value;
                        setFormData({ ...formData, suggestions: newSuggestions });
                      }}
                      placeholder="https://..."
                    />
                  </div>
                ))}
                {formData.suggestions.length === 0 && (
                  <p className="text-center py-4 text-slate-400 text-xs italic">Aucune suggestion ajoutée</p>
                )}
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Spot Actif (Visible sur la carte)</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className={`w-12 h-6 rounded-full relative transition-colors ${formData.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${formData.is_active ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <Button type="submit" className="w-full">Enregistrer</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}


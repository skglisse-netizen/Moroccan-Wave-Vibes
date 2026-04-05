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


export function SettingsView({ settings, onUpdate, content, onUpdateContent, user }: { settings: AppSettings, onUpdate: () => any, content: LandingPageContent[], onUpdateContent: (section: string, data: any) => Promise<void>, user: User }) {
  const [formData, setFormData] = useState({
    app_name: settings.app_name,
    app_logo: settings.app_logo,
    header_color: settings.header_color || '#ffffff',
    header_text_color: settings.header_text_color || '#000000',
    nav_color: settings.nav_color || '#ffffff',
    nav_text_color: settings.nav_text_color || '#475569',
    footer_color: settings.footer_color || '#ffffff',
    footer_text_color: settings.footer_text_color || '#000000',
    body_bg_color: settings.body_bg_color || '#f8fafc',
    title_color: settings.title_color || '#1e293b',
    subtitle_color: settings.subtitle_color || '#64748b',
    sticky_footer: String(settings.sticky_footer) === 'true',
    services_layout: settings.services_layout || 'grid-3',
    smtp_to: settings.smtp_to || '',
    sponsor_bar_color: (settings as any).sponsor_bar_color || '#f8fafc',
    sponsor_images: (settings as any).sponsor_images || '[]',
    sponsor_duration: settings.sponsor_duration || '3000',
  });

  const [newSponsorUrl, setNewSponsorUrl] = useState('');
  const [newSponsorAlt, setNewSponsorAlt] = useState('');

  const getSponsorImages = (): { url: string; alt: string }[] => {
    try { return JSON.parse(formData.sponsor_images); } catch { return []; }
  };

  const addSponsor = (url: string, alt: string) => {
    if (!url.trim()) return;
    const list = getSponsorImages();
    list.push({ url: url.trim(), alt: alt.trim() || 'Sponsor' });
    setFormData(prev => ({ ...prev, sponsor_images: JSON.stringify(list) }));
    setNewSponsorUrl('');
    setNewSponsorAlt('');
  };

  const removeSponsor = (idx: number) => {
    const list = getSponsorImages().filter((_, i) => i !== idx);
    setFormData(prev => ({ ...prev, sponsor_images: JSON.stringify(list) }));
  };

  // Sync form when settings prop updates asynchronously (e.g. after fetchSettings resolves)
  useEffect(() => {
    setFormData({
      app_name: settings.app_name,
      app_logo: settings.app_logo,
      header_color: settings.header_color || '#ffffff',
      header_text_color: settings.header_text_color || '#000000',
      nav_color: settings.nav_color || '#ffffff',
      nav_text_color: settings.nav_text_color || '#475569',
      footer_color: settings.footer_color || '#ffffff',
      footer_text_color: settings.footer_text_color || '#000000',
      body_bg_color: settings.body_bg_color || '#f8fafc',
      title_color: settings.title_color || '#1e293b',
      subtitle_color: settings.subtitle_color || '#64748b',
      sticky_footer: String(settings.sticky_footer) === 'true',
      services_layout: settings.services_layout || 'grid-3',
      smtp_to: settings.smtp_to || '',
      sponsor_bar_color: (settings as any).sponsor_bar_color || '#f8fafc',
      sponsor_images: (settings as any).sponsor_images || '[]',
      sponsor_duration: settings.sponsor_duration || '3000',
    });
  }, [settings]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      if (res.ok) {
        onUpdate();
        alert('Paramètres mis à jour avec succès');
      }
    } catch (e) { console.error(e); }
  };

  return (
    <Card className="max-w-4xl mx-auto p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Identité</h3>
            <Input
              label="Nom de l'école"
              value={formData.app_name}
              onChange={(e) => setFormData({ ...formData, app_name: e.target.value })}
              required
            />

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700">Logo de l'application</label>
              <div className="flex items-center gap-4">
                {formData.app_logo ? (
                  <div className="relative group">
                    <img src={formData.app_logo} alt="Logo" className="h-16 w-16 object-contain rounded-xl border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, app_logo: '' })}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-rose-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-slate-50 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400">
                    <ImageIcon size={24} />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setFormData(prev => ({ ...prev, app_logo: reader.result as string }));
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Couleurs & Style</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Couleur Header</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.header_color}
                    onChange={(e) => setFormData({ ...formData, header_color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
                  />
                  <span className="text-xs font-mono text-slate-500 uppercase">{formData.header_color}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Texte Header</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.header_text_color}
                    onChange={(e) => setFormData({ ...formData, header_text_color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
                  />
                  <span className="text-xs font-mono text-slate-500 uppercase">{formData.header_text_color}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Texte Menu Nav (Site)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.nav_text_color || '#475569'}
                    onChange={(e) => setFormData({ ...formData, nav_text_color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
                  />
                  <span className="text-xs font-mono text-slate-500 uppercase">{formData.nav_text_color}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Couleur Footer</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.footer_color}
                    onChange={(e) => setFormData({ ...formData, footer_color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
                  />
                  <span className="text-xs font-mono text-slate-500 uppercase">{formData.footer_color}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Texte Footer</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.footer_text_color}
                    onChange={(e) => setFormData({ ...formData, footer_text_color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
                  />
                  <span className="text-xs font-mono text-slate-500 uppercase">{formData.footer_text_color}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Couleur Fond Dashboard</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.body_bg_color}
                    onChange={(e) => setFormData({ ...formData, body_bg_color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
                  />
                  <span className="text-xs font-mono text-slate-500 uppercase">{formData.body_bg_color}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Couleur des Titres</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.title_color}
                    onChange={(e) => setFormData({ ...formData, title_color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
                  />
                  <span className="text-xs font-mono text-slate-500 uppercase">{formData.title_color}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase">Couleur des Sous-titres</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.subtitle_color}
                    onChange={(e) => setFormData({ ...formData, subtitle_color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
                  />
                  <span className="text-xs font-mono text-slate-500 uppercase">{formData.subtitle_color}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formData.sticky_header}
                    onChange={(e) => setFormData({ ...formData, sticky_header: e.target.checked })}
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${formData.sticky_header ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                  <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.sticky_header ? 'translate-x-4' : ''}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Header Fixe (Sticky)</p>
                  <p className="text-[10px] text-slate-500">Le menu reste visible en haut de l'écran lors du défilement.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={formData.sticky_footer}
                    onChange={(e) => setFormData({ ...formData, sticky_footer: e.target.checked })}
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${formData.sticky_footer ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                  <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.sticky_footer ? 'translate-x-4' : ''}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Footer Fixe (Sticky)</p>
                  <p className="text-[10px] text-slate-500">Le bas de page reste visible en bas de l'écran.</p>
                </div>
              </label>
            </div>
          </div>


        </div>

        <div className="pt-6 border-t border-slate-100 space-y-6">
          <h3 className="text-lg font-bold text-slate-800">🖼️ Bandeau des Sponsors</h3>
          <p className="text-xs text-slate-400">Personnalisez la couleur de fond du bandeau et gérez les logos de vos sponsors/partenaires qui défilent en haut du site.</p>

          {/* Color picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 uppercase">Couleur de fond du bandeau</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.sponsor_bar_color}
                onChange={(e) => setFormData({ ...formData, sponsor_bar_color: e.target.value })}
                className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
              />
              <span className="text-xs font-mono text-slate-500 uppercase">{formData.sponsor_bar_color}</span>
            </div>
          </div>

          {/* Duration slider/input */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 uppercase">Durée d'affichage (Secondes)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={parseFloat(formData.sponsor_duration || '3000') / 1000}
                  onChange={(e) => {
                    const sec = parseFloat(e.target.value);
                    if (!isNaN(sec)) {
                      setFormData(prev => ({ ...prev, sponsor_duration: (Math.round(sec * 10) * 100).toString() }));
                    }
                  }}
                  className="w-20 text-center text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">sec</span>
              </div>
            </div>
            <input
              type="range"
              min="500"
              max="10000"
              step="100"
              value={formData.sponsor_duration}
              onChange={(e) => setFormData({ ...formData, sponsor_duration: e.target.value })}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[10px] text-slate-400">Définit le temps pendant lequel chaque logo reste à l'écran avant de passer au suivant. (Ex: 3.5s)</p>
          </div>

          {/* Current logos grid */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-600 uppercase">Logos actuels</label>
            {getSponsorImages().length === 0 ? (
              <p className="text-xs text-slate-400 italic">Aucun logo — les logos par défaut seront affichés.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {getSponsorImages().map((img, idx) => (
                  <div key={idx} className="relative group bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col items-center gap-2">
                    <img src={img.url} alt={img.alt} className="h-10 object-contain w-full grayscale group-hover:grayscale-0 transition-all" />
                    <span className="text-[10px] text-slate-500 text-center truncate w-full">{img.alt}</span>
                    <button
                      type="button"
                      onClick={() => removeSponsor(idx)}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-rose-600"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new sponsor */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3 border border-slate-200">
            <label className="text-xs font-bold text-slate-600 uppercase">➕ Ajouter un logo</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold">Nom / Étiquette</label>
                <input
                  type="text"
                  placeholder="Ex: Rip Curl"
                  value={newSponsorAlt}
                  onChange={(e) => setNewSponsorAlt(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-semibold">URL du logo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={newSponsorUrl}
                    onChange={(e) => setNewSponsorUrl(e.target.value)}
                    className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                  <button
                    type="button"
                    onClick={() => addSponsor(newSponsorUrl, newSponsorAlt)}
                    className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} /> Ajouter
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-semibold">Ou importer depuis votre ordinateur</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => addSponsor(reader.result as string, newSponsorAlt || file.name.split('.')[0]);
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer"
              />
            </div>
          </div>
        </div>



        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <Button type="submit" className="px-12 py-4 text-lg shadow-lg shadow-indigo-100">
            Enregistrer les modifications
          </Button>
        </div>
      </form >
    </Card >
  );
}


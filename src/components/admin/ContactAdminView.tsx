import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, ChevronDown, ChevronRight, Calendar, TrendingUp, DollarSign, Settings,
  LogOut, Package, BarChart3, FileText, ShoppingBag, Wallet, BookOpen, Waves,
  Plus, Edit2, Trash2, Check, X, RefreshCcw, Download, Upload, ImageIcon,
  Bell, Menu, MessageSquare, MapPin, UserCheck, CreditCard, AlertTriangle, Shield, Eye, EyeOff,
  Activity, LayoutGrid, List, Grid, Star, Award, Clock, Info, Lock, Anchor, Ship, Share2
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


import { uploadMedia } from '../../utils/upload';

export function ContactAdminView({ content, onUpdate, user, onUpdateContent }: { content: LandingPageContent[], onUpdate: (params?: any) => Promise<void>, user: User, onUpdateContent: (section: string, data: any) => Promise<void> }) {
  const contactData = content.find(c => c.section === 'contact') || {
    section: 'contact',
    title: 'Nous Contacter',
    content: JSON.stringify({
      address: '',
      phone: '',
      email: '',
      facebook: '',
      instagram: '',
      twitter: '',
      whatsapp: '',
      youtube: ''
    }),
    image_url: ''
  };
  const [formData, setFormData] = useState(() => {
    try {
      return JSON.parse(contactData.content);
    } catch (e) {
      return { address: '', phone: '', email: '', facebook: '', instagram: '', twitter: '', whatsapp: '', youtube: '' };
    }
  });

  const [imageUrl, setImageUrl] = useState(contactData.image_url || '');
  const [showConfig, setShowConfig] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = await uploadMedia(file);
    if (data) {
      setImageUrl(data.url);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateContent('contact', {
      ...contactData,
      content: JSON.stringify(formData),
      image_url: imageUrl
    });
    alert('Informations de contact enregistrées !');
  };

  const sectionData = (content || []).find(c => c.section === 'contact') || { 
    section: 'contact', 
    button_label: 'Contact', 
    is_active: true,
    section_button_label: 'Envoyer le message',
    cta1_bg_color: '#4f46e5',
    cta1_text_color: '#ffffff',
    content_style: 'centered'
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Contact & Réseaux Sociaux</h3>
        <div className="flex items-center gap-2">
          {hasPermission(user, 'change_landing_page') && (
            <>
              <Button variant="secondary" onClick={() => setShowConfig(!showConfig)}>
                <Settings size={18} /> Configuration
              </Button>
              <Button onClick={handleSubmit}><Check size={18} /> Enregistrer Tout</Button>
            </>
          )}
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
            <Card className="p-6 mb-6 border-indigo-100 bg-indigo-50/10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  <div className="flex-1">
                    <Input
                      label="Nom du bouton (Menu)"
                      defaultValue={sectionData.button_label}
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        const newVal = e.target.value;
                        if (newVal !== sectionData.button_label) {
                          onUpdateContent('contact', { ...sectionData, button_label: newVal });
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      label="Nom du bouton d'envoi"
                      defaultValue={sectionData.section_button_label || 'Envoyer le message'}
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        const newVal = e.target.value;
                        if (newVal !== sectionData.section_button_label) {
                          onUpdateContent('contact', { ...sectionData, section_button_label: newVal });
                        }
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Fond Bouton</label>
                      <input
                        type="color"
                        defaultValue={sectionData.cta1_bg_color || '#4f46e5'}
                        onBlur={(e) => {
                          const newVal = e.target.value;
                          if (newVal !== sectionData.cta1_bg_color) {
                            onUpdateContent('contact', { ...sectionData, cta1_bg_color: newVal });
                          }
                        }}
                        className="w-full h-9 rounded-lg cursor-pointer border border-slate-200"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1">Texte Bouton</label>
                      <input
                        type="color"
                        defaultValue={sectionData.cta1_text_color || '#ffffff'}
                        onBlur={(e) => {
                          const newVal = e.target.value;
                          if (newVal !== sectionData.cta1_text_color) {
                            onUpdateContent('contact', { ...sectionData, cta1_text_color: newVal });
                          }
                        }}
                        className="w-full h-9 rounded-lg cursor-pointer border border-slate-200"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">Visibilité Publique</label>
                    <button
                      type="button"
                      onClick={() => onUpdateContent('contact', { ...sectionData, is_active: !sectionData.is_active })}
                      className={`w-12 h-6 rounded-full relative transition-colors ${sectionData.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${sectionData.is_active ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-indigo-100/50">
                  <div className="max-w-xs transition-all">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-1 block">Style d'affichage de l'image</label>
                    <select
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      defaultValue={sectionData.content_style || 'centered'}
                      onChange={(e) => onUpdateContent('contact', { ...sectionData, content_style: e.target.value })}
                    >
                      <option value="centered">Centrée (Défaut)</option>
                      <option value="section_bg">Arrière-plan Section</option>
                      <option value="form_bg">Arrière-plan Formulaire</option>
                    </select>
                  </div>
                </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 space-y-4">
          <h4 className="font-bold text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
            <MapPin size={16} className="text-indigo-600" /> Coordonnées
          </h4>
          <div className="space-y-4">
            <Input label="Adresse" value={formData.address} onChange={(e: any) => setFormData({ ...formData, address: e.target.value })} />
            <Input label="Téléphone" value={formData.phone} onChange={(e: any) => setFormData({ ...formData, phone: e.target.value })} />
            <Input label="Email" value={formData.email} onChange={(e: any) => setFormData({ ...formData, email: e.target.value })} />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h4 className="font-bold text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
            <Share2 size={16} className="text-indigo-600" /> Réseaux Sociaux
          </h4>
          <div className="space-y-4">
            <Input label="WhatsApp (numéro)" value={formData.whatsapp || ''} onChange={(e: any) => setFormData({ ...formData, whatsapp: e.target.value })} />
            <Input label="Instagram (URL)" value={formData.instagram || ''} onChange={(e: any) => setFormData({ ...formData, instagram: e.target.value })} />
            <Input label="Facebook (URL)" value={formData.facebook || ''} onChange={(e: any) => setFormData({ ...formData, facebook: e.target.value })} />
            <Input label="Twitter / X (URL)" value={formData.twitter || ''} onChange={(e: any) => setFormData({ ...formData, twitter: e.target.value })} />
            <Input label="Chaîne YouTube (URL)" value={formData.youtube || ''} onChange={(e: any) => setFormData({ ...formData, youtube: e.target.value })} />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h4 className="font-bold text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
            <ImageIcon size={16} className="text-indigo-600" /> Image Centrale (Optionnel)
          </h4>
          <p className="text-xs text-slate-500 mb-2">Cette image remplacera le logo principal au centre de la page Contact.</p>
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <Input className="flex-1" placeholder="URL de l'image" value={imageUrl} onChange={(e: any) => setImageUrl(e.target.value)} />
              <div className="relative">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <Button variant="secondary"><Upload size={16} /></Button>
              </div>
            </div>
            {imageUrl && (
              <div className="aspect-video rounded-xl overflow-hidden mt-4 border border-slate-200">
                <img src={imageUrl} alt="Background Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}




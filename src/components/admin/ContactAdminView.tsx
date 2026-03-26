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
    })
  };
  const [formData, setFormData] = useState(() => {
    try {
      return JSON.parse(contactData.content);
    } catch (e) {
      return { address: '', phone: '', email: '', facebook: '', instagram: '', twitter: '', whatsapp: '', youtube: '' };
    }
  });

  const [showConfig, setShowConfig] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateContent('contact', {
      ...contactData,
      content: JSON.stringify(formData)
    });
    alert('Informations de contact enregistrées !');
  };

  const sectionData = (content || []).find(c => c.section === 'contact') || { section: 'contact', button_label: 'Contact', is_active: true };

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
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 w-full">
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
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h4 className="font-bold text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
            <MapPin size={16} className="text-indigo-600" /> Coordonnées
          </h4>
          <div className="space-y-4">
            <Input label="Adresse" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            <Input label="Téléphone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            <Input label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h4 className="font-bold text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
            <Share2 size={16} className="text-indigo-600" /> Réseaux Sociaux
          </h4>
          <div className="space-y-4">
            <Input label="WhatsApp (numéro)" value={formData.whatsapp || ''} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} />
            <Input label="Instagram (URL)" value={formData.instagram || ''} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} />
            <Input label="Facebook (URL)" value={formData.facebook || ''} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} />
            <Input label="Twitter / X (URL)" value={formData.twitter || ''} onChange={(e) => setFormData({ ...formData, twitter: e.target.value })} />
            <Input label="Chaîne YouTube (URL)" value={formData.youtube || ''} onChange={(e) => setFormData({ ...formData, youtube: e.target.value })} />
          </div>
        </Card>
      </div>
    </div>
  );
}




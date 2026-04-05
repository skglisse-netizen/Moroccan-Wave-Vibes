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
  LandingPageContent, ContactMessage, DashboardStats, Group
} from '../../types';

const ITEMS_PER_PAGE = 10;

function hasPermission(user: User, codename: string): boolean {
  if (!user) return false;
  if (user.role === 'administrateur') return true;
  return user.permissions?.includes(codename) ?? false;
}

import { Button, Input, Select, Card, Pagination, Modal } from './UIComponents';


export function UsersView({ users, onUpdate, user }: { users: User[], onUpdate: () => void, user: User }) {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'utilisateur', group_ids: [] as number[] });

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.username || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedData = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/groups', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
      }
    } catch (e) { console.error(e); }
  };

  (window as any).showModal = (show: boolean) => {
    if (show) {
      setEditingItem(null);
      setFormData({ username: '', password: '', role: 'utilisateur', group_ids: [] });
    }
    setShowModal(show);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem ? `/api/users/${editingItem.id}` : '/api/users';
    const method = editingItem ? 'PUT' : 'POST';
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      if (res.ok) {
        setShowModal(false);
        onUpdate();
        setFormData({ username: '', password: '', role: 'utilisateur', group_ids: [] });
        setEditingItem(null);
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    const token = localStorage.getItem('auth_token');
    await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {hasPermission(user, 'add_users') && (
          <button
            onClick={() => (window as any).showModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm font-bold"
          >
            <Plus size={16} /> Nouvel utilisateur
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
                    <span>Username</span>
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
                    <span>Rôle</span>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal"
                    >
                      <option value="">Tous</option>
                      <option value="administrateur">Administrateur</option>
                      <option value="utilisateur">Utilisateur</option>
                    </select>
                  </div>
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Groupes</th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      {(searchTerm || roleFilter) && (
                        <button
                          onClick={() => { setSearchTerm(''); setRoleFilter(''); }}
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
              {paginatedData?.filter(u => u.username !== 'SuperAdmin').map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-4 py-2 text-[11px] font-semibold text-slate-900">{u.username}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${u.role === 'administrateur' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'}`}>
                      {u.role === 'administrateur' ? 'Administrateur' : 'Utilisateur'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {groups.filter(g => u.group_ids?.includes(g.id)).map(g => (
                        <span key={g.id} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-medium border border-slate-200">
                          {g.name}
                        </span>
                      ))}
                      {(!u.group_ids || u.group_ids.length === 0) && <span className="text-slate-300 text-[9px]">Aucun groupe</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.username !== 'SuperAdmin' && (
                        <>
                          {hasPermission(user, 'change_users') && (
                            <button onClick={() => {
                              setEditingItem(u);
                              setFormData({ username: u.username, password: '', role: u.role, group_ids: u.group_ids || [] });
                              setShowModal(true);
                            }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                              <Edit2 size={14} />
                            </button>
                          )}
                          {hasPermission(user, 'delete_users') && (
                            <button onClick={() => handleDelete(u.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
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
        <Modal title={editingItem ? "Modifier le compte" : "Nouvel utilisateur"} onClose={() => setShowModal(false)} maxWidth="max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required disabled={!!editingItem} />
            <Input label={editingItem ? "Nouveau mot de passe (optionnel)" : "Mot de passe"} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingItem} />

            <Select
              label="Groupe"
              value={formData.group_ids[0] || ''}
              onChange={(e) => setFormData({ ...formData, group_ids: e.target.value ? [parseInt(e.target.value)] : [] })}
              options={[
                { value: '', label: 'Aucun groupe' },
                ...groups.map(g => ({ value: g.id.toString(), label: g.name }))
              ]}
              required
            />
            <Button type="submit" className="w-full">{editingItem ? 'Mettre à jour' : 'Créer'}</Button>
          </form>
        </Modal>
      )}
    </div>
  );
}


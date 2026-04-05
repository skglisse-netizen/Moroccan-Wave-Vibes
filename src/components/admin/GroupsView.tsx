import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Plus, Edit2, Trash2, Check, X, RefreshCcw, Search, Lock, 
  ChevronRight, ChevronDown, Activity, Users, Calendar, TrendingUp, 
  TrendingDown, Package, FileText, Settings, Globe, MessageSquare, List
} from 'lucide-react';
import { Group, Permission, User } from '../../types';
import { Button, Input, Card, Modal } from './UIComponents';

export function GroupsView({ user, onUpdate }: { user: User, onUpdate: () => void }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({ name: '', permission_ids: [] as number[] });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const [groupsRes, permsRes] = await Promise.all([
        fetch('/api/groups', { headers: token ? { 'Authorization': `Bearer ${token}` } : {}, credentials: 'include' }),
        fetch('/api/permissions', { headers: token ? { 'Authorization': `Bearer ${token}` } : {}, credentials: 'include' })
      ]);
      
      if (groupsRes.ok && permsRes.ok) {
        setGroups(await groupsRes.json());
        setPermissions(await permsRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingGroup ? `/api/groups/${editingGroup.id}` : '/api/groups';
    const method = editingGroup ? 'PUT' : 'POST';
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
        fetchData();
        if (onUpdate) onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce groupe ? Les utilisateurs de ce groupe perdront leurs permissions associées.')) return;
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        credentials: 'include'
      });
      if (res.ok) {
        fetchData();
        if (onUpdate) onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const togglePermission = (id: number) => {
    setFormData(prev => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(id)
        ? prev.permission_ids.filter(pid => pid !== id)
        : [...prev.permission_ids, id]
    }));
  };

  // Group permissions by module
  const groupPermissionsByModule = () => {
    const modules: Record<string, Permission[]> = {};
    permissions.forEach(p => {
      const parts = p.codename.split('_');
      const moduleName = parts.length > 1 ? parts.slice(1).join('_') : 'system';
      if (!modules[moduleName]) modules[moduleName] = [];
      modules[moduleName].push(p);
    });
    return modules;
  };

  const moduleGroups = groupPermissionsByModule();
  
  const getModuleIcon = (mod: string) => {
    switch (mod) {
      case 'revenue': return <TrendingUp size={14} />;
      case 'expenses': return <TrendingDown size={14} />;
      case 'lessons': return <Calendar size={14} />;
      case 'clients': return <Users size={14} />;
      case 'staff': return <Activity size={14} />;
      case 'stock': return <Package size={14} />;
      case 'settings': return <Settings size={14} />;
      case 'landing_page': return <Globe size={14} />;
      case 'messages': return <MessageSquare size={14} />;
      case 'categories': return <List size={14} />;
      case 'reservations': return <Calendar size={14} />;
      default: return <Lock size={14} />;
    }
  };

  const getModuleLabel = (mod: string) => {
    const labels: Record<string, string> = {
      revenue: 'Revenus',
      expenses: 'Dépenses',
      lessons: 'Planning / Cours',
      clients: 'Clients',
      staff: 'Personnel',
      stock: 'Stock',
      debts: 'Dettes & Prêts',
      categories: 'Catégories',
      logs: 'Journaux (Logs)',
      users: 'Utilisateurs',
      groups: 'Groupes & Permissions',
      settings: 'Configuration',
      rentals: 'Locations',
      reservations: 'Réservations',
      messages: 'Messages',
      landing_page: 'Site Web',
      system: 'Système'
    };
    return labels[mod] || mod;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Groupes & Permissions</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Gérez les rôles et les accès autorisés par module</p>
        </div>
        <button
          onClick={() => {
            setEditingGroup(null);
            setFormData({ name: '', permission_ids: [] });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all text-sm font-bold"
        >
          <Plus size={18} /> Nouveau groupe
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCcw className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => (
            <Card key={group.id} className="p-6 flex flex-col h-full bg-white/80 hover:shadow-md transition-all border-2 border-transparent hover:border-indigo-100 group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 leading-none">{group.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {group.permissions?.length || 0} permissions actives
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingGroup(group);
                      setFormData({ 
                        name: group.name, 
                        permission_ids: (group.permissions as any[])?.map(p => p.id) || [] 
                      });
                      setShowModal(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(group.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-2 mb-4 overflow-y-auto max-h-48 scrollbar-premium pr-2">
                {group.permissions && (group.permissions as any[]).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(group.permissions as any[]).slice(0, 10).map(p => (
                      <span key={p.id} className="px-2 py-0.5 bg-slate-50 text-slate-600 rounded text-[9px] font-bold border border-slate-100 flex items-center gap-1">
                        <Check size={8} /> {p.name}
                      </span>
                    ))}
                    {(group.permissions as any[]).length > 10 && (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black border border-indigo-100">
                        +{(group.permissions as any[]).length - 10} autres
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Aucune permission définie</p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-black text-slate-500 uppercase">U</div>
                  <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-indigo-600 uppercase">A</div>
                </div>
                <button 
                  onClick={() => {
                    setEditingGroup(group);
                    setFormData({ 
                      name: group.name, 
                      permission_ids: (group.permissions as any[])?.map(p => p.id) || [] 
                    });
                    setShowModal(true);
                  }}
                  className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                >
                  Détails & Modifier
                </button>
              </div>
            </Card>
          ))}
          {groups.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center">
              <Shield size={48} className="mx-auto text-slate-200 mb-4" />
              <p className="text-slate-500 font-bold">Aucun groupe trouvé</p>
              <p className="text-slate-400 text-sm">Commencez par créer un groupe pour définir les accès de vos utilisateurs.</p>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <Modal 
          title={editingGroup ? `Modifier ${editingGroup.name}` : "Nouveau groupe de permissions"} 
          onClose={() => setShowModal(false)}
          maxWidth="max-w-4xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
              <Input 
                label="Nom du groupe" 
                placeholder="Ex: Maitre Nageur, Staff Accueil, Secrétariat..." 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-white"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Lock size={16} /> Définir les autorisations
                </h4>
                <div className="flex gap-2">
                   <button 
                    type="button"
                    onClick={() => {
                        const allIds = permissions.map(p => p.id);
                        setFormData({...formData, permission_ids: allIds});
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-widest"
                   >
                     Tout cocher
                   </button>
                   <button 
                    type="button"
                    onClick={() => setFormData({...formData, permission_ids: []})}
                    className="text-[10px] font-bold text-rose-600 hover:underline uppercase tracking-widest"
                   >
                     Tout décocher
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[50vh] pr-2 scrollbar-premium">
                {Object.entries(moduleGroups).map(([mod, perms]) => (
                  <div key={mod} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:border-indigo-100 transition-all">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-50">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
                        {getModuleIcon(mod)}
                      </div>
                      <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                        {getModuleLabel(mod)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {perms.map(p => (
                        <label key={p.id} className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer group transition-colors">
                          <div className="relative flex items-center">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={formData.permission_ids.includes(p.id)}
                              onChange={() => togglePermission(p.id)}
                            />
                            <div className="w-5 h-5 border-2 border-slate-200 rounded-lg group-hover:border-indigo-400 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                              <Check size={12} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                            </div>
                          </div>
                          <span className={`text-[11px] font-bold leading-tight ${formData.permission_ids.includes(p.id) ? 'text-indigo-900' : 'text-slate-500'}`}>
                            {p.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-100">
              <Button type="button" variant="secondary" className="flex-1 py-4" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button type="submit" variant="primary" className="flex-[2] py-4 shadow-xl shadow-indigo-100">
                {editingGroup ? 'Mettre à jour le groupe' : 'Créer le groupe de permissions'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

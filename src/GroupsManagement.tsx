import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Search, Plus, Trash2, Save, Check } from 'lucide-react';
import { Permission, Group } from './types';

interface GroupsManagementProps {
    onClose?: () => void;
}

export const GroupsManagement: React.FC<GroupsManagementProps> = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
    const [groupName, setGroupName] = useState('');
    const [chosenPermissionIds, setChosenPermissionIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [availableFilter, setAvailableFilter] = useState('');
    const [chosenFilter, setChosenFilter] = useState('');

    const [availableSelected, setAvailableSelected] = useState<number[]>([]);
    const [chosenSelected, setChosenSelected] = useState<number[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('auth_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        try {
            setLoading(true);
            const [groupsRes, permsRes] = await Promise.all([
                fetch('/api/groups', { credentials: 'include', headers }),
                fetch('/api/permissions', { credentials: 'include', headers })
            ]);
            const groupsData = await groupsRes.json();
            const permsData = await permsRes.json();
            setGroups(groupsData);
            setAllPermissions(permsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedGroup = groups.find(g => g.id === selectedGroupId);

    useEffect(() => {
        if (selectedGroup) {
            setGroupName(selectedGroup.name);
            setChosenPermissionIds(selectedGroup.permissions.map(p => p.id));
        } else {
            setGroupName('');
            setChosenPermissionIds([]);
        }
        setAvailableSelected([]);
        setChosenSelected([]);
    }, [selectedGroupId, groups]);

    const availablePermissions = allPermissions.filter(p => !chosenPermissionIds.includes(p.id));
    const chosenPermissions = allPermissions.filter(p => chosenPermissionIds.includes(p.id));

    const filteredAvailable = availablePermissions.filter(p =>
        p.name.toLowerCase().includes(availableFilter.toLowerCase()) ||
        p.codename.toLowerCase().includes(availableFilter.toLowerCase())
    );

    const filteredChosen = chosenPermissions.filter(p =>
        p.name.toLowerCase().includes(chosenFilter.toLowerCase()) ||
        p.codename.toLowerCase().includes(chosenFilter.toLowerCase())
    );

    const handleChoose = () => {
        if (availableSelected.length === 0) return;
        setChosenPermissionIds([...chosenPermissionIds, ...availableSelected]);
        setAvailableSelected([]);
    };

    const handleRemove = () => {
        if (chosenSelected.length === 0) return;
        setChosenPermissionIds(chosenPermissionIds.filter(id => !chosenSelected.includes(id)));
        setChosenSelected([]);
    };

    const handleChooseAll = () => {
        setChosenPermissionIds(allPermissions.map(p => p.id));
    };

    const handleRemoveAll = () => {
        setChosenPermissionIds([]);
    };

    const handleSave = async () => {
        if (!groupName.trim()) return;
        setSaving(true);
        try {
            const url = selectedGroupId ? `/api/groups/${selectedGroupId}` : '/api/groups';
            const method = selectedGroupId ? 'PUT' : 'POST';
            const token = localStorage.getItem('auth_token');

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    name: groupName,
                    permission_ids: chosenPermissionIds
                }),
                credentials: 'include'
            });

            if (res.ok) {
                await fetchData();
                if (!selectedGroupId) setSelectedGroupId(null);
                alert('Groupe enregistré avec succès');
            }
        } catch (error) {
            console.error('Error saving group:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedGroupId || !window.confirm('Voulez-vous vraiment supprimer ce groupe ?')) return;
        const token = localStorage.getItem('auth_token');
        try {
            const res = await fetch(`/api/groups/${selectedGroupId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (res.ok) {
                setSelectedGroupId(null);
                await fetchData();
            }
        } catch (error) {
            console.error('Error deleting group:', error);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Chargement...</div>;

    return (
        <div className="flex flex-col h-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            {/* Header */}

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Groups List Sidebar */}
                <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto scrollbar-premium p-4 flex flex-col gap-2 max-h-[200px] md:max-h-full">
                    <div className="px-4 py-4 mb-2 border-b border-slate-100 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Nom du groupe</span>
                            <button
                                onClick={() => setSelectedGroupId(null)}
                                className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all flex items-center justify-center shadow-sm"
                                title="Nouveau groupe"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Nom du groupe..."
                                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-white text-slate-700 font-medium"
                            />
                            {selectedGroupId && (
                                <button
                                    onClick={handleDelete}
                                    className="w-full py-2 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all flex items-center justify-center gap-2 text-xs font-bold shadow-sm"
                                >
                                    <Trash2 size={14} />
                                    Supprimer le groupe
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="my-4 border-t border-slate-100"></div>

                    {groups.map(group => (
                        <button
                            key={group.id}
                            onClick={() => setSelectedGroupId(group.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-medium ${selectedGroupId === group.id
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            {group.name}
                        </button>
                    ))}
                </div>

                {/* Permission Management Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col gap-6 w-full">
                    <div className="max-w-4xl w-full mx-auto flex flex-col gap-8">
                        {/* Group Name Input */}
                        <div className="hidden">
                            {/* Content moved to sidebar */}
                        </div>

                        {/* Horizontal Filter Control */}
                        <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[400px]">
                            {/* Available Permissions */}
                            <div className="flex-1 flex flex-col border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
                                <div className="p-4 bg-slate-50 border-b border-slate-200">
                                    <h3 className="text-sm font-bold text-slate-900">Permissions disponibles</h3>
                                    <div className="mt-2 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            value={availableFilter}
                                            onChange={(e) => setAvailableFilter(e.target.value)}
                                            placeholder="Filtrer..."
                                            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto scrollbar-premium p-2 space-y-1">
                                    {filteredAvailable.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => setAvailableSelected(prev =>
                                                prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                                            )}
                                            className={`px-3 py-2 rounded-lg cursor-pointer text-xs transition-all border ${availableSelected.includes(p.id)
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform translate-x-1'
                                                : 'text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-100'
                                                }`}
                                        >
                                            {p.name}
                                        </div>
                                    ))}
                                    {filteredAvailable.length === 0 && (
                                        <div className="p-4 text-center text-slate-400 text-xs italic">Aucune permission trouvée</div>
                                    )}
                                </div>
                                <button
                                    onClick={handleChooseAll}
                                    className="p-3 bg-white border-t border-slate-100 text-indigo-600 hover:text-indigo-700 text-xs font-bold transition-colors"
                                >
                                    Tout choisir
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-row lg:flex-col justify-center items-center gap-3 py-4 lg:py-0">
                                <button
                                    onClick={handleChoose}
                                    disabled={availableSelected.length === 0}
                                    className="p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                    title="Ajouter les permissions sélectionnées"
                                >
                                    <ChevronRight size={24} className="rotate-90 lg:rotate-0" />
                                </button>
                                <button
                                    onClick={handleRemove}
                                    disabled={chosenSelected.length === 0}
                                    className="p-3 rounded-xl bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 shadow-sm transition-all active:scale-95"
                                    title="Enlever les permissions sélectionnées"
                                >
                                    <ChevronLeft size={24} className="rotate-90 lg:rotate-0" />
                                </button>
                            </div>

                            {/* Chosen Permissions */}
                            <div className="flex-1 flex flex-col border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
                                <div className="p-4 bg-indigo-900 text-white">
                                    <h3 className="text-sm font-bold">Permissions choisies</h3>
                                    <div className="mt-2 relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                                        <input
                                            type="text"
                                            value={chosenFilter}
                                            onChange={(e) => setChosenFilter(e.target.value)}
                                            placeholder="Filtrer..."
                                            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg bg-indigo-800 border-none text-white placeholder:text-white/0 focus:ring-2 focus:ring-white/20"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto scrollbar-premium p-2 space-y-1">
                                    {filteredChosen.map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => setChosenSelected(prev =>
                                                prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                                            )}
                                            className={`px-3 py-2 rounded-lg cursor-pointer text-xs transition-all border ${chosenSelected.includes(p.id)
                                                ? 'bg-rose-500 text-white border-rose-500 shadow-md transform -translate-x-1'
                                                : 'text-slate-600 hover:bg-slate-50 border-transparent hover:border-slate-100'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{p.name}</span>
                                                <Check size={12} className="opacity-50" />
                                            </div>
                                        </div>
                                    ))}
                                    {filteredChosen.length === 0 && (
                                        <div className="p-4 text-center text-slate-400 text-xs italic">Aucune permission choisie</div>
                                    )}
                                </div>
                                <button
                                    onClick={handleRemoveAll}
                                    className="p-3 bg-white border-t border-slate-100 text-rose-600 hover:text-rose-700 text-xs font-bold transition-colors"
                                >
                                    Tout enlever
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                disabled={saving}
                                onClick={handleSave}
                                className="px-8 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? 'Enregistrement...' : (
                                    <>
                                        <Save size={20} />
                                        Enregistrer le groupe
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

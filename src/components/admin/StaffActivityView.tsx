import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    Users, Clock, Globe, Shield, Activity, RefreshCcw, LogOut, CheckCircle2, XCircle
} from 'lucide-react';
import { Card, Pagination } from './UIComponents';

const ITEMS_PER_PAGE = 20;

export function StaffActivityView() {
    const [activeStaff, setActiveStaff] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [totalHistory, setTotalHistory] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveStaff();
        fetchHistory();
        const interval = setInterval(fetchActiveStaff, 30000);
        return () => clearInterval(interval);
    }, [currentPage]);

    const fetchActiveStaff = async () => {
        try {
            const res = await fetch('/api/admin/staff/active', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            });
            if (res.ok) setActiveStaff(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/staff/history?page=${currentPage}&limit=${ITEMS_PER_PAGE}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setHistory(data.history);
                setTotalHistory(data.total);
            }
        } catch (e) { console.error(e); } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Live Staff Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-4 flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            <Activity size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900 tracking-tight">Staff en ligne</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Utilisateurs actifs en temps réel</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchActiveStaff}
                        className="p-2 text-slate-400 hover:text-indigo-600 transition-all rounded-lg hover:bg-slate-50"
                    >
                        <RefreshCcw size={16} />
                    </button>
                </div>

                {activeStaff.length > 0 ? activeStaff.map((s, idx) => (
                    <Card key={idx} className="p-4 border-2 border-emerald-50 bg-white/50 relative overflow-hidden group hover:scale-[1.02] transition-all">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full -mr-8 -mt-8" />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-lg border-2 border-white shadow-sm ring-2 ring-emerald-50">
                                {s.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <h4 className="font-black text-slate-900 text-sm truncate">{s.username}</h4>
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{s.role}</p>
                                <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                                    <Clock size={10} /> {format(new Date(s.lastSeen), 'HH:mm:ss')}
                                </p>
                            </div>
                        </div>
                    </Card>
                )) : (
                    <div className="lg:col-span-4 py-8 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                        <p className="text-sm font-black uppercase tracking-widest italic">Aucun personnel connecté</p>
                    </div>
                )}
            </div>

            {/* Connection History Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Clock size={18} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight">Historique des connexions</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Journal complet des accès</p>
                    </div>
                </div>

                <Card className="overflow-hidden border-2 border-slate-100">
                    <div className="overflow-x-auto scrollbar-premium">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Login</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Last Seen / Logout</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Lieu & Appareil</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {history.map((item) => {
                                    const isCurrent = !item.logout_at && (Date.now() - new Date(item.last_seen_at).getTime() < 300000);
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg ${isCurrent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'} flex items-center justify-center font-black text-xs border border-white shadow-sm`}>
                                                        {item.username.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900">{item.username}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-700">{format(new Date(item.login_at), 'dd/MM/yyyy')}</p>
                                                <p className="text-xs text-slate-500">{format(new Date(item.login_at), 'HH:mm:ss')}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.logout_at ? (
                                                    <>
                                                        <p className="text-sm font-bold text-slate-700">{format(new Date(item.logout_at), 'dd/MM/yyyy')}</p>
                                                        <p className="text-xs text-rose-500 font-bold">{format(new Date(item.logout_at), 'HH:mm:ss')} (Sortie)</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-sm font-bold text-slate-700">{format(new Date(item.last_seen_at), 'dd/MM/yyyy')}</p>
                                                        <p className="text-xs text-emerald-500 font-bold">{format(new Date(item.last_seen_at), 'HH:mm:ss')} (Actif)</p>
                                                    </>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <Globe size={12} className="text-slate-400" />
                                                        <span className="font-mono">{item.ip_address || 'Local'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate max-w-[200px]" title={item.user_agent}>
                                                        <Shield size={12} className="text-slate-300 flex-shrink-0" />
                                                        <span className="truncate">{item.user_agent || 'Navigateur'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.logout_at ? (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg w-fit">
                                                        <XCircle size={12} className="text-slate-400" />
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Déconnecté</span>
                                                    </div>
                                                ) : isCurrent ? (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 rounded-lg w-fit animate-pulse">
                                                        <CheckCircle2 size={12} className="text-emerald-600" />
                                                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">En ligne</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg w-fit">
                                                        <Clock size={12} className="text-amber-500" />
                                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Session Expirée</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>

                <Pagination
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalHistory / ITEMS_PER_PAGE)}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
}

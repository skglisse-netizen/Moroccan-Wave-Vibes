import React, { useState, useEffect } from 'react';
import {
    Calendar, ClipboardList, UserCheck, Users, Check, RotateCcw, ChevronDown, TrendingUp, TrendingDown, DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DashboardStats, User } from '../../types';
import { Card } from '../ui/Card';
import { Pagination } from '../ui/Pagination';
import { FinancialChart } from './FinancialChart';
import { StatCard } from './StatCard';
import { hasPermission } from '../../utils/permissions';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function VisitorChart({ history, activeCount, filter, onFilterChange, selectedMonth, onMonthChange, isDarkMode }: {
    history: any[],
    activeCount: number,
    filter: string,
    onFilterChange: (v: string) => void,
    selectedMonth: string,
    onMonthChange: (v: string) => void,
    isDarkMode?: boolean
}) {
    const formatDate = (name: string) => {
        if (filter === 'yearly') return name;
        if (filter === 'monthly') return name;
        return name; // name is handled by backend as day of month
    };

    return (
        <Card className="flex flex-col bg-white/80 border-white/50 overflow-hidden">
            <div className="p-4 border-b border-slate-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/30">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <Users size={16} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight leading-none">Trafic du Site</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Visiteurs uniques par période</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {filter === 'daily' && (
                        <div className="relative group mr-2">
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => onMonthChange(e.target.value)}
                                className="appearance-none h-8 px-3 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                    )}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {['daily', 'monthly', 'yearly'].map((f) => (
                            <button
                                key={f}
                                onClick={() => onFilterChange(f)}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {f === 'daily' ? 'Journalier' : f === 'monthly' ? 'Mensuel' : 'Annuel'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 h-[250px] w-full">
                {history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9'} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 10 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
                            />
                            <Tooltip
                                cursor={{ stroke: '#818cf8', strokeWidth: 1, strokeDasharray: '4 4' }}
                                contentStyle={{ 
                                    borderRadius: '16px', 
                                    border: 'none', 
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                    color: isDarkMode ? '#f8fafc' : '#0f172a'
                                }}
                                labelStyle={{ color: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="visitors"
                                name="Visiteurs"
                                stroke="#6366f1"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorVisits)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <Users size={32} className="mb-2 opacity-50" />
                        <p className="text-xs font-black uppercase tracking-widest">Aucune donnée de trafic</p>
                    </div>
                )}
            </div>
        </Card>
    );
}

export function DashboardView({ stats, onUpdate, user, isDarkMode, onNavigate }: { stats: DashboardStats | null, onUpdate: (params?: any) => void, user: User, isDarkMode?: boolean, onNavigate?: (tab: string) => void }) {
    const [currentPage, setCurrentPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [activeStaffCount, setActiveStaffCount] = useState(0);
    const itemsPerPage = 25;

    useEffect(() => {
        const fetchActiveStaff = async () => {
            try {
                const res = await fetch('/api/admin/staff/active', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setActiveStaffCount(data.length);
                }
            } catch (e) { }
        };
        fetchActiveStaff();
        const interval = setInterval(fetchActiveStaff, 30000);
        return () => clearInterval(interval);
    }, []);

    // Visitor Stats State
    const [visitorStats, setVisitorStats] = useState<{ activeCount: number, history: any[] } | null>(null);
    const [visitorFilter, setVisitorFilter] = useState('daily');
    const [visitorMonth, setVisitorMonth] = useState(format(new Date(), 'yyyy-MM'));

    useEffect(() => {
        const fetchVisitors = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                let query = `filter=${visitorFilter}`;
                if (visitorFilter === 'daily') {
                    const [year, month] = visitorMonth.split('-');
                    query += `&year=${year}&month=${month}`;
                }

                const res = await fetch(`/api/admin/stats/visitors?${query}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    }
                });
                if (res.ok) setVisitorStats(await res.json());
            } catch (e) { console.error(e); }
        };
        fetchVisitors();
        const interval = setInterval(fetchVisitors, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, [visitorFilter, visitorMonth]);

    useEffect(() => {
        onUpdate({
            date: selectedDate,
            status: statusFilter,
            offset: currentPage * itemsPerPage,
            limit: itemsPerPage
        });
    }, [currentPage, statusFilter, selectedDate]);

    if (!stats) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
    );

    const dailyRevenue = stats.dailyRevenue || 0;
    const dailyExpenses = stats.dailyExpenses || 0;
    const dailyProfit = dailyRevenue - dailyExpenses;
    const totalPages = Math.ceil((stats.totalLessonsToday || 0) / itemsPerPage);

    const handleStatusChange = async (lessonId: number, currentStatus: string) => {
        if (!hasPermission(user, 'complete_lessons')) {
            alert('Vous n\'avez pas la permission de marquer les cours comme réalisés');
            return;
        }
        const newStatus = currentStatus === 'scheduled' ? 'completed' : 'scheduled';
        const token = localStorage.getItem('auth_token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        await fetch(`/api/lessons/${lessonId}/status`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: newStatus }),
            credentials: 'include'
        });
        onUpdate(selectedDate);
    };

    return (
        <div className="space-y-4">
            {/* Refined Dashboard Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white/40 backdrop-blur-md p-3 rounded-2xl border border-slate-200/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Vue d'ensemble</h2>
                        <button 
                            onClick={() => onNavigate && onNavigate('staff_activity')}
                            className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-200 shadow-sm hover:bg-indigo-200 hover:text-indigo-800 transition-colors cursor-pointer"
                        >
                            <div className="relative flex items-center justify-center w-2 h-2">
                                <div className="absolute w-full h-full bg-indigo-500 rounded-full animate-ping opacity-75"></div>
                                <div className="relative w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            </div>
                            {activeStaffCount} Staff En Ligne
                        </button>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200 shadow-sm">
                            <div className="relative flex items-center justify-center w-2 h-2">
                                <div className="absolute w-full h-full bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                                <div className="relative w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            </div>
                            {visitorStats?.activeCount || 0} Visiteur{(visitorStats?.activeCount || 0) > 1 ? 's' : ''}
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={10} className="text-indigo-400" />
                        {selectedDate && !isNaN(new Date(selectedDate).getTime())
                            ? format(new Date(selectedDate), 'EEEE d MMMM yyyy', { locale: fr })
                            : "Chargement..."
                        }
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Quick Stats in Header */}
                    {(hasPermission(user, 'view_revenue') && hasPermission(user, 'view_expenses')) && (
                        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-slate-50/50 border border-slate-100 rounded-xl">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Bénéfice</p>
                                <p className={`text-xs font-black ${dailyProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{dailyProfit.toLocaleString()} DH</p>
                            </div>
                            <div className="w-[1px] h-6 bg-slate-200" />
                            <div className="text-center">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-tighter">Cours</p>
                                <p className="text-xs font-black text-indigo-600">{stats.totalLessonsToday || 0}</p>
                            </div>
                        </div>
                    )}

                    <div className="relative group">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="appearance-none h-9 pl-3 pr-8 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm group-hover:border-indigo-300 w-full sm:w-auto"
                        />
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-transform group-hover:rotate-180" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Main Dashboard Layout: Lessons (3/4) and Stats (1/4) */}
                <div className="lg:col-span-3 space-y-4">
                    <Card className="flex flex-col bg-white/80 border-white/50 h-fit">
                        <div className="p-4 border-b border-slate-100/50 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <ClipboardList size={16} />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-slate-900 tracking-tight leading-none">Cours du Jour</h3>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Planning détaillé</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
                                    className="h-10 text-xs font-bold border-slate-200 rounded-xl px-3 bg-white focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                                >
                                    <option value="">Tous les cours</option>
                                    <option value="scheduled">À réaliser</option>
                                    <option value="completed">Réalisés</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-2 overflow-y-auto scrollbar-premium h-[250px] max-h-[350px]">
                            {stats.todayLessons && stats.todayLessons.length > 0 ? (
                                <div className="space-y-1.5">
                                    {stats.todayLessons.map((lesson: any) => (
                                        <div key={lesson.id} className={`group flex items-center justify-between px-2 py-1.5 rounded-xl border transition-all duration-300 ${lesson.status === 'completed'
                                            ? 'bg-slate-50 border-slate-200 opacity-60 grayscale-[0.5]'
                                            : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-sm hover:shadow-indigo-500/5'
                                            }`}>
                                            <div className="flex items-center gap-2 flex-1">
                                                <div className={`w-7 h-7 rounded-lg flex flex-col items-center justify-center font-black shadow-sm transition-colors ${lesson.status === 'completed'
                                                    ? 'bg-slate-100 text-slate-400'
                                                    : 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white'
                                                    }`}>
                                                    <span className="text-[9px]">{lesson.time}</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-[11px] font-black uppercase tracking-tight truncate ${lesson.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                                        {lesson.title}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5 text-[8px] font-bold text-slate-500">
                                                        <div className="flex items-center gap-0.5">
                                                            <UserCheck size={8} className="text-indigo-400" />
                                                            {lesson.instructors?.map((i: any) => i.full_name).join(', ') || 'Non assigné'}
                                                        </div>
                                                        <div className="w-1 h-1 rounded-full bg-slate-300" />
                                                        <div className="flex items-center gap-0.5">
                                                            <Users size={8} className="text-indigo-400" />
                                                            {lesson.student_count} élèves
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 ml-2">
                                                <div className="hidden sm:flex flex-col items-end gap-0.5">
                                                    <span className={`px-1 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${lesson.type === 'group' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                                        {lesson.type === 'group' ? 'Collectif' : 'Prive'}
                                                    </span>
                                                    {lesson.status === 'completed' && (
                                                        <div className="flex items-center gap-1 text-[8px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">
                                                            <Check size={8} /> Validé
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleStatusChange(lesson.id, lesson.status)}
                                                    disabled={!hasPermission(user, 'complete_lessons')}
                                                    className={`w-6 h-6 rounded flex items-center justify-center transition-all ${lesson.status === 'completed'
                                                        ? 'bg-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white'
                                                        : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                                        } ${!hasPermission(user, 'complete_lessons') ? 'opacity-30 cursor-not-allowed' : ''} shadow-sm active:scale-90`}
                                                    title={lesson.status === 'completed' ? "Marquer comme à réaliser" : "Marquer comme réalisé"}
                                                >
                                                    {lesson.status === 'completed' ? <RotateCcw size={10} /> : <Check size={10} />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center py-16 text-slate-400 opacity-40">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                        <Calendar size={32} />
                                    </div>
                                    <p className="text-sm font-black uppercase tracking-widest">Aucun cours trouvé</p>
                                </div>
                            )}
                        </div>

                        {totalPages > 1 && (
                            <div className="p-4 border-t border-slate-100/50 bg-slate-50/20">
                                <Pagination currentPage={currentPage + 1} totalPages={totalPages} onPageChange={(p) => setCurrentPage(p - 1)} />
                            </div>
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-4">
                    {(hasPermission(user, 'view_revenue') || hasPermission(user, 'view_expenses')) && (
                        <div className="grid grid-cols-1 gap-4">
                            {hasPermission(user, 'view_revenue') && (
                                <StatCard
                                    label="Revenus du Jour"
                                    value={`${dailyRevenue.toLocaleString()}`}
                                    icon={<TrendingUp size={16} />}
                                    color="emerald"
                                />
                            )}
                            {hasPermission(user, 'view_expenses') && (
                                <StatCard
                                    label="Dépenses du Jour"
                                    value={`${dailyExpenses.toLocaleString()}`}
                                    icon={<TrendingDown size={16} />}
                                    color="rose"
                                />
                            )}
                            {(hasPermission(user, 'view_revenue') && hasPermission(user, 'view_expenses')) && (
                                <StatCard
                                    label="Bénéfice Net"
                                    value={`${dailyProfit.toLocaleString()}`}
                                    icon={dailyProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    color={dailyProfit >= 0 ? "emerald" : "rose"}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Performance Charts */}
            <div className="space-y-4">
                {(hasPermission(user, 'view_revenue') || hasPermission(user, 'view_expenses')) && (
                    <FinancialChart isDarkMode={isDarkMode} />
                )}

                <VisitorChart
                    history={visitorStats?.history || []}
                    activeCount={visitorStats?.activeCount || 0}
                    filter={visitorFilter}
                    onFilterChange={setVisitorFilter}
                    selectedMonth={visitorMonth}
                    onMonthChange={setVisitorMonth}
                    isDarkMode={isDarkMode}
                />
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card } from '../ui/Card';

export function FinancialChart({ isDarkMode }: { isDarkMode?: boolean }) {
    const [filter, setFilter] = useState('daily');
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [data, setData] = useState<any[]>([]);
    const [visibleLines, setVisibleLines] = useState({ revenue: true, expenses: true, profit: true });

    useEffect(() => {
        fetchData();
    }, [filter, selectedMonth]);

    const fetchData = async () => {
        const token = localStorage.getItem('auth_token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        try {
            let query = `filter=${filter}`;
            if (filter === 'daily') {
                const [year, month] = selectedMonth.split('-');
                query += `&year=${year}&month=${month}`;
            }
            const res = await fetch(`/api/stats/financial?${query}`, { credentials: 'include', headers });
            if (res.ok) {
                const financialData = await res.json();
                setData(financialData);
            }
        } catch (e) { console.error(e); }
    };

    return (
        <Card className="flex flex-col bg-white/80 border-white/50 overflow-hidden">
            <div className="p-4 border-b border-slate-100/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/30">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <TrendingUp size={16} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 tracking-tight leading-none">Performance Financière</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Revenus, dépenses et bénéfices</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {filter === 'daily' && (
                        <div className="relative group mr-2">
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="appearance-none h-8 px-3 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                    )}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {['daily', 'monthly', 'yearly'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {f === 'daily' ? 'Journalier' : f === 'monthly' ? 'Mensuel' : 'Annuel'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="px-4 py-2 border-b border-slate-50 overflow-x-auto">
                <div className="flex items-center gap-4 min-w-max">
                    <button
                        onClick={() => setVisibleLines(v => ({ ...v, revenue: !v.revenue }))}
                        className={`flex items-center gap-2 px-2 py-1 rounded-md transition-all border ${visibleLines.revenue ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400 grayscale'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${visibleLines.revenue ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-nowrap">Revenus</span>
                    </button>
                    <button
                        onClick={() => setVisibleLines(v => ({ ...v, expenses: !v.expenses }))}
                        className={`flex items-center gap-2 px-2 py-1 rounded-md transition-all border ${visibleLines.expenses ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-slate-50 border-slate-100 text-slate-400 grayscale'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${visibleLines.expenses ? 'bg-rose-500' : 'bg-slate-300'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-nowrap">Dépenses</span>
                    </button>
                    <button
                        onClick={() => setVisibleLines(v => ({ ...v, profit: !v.profit }))}
                        className={`flex items-center gap-2 px-2 py-1 rounded-md transition-all border ${visibleLines.profit ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-400 grayscale'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${visibleLines.profit ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-nowrap">Bénéfice</span>
                    </button>
                </div>
            </div>

            <div className="p-2 h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9'} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 10 }}
                            dy={10}
                            interval={0}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDarkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
                            tickFormatter={(value) => `${value.toLocaleString()}`}
                        />
                        <Tooltip
                            cursor={{ stroke: isDarkMode ? '#475569' : '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                            contentStyle={{ 
                                borderRadius: '16px', 
                                border: 'none', 
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                                color: isDarkMode ? '#f8fafc' : '#0f172a'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            name="Revenus"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            hide={!visibleLines.revenue}
                        />
                        <Line
                            type="monotone"
                            dataKey="expenses"
                            name="Dépenses"
                            stroke="#f43f5e"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            hide={!visibleLines.expenses}
                        />
                        <Line
                            type="monotone"
                            dataKey="profit"
                            name="Bénéfice"
                            stroke="#6366f1"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            hide={!visibleLines.profit}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

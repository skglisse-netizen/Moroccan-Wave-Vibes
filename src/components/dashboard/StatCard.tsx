import React from 'react';
import { Card } from '../ui/Card';

export function StatCard({ label, value, icon, trend, color, suffix = "DH" }: any) {
    const colors = {
        emerald: 'bg-emerald-50/50 text-emerald-600 border-emerald-100',
        rose: 'bg-rose-50/50 text-rose-600 border-rose-100',
        indigo: 'bg-indigo-50/50 text-indigo-600 border-indigo-100'
    };
    return (
        <Card className={`p-2.5 flex flex-col gap-2 group hover:scale-[1.02] border-2 ${colors[color as keyof typeof colors].split(' ')[2]} shadow-sm`}>
            <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:rotate-12 ${colors[color as keyof typeof colors].split(' ').slice(0, 2).join(' ')}`}>
                    {React.cloneElement(icon as React.ReactElement, { size: 16 })}
                </div>
                {trend && (
                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700`}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
                <h4 className="text-lg font-black text-slate-900 leading-none">{value} {suffix && <span className="text-[9px] text-slate-400 font-bold ml-0.5">{suffix}</span>}</h4>
            </div>
        </Card>
    );
}

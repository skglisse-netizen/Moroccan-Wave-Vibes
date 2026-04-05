import React from 'react';

export const Select = ({ label, options = [], ...props }: { label?: string, value?: any, onChange?: any, options?: any[], className?: string }) => (
    <div className="space-y-1">
        {label && <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>}
        <select
            {...props}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm"
        >
            {options?.map((opt: any) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

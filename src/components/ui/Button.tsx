import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', className = "", type = "button" }: any) => {
    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
        secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
        danger: 'bg-rose-500 text-white hover:bg-rose-600',
        outline: 'border border-slate-200 text-slate-600 hover:bg-slate-50'
    };
    return (
        <button
            type={type}
            onClick={onClick}
            className={`px-4 py-2 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2 ${variants[variant as keyof typeof variants]} ${className}`}
        >
            {children}
        </button>
    );
};

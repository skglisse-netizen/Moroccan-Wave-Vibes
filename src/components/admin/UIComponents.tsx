import React from 'react';
import { motion } from 'motion/react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export function Button({
  children,
  onClick,
  type = 'button',
  className = '',
  disabled = false,
  variant = 'default'
}: {
  children: React.ReactNode,
  onClick?: any,
  type?: 'button' | 'submit' | 'reset',
  className?: string,
  disabled?: boolean,
  variant?: string
}) {
  const base = 'px-4 py-2 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center gap-2';
  const variants: any = {
    default: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-200',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    outline: 'border border-slate-200 text-slate-600 hover:bg-slate-50',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${base} ${variants[variant] || variants.default} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  className = '',
  ...rest
}: {
  label?: string,
  value?: any,
  onChange?: any,
  type?: string,
  placeholder?: string,
  required?: boolean,
  className?: string,
  [key: string]: any
}) {
  return (
    <div className="space-y-1">
      {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm ${className}`}
        {...rest}
      />
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  className = '',
  required = false
}: {
  label?: string,
  value?: any,
  onChange?: any,
  options?: { value: any, label: string }[],
  className?: string,
  required?: boolean
}) {
  return (
    <div className="space-y-1">
      {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm ${className}`}
      >
        {options?.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function Card({ children, className = '', ...props }: { children: React.ReactNode, className?: string, [key: string]: any }) {
  return <div {...props} className={`bg-white rounded-2xl shadow-sm border border-slate-100 backdrop-blur-md ${className}`}>{children}</div>;
}

export function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages = [];
    const window = 1; // Number of pages to show around current

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - window && i <= currentPage + window)
      ) {
        pages.push(i);
      } else if (
        i === currentPage - window - 1 ||
        i === currentPage + window + 1
      ) {
        pages.push('...');
      }
    }
    return pages.filter((v, i, a) => v !== '...' || a[i - 1] !== '...');
  };

  const pages = getPages();

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 transition-all text-sm font-bold"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, i) => (
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-slate-300 font-black">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`min-w-[36px] h-9 px-2 rounded-xl text-xs font-black transition-all ${currentPage === p
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 cursor-default'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-indigo-600'
                }`}
            >
              {p}
            </button>
          )
        ))}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-20 transition-all text-sm font-bold"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

export function Modal({ title, children, onClose, maxWidth = "max-w-lg" }: { title?: string, children: React.ReactNode, onClose: () => void, maxWidth?: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full ${maxWidth} bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col backdrop-blur-xl`}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-all">
            <Plus size={24} className="rotate-45" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto scrollbar-premium">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

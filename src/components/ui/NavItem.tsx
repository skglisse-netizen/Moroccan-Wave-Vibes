import React from 'react';

export function NavItem({ icon, label, active, onClick, collapsed, isSubItem = false }: any) {
    return (
        <button
            onClick={onClick}
            className={`
        w-full flex items-center rounded-xl transition-all duration-300 group relative
        ${collapsed ? 'justify-center h-12 px-0' : 'gap-3 px-4 py-2.5'}
        ${active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }
        ${isSubItem && !collapsed ? 'pl-8 py-2' : ''}
      `}
            title={collapsed ? label : undefined}
        >
            <div className={`flex items-center justify-center ${collapsed ? 'w-10 h-10' : ''} ${active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'} shrink-0 transition-colors`}>
                {React.cloneElement(icon as React.ReactElement, { size: collapsed ? 22 : 20 })}
            </div>
            
            <div className={`overflow-hidden transition-all duration-300 flex items-center ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100 ml-1'}`}>
                <span className={`text-xs font-bold truncate uppercase tracking-widest whitespace-nowrap ${active ? 'text-white' : ''}`}>
                    {label}
                </span>
            </div>

            {collapsed && active && (
                <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />
            )}
        </button>
    );
}

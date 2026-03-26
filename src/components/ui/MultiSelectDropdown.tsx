import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronDown, Check } from 'lucide-react';

export const MultiSelectDropdown = ({ label, options, selected, onChange, placeholder }: { label?: string, options: any[], selected: number[], onChange: (selected: number[]) => void, placeholder?: string }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSelection = (id: number) => {
        const newSelected = selected.includes(id)
            ? selected.filter(sid => sid !== id)
            : [...selected, id];
        onChange(newSelected);
    };

    return (
        <div className="space-y-1 relative">
            {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 cursor-pointer flex items-center justify-between text-sm min-h-[42px]"
            >
                <div className="flex flex-wrap gap-1">
                    {selected.length > 0 ? (
                        selected.map((id: number) => {
                            const option = options.find((o: any) => o.id === id);
                            const displayName = option?.full_name || option?.label || option?.name || 'Inconnu';
                            return (
                                <span key={id} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1">
                                    {displayName}
                                    <X size={12} onClick={(e) => { e.stopPropagation(); toggleSelection(id); }} />
                                </span>
                            );
                        })
                    ) : (
                        <span className="text-slate-400">{placeholder || 'Sélectionner...'}</span>
                    )}
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-[70] max-h-60 overflow-y-auto p-2"
                        >
                            {options.map((option) => (
                                <div
                                    key={option.id}
                                    onClick={() => toggleSelection(option.id)}
                                    className={`p-2 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${selected.includes(option.id) ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'
                                        }`}
                                >
                                    <span className="text-sm font-medium">{option.full_name || option.label || option.name}</span>
                                    {selected.includes(option.id) && <Check size={14} />}
                                </div>
                            ))}
                            {options.length === 0 && (
                                <div className="p-4 text-center text-slate-400 text-sm italic">Aucune option disponible</div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

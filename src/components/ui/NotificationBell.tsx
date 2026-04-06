import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AppNotification } from '../../types';

export const NotificationBell = ({ notifications, onMarkRead, onTabChange, badge }: { 
    notifications: AppNotification[], 
    onMarkRead: (ids?: number[]) => void, 
    onTabChange: (tab: string) => void,
    badge?: number
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = badge !== undefined ? badge : notifications.filter(n => !n.is_read).length;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all relative"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => onMarkRead()}
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
                                    >
                                        Tout marquer lu
                                    </button>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Bell size={32} className="mx-auto text-slate-200 mb-2" />
                                        <p className="text-xs text-slate-400 font-medium">Aucune notification</p>
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => {
                                                if (n.link) {
                                                    const tab = n.link.split('/').pop();
                                                    if (tab) onTabChange(tab);
                                                }
                                                onMarkRead([n.id]);
                                                setIsOpen(false);
                                            }}
                                            className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer relative ${!n.is_read ? 'bg-indigo-50/30' : ''}`}
                                        >
                                            {!n.is_read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 rounded-full" />}
                                            <p className="text-xs font-bold text-slate-900 mb-0.5">{n.title}</p>
                                            <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{n.message}</p>
                                            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">
                                                {format(new Date(n.created_at), 'dd MMM, HH:mm', { locale: fr })}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

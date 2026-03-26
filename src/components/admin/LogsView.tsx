import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, ChevronDown, ChevronRight, Calendar, TrendingUp, DollarSign, Settings,
  LogOut, Package, BarChart3, FileText, ShoppingBag, Wallet, BookOpen, Waves,
  Plus, Edit2, Trash2, Check, X, RefreshCcw, Download, Upload, ImageIcon,
  Bell, Menu, MessageSquare, MapPin, UserCheck, CreditCard, AlertTriangle, Shield, Eye, EyeOff,
  Activity, LayoutGrid, List, Grid, Star, Award, Clock, Info, Lock, Anchor, Ship
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import L from 'leaflet';
import {
  Settings as AppSettings, User, Log
} from '../../types';
import { Button, Input, Select, Card, Pagination, Modal } from './UIComponents';

const ITEMS_PER_PAGE = 25;

function hasPermission(user: User, codename: string): boolean {
  if (!user) return false;
  if (user.role === 'administrateur') return true;
  return user.permissions?.includes(codename) ?? false;
}



export function LogsView({ logs: initialLogs }: { logs: Log[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [dateFilter, setDateFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [logs, setLogs] = useState<Log[]>(initialLogs);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, dateFilter, actionFilter, userFilter]);

  const fetchLogs = async () => {
    const token = localStorage.getItem('auth_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;
    const url = `/api/logs?limit=${ITEMS_PER_PAGE}&offset=${offset}${dateFilter ? `&date=${dateFilter}` : ''}${actionFilter ? `&action=${actionFilter}` : ''}${userFilter ? `&username=${userFilter}` : ''}`;
    try {
      const res = await fetch(url, { credentials: 'include', headers });
      if (res.ok) {
        const data = await res.json();
        if (data.logs) setLogs(data.logs);
        if (data.total !== undefined) setTotalCount(data.total);
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="overflow-x-auto max-h-[80vh] scrollbar-premium">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex flex-col gap-1.5">
                    <span>Date</span>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal lowercase"
                    />
                  </div>
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex flex-col gap-1.5">
                    <span>Utilisateur</span>
                    <input
                      type="text"
                      placeholder="Filtrer..."
                      value={userFilter}
                      onChange={(e) => setUserFilter(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal"
                    />
                  </div>
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex flex-col gap-1.5">
                    <span>Action</span>
                    <input
                      type="text"
                      placeholder="Filtrer..."
                      value={actionFilter}
                      onChange={(e) => setActionFilter(e.target.value)}
                      className="w-full text-[10px] border-slate-200 rounded-md bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 py-0.5 px-2 font-normal"
                    />
                  </div>
                </th>
                <th className="px-4 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      {(dateFilter || actionFilter || userFilter) && (
                        <button
                          onClick={() => { setDateFilter(''); setActionFilter(''); setUserFilter(''); }}
                          className="flex items-center gap-1 text-[10px] text-rose-600 hover:text-white hover:bg-rose-500 font-bold uppercase px-2 py-1 border border-rose-200 rounded-md transition-all shadow-sm"
                        >
                          <RefreshCcw size={10} />
                          Réinitialiser
                        </button>
                      )}
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs?.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-4 py-2 text-sm text-slate-600">
                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-4 py-2 text-sm font-semibold text-slate-900">{log.username}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-500 max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">Aucun log enregistré</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination currentPage={currentPage} totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)} onPageChange={setCurrentPage} />
    </div>
  );
}


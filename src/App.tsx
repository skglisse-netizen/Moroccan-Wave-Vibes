import React, { useState, useEffect } from 'react';
import LandingPage from './LandingPage';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  LogOut,
  Plus,
  Waves,
  ChevronRight,
  DollarSign,
  UserCheck,
  CheckCircle2,
  List,
  RotateCcw,
  Shield,
  ClipboardList,
  Tags,
  ChevronDown,
  Check,
  X,
  Settings,
  Download,
  ArrowRightLeft,
  FileText,
  Search,
  ChevronLeft,
  Anchor,
  Package,
  RefreshCcw,
  Menu,
  Bell,
  Image as ImageIcon,
  Database,
  MapPin,
  Mail,
  MailOpen,
  Globe,
  Lock,
  Moon,
  Sun,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  User, DashboardStats, Settings as AppSettings, AppNotification,
  LandingPageContent, PublicService, Spot, Conseil, ContactMessage
} from './types';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MessagesView,
  ReservationsView,
  ConseilsView,
  ServicesAdminView,
  AboutAdminView,
  RevenueView,
  ExpensesView,
  LessonsView,
  StaffView,
  StockView,
  DebtsLoansView,
  SettingsView,
  Modal,
  LogsView,
  BackupView,
  CategoriesView,
  UsersView,
  RentalsView,
  PurchaseHistoryModal,
  ClientsView,
  SpotsAdminView,
  ContactAdminView,
  GroupsView,
  StaffActivityView
} from './components/admin/index';

import { LocationPickerMap } from './components/admin/LocationPickerMap';


// Components imported from dedicated files
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { NotificationBell } from './components/ui/NotificationBell';
import { MultiSelectDropdown } from './components/ui/MultiSelectDropdown';
import { Pagination, ITEMS_PER_PAGE } from './components/ui/Pagination';
import { NavItem } from './components/ui/NavItem';
import { DashboardView } from './components/dashboard/DashboardView';
import { hasPermission } from './utils/permissions';

function LoginForm({ onLogin, initialError }: { onLogin: (user: User) => void, initialError?: string }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState(initialError || '');
  const [loading, setLoading] = React.useState(false);
  
  React.useEffect(() => {
    if (initialError) setError(initialError);
  }, [initialError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('auth_token', data.token);
        onLogin(data.user);
      } else {
        setError(data.error || 'Erreur de connexion');
      }
    } catch (err) {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <Waves size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Espace Staff</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Connectez-vous pour accéder au tableau de bord</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-bold border border-rose-100 flex items-center gap-2">
              <span className="font-bold flex-shrink-0">Erreur :</span> {error}
            </div>
          )}
          <Input label="Nom d'utilisateur" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <Input label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full py-3 text-sm" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
        <div className="mt-6 pt-6 border-t border-slate-50">
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 transition-all text-xs font-bold uppercase tracking-widest"
          >
            <Globe size={14} /> Retour au site public
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [showLogin, setShowLogin] = React.useState(false);
  const [loginMessage, setLoginMessage] = React.useState('');
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(() => localStorage.getItem('showPreview') === 'true');
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDarkMode, setIsDarkMode] = React.useState(() => localStorage.getItem('theme') === 'dark');
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => localStorage.getItem('sidebarCollapsed') === 'true');

  React.useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  React.useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  React.useEffect(() => {
    localStorage.setItem('showPreview', showPreview.toString());
  }, [showPreview]);

  // Sync browser Tab title and favicon
  React.useEffect(() => {
    if (settings?.app_name) {
      document.title = settings.app_name;
    }
    if (settings?.app_logo) {
      const favicon = document.getElementById('app-favicon') as HTMLLinkElement;
      if (favicon) {
        favicon.href = settings.app_logo;
      }
    }
  }, [settings?.app_name, settings?.app_logo]);

  // Re-added data states to feed extracted components
  const [messages, setMessages] = React.useState<any[]>([]);
  const [reservations, setReservations] = React.useState<any[]>([]);
  const [clients, setClients] = React.useState<any[]>([]);
  const [services, setServices] = React.useState<any[]>([]);
  const [lessons, setLessons] = React.useState<any[]>([]);
  const [staff, setStaff] = React.useState<any[]>([]);
  const [rentals, setRentals] = React.useState<any[]>([]);
  const [stock, setStock] = React.useState<any[]>([]);
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [revenue, setRevenue] = React.useState<any[]>([]);
  const [debtsLoans, setDebtsLoans] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [logs, setLogs] = React.useState<any[]>([]);
  const [conseils, setConseils] = React.useState<any[]>([]);
  const [spots, setSpots] = React.useState<any[]>([]);
  const [content, setContent] = React.useState<any[]>([]);

  const getSectionLabel = (section: string, defaultLabel: string) => {
    const data = content.find(c => c.section === section);
    const label = data?.button_label?.trim();
    return label || defaultLabel;
  };

  React.useEffect(() => {
    fetchSettings();
    checkAuth();
  }, []);

  React.useEffect(() => {
    if (user) {
      const ping = async () => {
        const token = localStorage.getItem('auth_token');
        try {
          await fetch('/api/auth/ping', {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
        } catch (e) { }
      };
      ping(); // Initial ping
      const interval = setInterval(ping, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const wsRetryRef = React.useRef(0);
  React.useEffect(() => {
    if (user && hasPermission(user, 'view_notifications')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}`);
      let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          setNotifications(prev => [notification, ...prev]);
        } catch (e) {
          console.error('Error parsing notification:', e);
        }
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(() => {
          wsRetryRef.current += 1;
        }, 5000);
      };

      return () => {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        ws.close();
      };
    }
  }, [user, wsRetryRef.current]);

  const handleLogout = async (message?: string) => {
    const token = localStorage.getItem('auth_token');
    if (message) setLoginMessage(message);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
    } catch (e) { }
    localStorage.removeItem('auth_token');
    setUser(null);
    setShowPreview(false);
    setShowLogin(true); // Ensure login form is shown if logged out
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) setSettings(await res.json());
    } catch (e) { console.error(e); }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/auth/me', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        fetchStats();
        fetchAllData();
        if (hasPermission(userData, 'view_notifications')) {
          loadData('/api/admin/notifications', setNotifications);
        }
      } else if (res.status === 401 && token) {
        // Token exists but server rejected it (session expired or invalidated)
        handleLogout("Votre session a expiré ou est invalide.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (endpoint: string, setter: (data: any) => void) => {
    try {
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        setter(await res.json());
      } else if (res.status === 401) {
        handleLogout("Session expirée. Veuillez vous reconnecter.");
      }
    } catch (e) { console.error(`Error loading ${endpoint}`, e); }
  };

  const handleUpdateContent = async (section: string, data: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch('/api/admin/landing-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ section, ...data }),
        credentials: 'include'
      });
      loadData('/api/public/content', (res: any) => {
        setContent(res.content || []);
        setConseils(res.conseils || []);
        setSpots(res.spots || []);
      });
    } catch (e) { console.error(e); }
  };

  const fetchAllData = async () => {
    loadData('/api/contact_messages', setMessages);
    loadData('/api/admin/reservations', setReservations);
    loadData('/api/clients', setClients);
    loadData('/api/admin/public-services', setServices);
    loadData('/api/lessons', setLessons);
    loadData('/api/staff', setStaff);
    loadData('/api/admin/rentals', setRentals);
    loadData('/api/stock', setStock);
    loadData('/api/expenses', setExpenses);
    loadData('/api/categories', setCategories);
    loadData('/api/revenue', setRevenue);
    loadData('/api/debts_loans', setDebtsLoans);
    loadData('/api/users', setUsers);
    loadData('/api/logs', (data: any) => setLogs(data.logs || []));
    loadData('/api/public/content', (data: any) => {
      setContent(data.content || []);
      setConseils(data.conseils || []);
      setSpots(data.spots || []);
    });
  };

  const fetchStats = async (params = {}) => {
    const token = localStorage.getItem('auth_token');
    const queryParams = new URLSearchParams(params as any).toString();
    try {
      const res = await fetch(`/api/stats?${queryParams}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        setStats(await res.json());
      } else if (res.status === 401) {
        handleLogout();
      }
    } catch (e) { console.error(e); }
  };


  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;

  if (showPreview) {
    return (
      <LandingPage
        onLoginClick={() => setShowLogin(true)}
        settings={settings || {} as AppSettings}
        isAdminPreview={true}
        onBackToAdmin={() => setShowPreview(false)}
      />
    );
  }

  if (!user) {
    if (showLogin) return (
      <LoginForm 
        onLogin={(u) => { 
          setUser(u); 
          setShowLogin(false); 
          setLoginMessage(''); 
          fetchStats(); 
          fetchAllData(); 
        }} 
        initialError={loginMessage}
      />
    );
    return <LandingPage onLoginClick={() => setShowLogin(true)} settings={settings || {} as AppSettings} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView stats={stats} onUpdate={fetchStats} user={user} isDarkMode={isDarkMode} onNavigate={setActiveTab} />;
      case 'messages': return <MessagesView messages={messages} onUpdate={fetchAllData} user={user} />;
      case 'reservations': return <ReservationsView reservations={reservations} services={services} onUpdate={fetchAllData} settings={settings as any} onUpdateSettings={fetchSettings} user={user} content={content} onUpdateContent={handleUpdateContent} />;
      case 'clients': return <ClientsView clients={clients} services={services} onUpdate={fetchAllData} user={user} />;
      case 'lessons': return <LessonsView lessons={lessons} staff={staff} clients={clients} onUpdate={fetchAllData} user={user} />;
      case 'rentals': return <RentalsView rentals={rentals} stock={stock} onUpdate={fetchAllData} user={user} />;
      case 'expenses': return <ExpensesView expenses={expenses} categories={categories} onUpdate={fetchAllData} user={user} />;
      case 'revenue': return <RevenueView revenue={revenue} categories={categories} onUpdate={fetchAllData} user={user} />;
      case 'debts_loans': return <DebtsLoansView debtsLoans={debtsLoans} onUpdate={fetchAllData} user={user} />;
      case 'stock': return <StockView stock={stock} categories={categories} onUpdate={fetchAllData} user={user} />;
      case 'staff': return <StaffView staff={staff} categories={categories} onUpdate={fetchAllData} user={user} />;
      case 'categories': return <CategoriesView categories={categories} onUpdate={fetchAllData} user={user} />;
      case 'users': return <UsersView users={users} onUpdate={fetchAllData} user={user} />;
      case 'groups': return <GroupsView user={user} onUpdate={fetchAllData} />;
      case 'logs': return <LogsView logs={logs} />;
      case 'staff_activity': return <StaffActivityView />;
      case 'backup': return <BackupView onUpdate={fetchAllData} />;
      case 'settings': return <SettingsView settings={settings as any} onUpdate={fetchSettings} content={content} onUpdateContent={handleUpdateContent} user={user} />;
      case 'site_about': return <AboutAdminView user={user} content={content} onUpdate={fetchAllData} onUpdateContent={handleUpdateContent} />;
      case 'site_services': return <ServicesAdminView user={user} services={services} onUpdate={fetchAllData} settings={settings as any} onUpdateSettings={fetchSettings} content={content} onUpdateContent={handleUpdateContent} />;
      case 'site_conseils': return <ConseilsView conseils={conseils} onUpdate={fetchAllData} settings={settings as any} onUpdateSettings={fetchSettings} user={user} content={content} onUpdateContent={handleUpdateContent} />;
      case 'site_spots': return <SpotsAdminView spots={spots} onUpdate={fetchAllData} settings={settings as any} onUpdateSettings={fetchSettings} user={user} content={content} onUpdateContent={handleUpdateContent} />;
      case 'site_contact': return <ContactAdminView user={user} content={content} onUpdate={fetchAllData} onUpdateContent={handleUpdateContent} />;
      default: return <DashboardView stats={stats} onUpdate={fetchStats} user={user} isDarkMode={isDarkMode} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${isDarkMode ? 'dark-dashboard' : ''}`}>
      {/* Fixed Global Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md border-b border-slate-200 z-[60] flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-xl">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3 pr-4 border-r border-slate-100 mr-2">
            {settings?.app_logo ? (
              <img src={settings.app_logo} alt="Logo" className={`h-8 w-auto ${isDarkMode ? 'invert hue-rotate-180 mix-blend-screen' : 'mix-blend-multiply'}`} />
            ) : (
              <Waves className="text-indigo-600" size={24} />
            )}
            <span className="font-black text-slate-800 uppercase tracking-tighter truncate max-w-[120px] sm:max-w-[200px] leading-none">
              {settings?.app_name || 'Mon Site'}
            </span>
          </div>
          <h1 className="hidden md:block text-xl font-black text-slate-900 capitalize tracking-tight ml-2">
            {activeTab.replace('site_', '').replace('_', ' ')}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
            title={isDarkMode ? 'Passer au mode clair' : 'Passer au mode sombre'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all font-bold text-[10px] sm:text-xs uppercase tracking-widest"
            title="Voir le site public"
          >
            <Globe size={18} /> <span className="hidden sm:inline">Voir le site</span>
          </button>
          {hasPermission(user, 'view_notifications') && (
            <NotificationBell
              notifications={notifications}
              onMarkRead={(ids) => {
                const token = localStorage.getItem('auth_token');
                fetch('/api/admin/notifications/mark-read', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                  },
                  body: JSON.stringify({ ids }),
                  credentials: 'include'
                }).then(res => {
                  if (res.ok) {
                    setNotifications(prev => prev.map(n =>
                      !ids || ids.includes(n.id) ? { ...n, is_read: true } : n
                    ));
                  }
                });
              }}
              onTabChange={setActiveTab}
            />
          )}
        </div>
      </header>

      {/* Main Content Area (Sidebar + Content) */}
      <div className="flex pt-14 flex-1">
        {/* Navigation Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-14 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
        )}
        <aside 
          className={`fixed lg:sticky top-14 left-0 z-50 ${sidebarCollapsed ? 'w-20' : 'w-64'} h-[calc(100vh-3.5rem)] bg-white border-r border-slate-200 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-all duration-300 flex flex-col backdrop-blur-md overflow-hidden`}
        >
          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden lg:flex absolute -right-3.5 top-8 w-7 h-7 bg-indigo-600 border border-indigo-500 rounded-full items-center justify-center text-white shadow-md z-50 transition-all hover:scale-110 hover:bg-indigo-700 ${sidebarCollapsed ? 'rotate-180' : ''}`}
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-premium">
            <NavItem icon={<LayoutDashboard size={20} />} label="Tableau de bord" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
            {hasPermission(user, 'view_messages') && <NavItem icon={<Mail size={20} />} label={getSectionLabel('contact', 'Messages Contact')} active={activeTab === 'messages'} onClick={() => { setActiveTab('messages'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />}
            {hasPermission(user, 'view_reservations') && <NavItem icon={<Calendar size={20} />} label={getSectionLabel('reserve', 'Réservations')} active={activeTab === 'reservations'} onClick={() => { setActiveTab('reservations'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />}
            <div className="my-2 border-t border-slate-100" />
            <div className={`flex items-center transition-all duration-300 ${sidebarCollapsed ? 'justify-center py-2' : 'px-4 py-2'}`}>
              <span className={`text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                Gestion
              </span>
              {sidebarCollapsed && <div className="w-4 h-px bg-slate-200" />}
            </div>
            {hasPermission(user, 'view_clients') && <NavItem icon={<Users size={20} />} label="Clients" active={activeTab === 'clients'} onClick={() => { setActiveTab('clients'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />}
            {hasPermission(user, 'view_lessons') && <NavItem icon={<Waves size={20} />} label="Cours" active={activeTab === 'lessons'} onClick={() => { setActiveTab('lessons'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />}
            {hasPermission(user, 'view_rentals') && <NavItem icon={<Package size={20} />} label="Locations" active={activeTab === 'rentals'} onClick={() => { setActiveTab('rentals'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />}
            <div className="my-2 border-t border-slate-100" />
            <div className={`flex items-center transition-all duration-300 ${sidebarCollapsed ? 'justify-center py-2' : 'px-4 py-2'}`}>
              <span className={`text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                Finances & Stock
              </span>
              {sidebarCollapsed && <div className="w-4 h-px bg-slate-200" />}
            </div>
            {hasPermission(user, 'view_revenue') && <NavItem icon={<TrendingUp size={20} />} label="Revenus" active={activeTab === 'revenue'} onClick={() => { setActiveTab('revenue'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />}
            {hasPermission(user, 'view_expenses') && <NavItem icon={<TrendingDown size={20} />} label="Dépenses" active={activeTab === 'expenses'} onClick={() => { setActiveTab('expenses'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />}
            {hasPermission(user, 'view_debts_loans') && <NavItem icon={<ArrowRightLeft size={20} />} label="Dettes / Prêts" active={activeTab === 'debts_loans'} onClick={() => { setActiveTab('debts_loans'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />}
            {hasPermission(user, 'view_stock') && <NavItem icon={<Tags size={20} />} label="Stock" active={activeTab === 'stock'} onClick={() => { setActiveTab('stock'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />}
            <div className="my-2 border-t border-slate-100" />
            <div className={`flex items-center transition-all duration-300 ${sidebarCollapsed ? 'justify-center py-2' : 'px-4 py-2'}`}>
              <span className={`text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 ${sidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                Administration
              </span>
              {sidebarCollapsed && <div className="w-4 h-px bg-slate-200" />}
            </div>
            {hasPermission(user, 'view_staff') && <NavItem icon={<UserCheck size={20} />} label="Staff" active={activeTab === 'staff'} onClick={() => { setActiveTab('staff'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />}
            {hasPermission(user, 'view_categories') && <NavItem icon={<List size={20} />} label="Catégories" active={activeTab === 'categories'} onClick={() => { setActiveTab('categories'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />}
            {hasPermission(user, 'view_users') && <NavItem icon={<Shield size={20} />} label="Utilisateurs" active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />}
            {hasPermission(user, 'view_groups') && <NavItem icon={<Lock size={20} />} label="Groupes & Permissions" active={activeTab === 'groups'} onClick={() => { setActiveTab('groups'); setMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />}
            {hasPermission(user, 'change_landing_page') && (
              <>
                <NavItem icon={<Globe size={20} />} label="Site Web" active={activeTab.startsWith('site_')} onClick={() => { setActiveTab('site_about'); }} collapsed={sidebarCollapsed} />
                {activeTab.startsWith('site_') && !sidebarCollapsed && (
                  <div className="mt-1 border-l-2 border-slate-100 space-y-1 ml-4 pl-2 transition-all duration-300">
                    <NavItem icon={<FileText size={16} />} label={getSectionLabel('about', '')} active={activeTab === 'site_about'} onClick={() => { setActiveTab('site_about'); setMobileMenuOpen(false); }} isSubItem={true} collapsed={sidebarCollapsed} />
                    <NavItem icon={<Tags size={16} />} label={getSectionLabel('services', 'Services')} active={activeTab === 'site_services'} onClick={() => { setActiveTab('site_services'); setMobileMenuOpen(false); }} isSubItem={true} collapsed={sidebarCollapsed} />
                    <NavItem icon={<Calendar size={16} />} label={getSectionLabel('reserve', 'Réservations')} active={activeTab === 'reservations'} onClick={() => { setActiveTab('reservations'); setMobileMenuOpen(false); }} isSubItem={true} collapsed={sidebarCollapsed} />
                    <NavItem icon={<ImageIcon size={16} />} label={getSectionLabel('conseils', 'Conseils')} active={activeTab === 'site_conseils'} onClick={() => { setActiveTab('site_conseils'); setMobileMenuOpen(false); }} isSubItem={true} collapsed={sidebarCollapsed} />
                    <NavItem icon={<MapPin size={16} />} label={getSectionLabel('spots', 'Spots')} active={activeTab === 'site_spots'} onClick={() => { setActiveTab('site_spots'); setMobileMenuOpen(false); }} isSubItem={true} collapsed={sidebarCollapsed} />
                    <NavItem icon={<MailOpen size={16} />} label={getSectionLabel('contact', 'Contact')} active={activeTab === 'site_contact'} onClick={() => { setActiveTab('site_contact'); setMobileMenuOpen(false); }} isSubItem={true} collapsed={sidebarCollapsed} />
                  </div>
                )}
              </>
            )}
            {hasPermission(user, 'change_settings') && <NavItem icon={<Settings size={20} />} label="Paramètres" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }} />}
            {hasPermission(user, 'view_logs') && <NavItem icon={<ClipboardList size={20} />} label="Logs Actions" active={activeTab === 'logs'} onClick={() => { setActiveTab('logs'); setMobileMenuOpen(false); }} />}
            {hasPermission(user, 'view_logs') && <NavItem icon={<Activity size={20} />} label="Activités Staff" active={activeTab === 'staff_activity'} onClick={() => { setActiveTab('staff_activity'); setMobileMenuOpen(false); }} />}
            {user.role === 'administrateur' && <NavItem icon={<Database size={20} />} label="Sauvegardes" active={activeTab === 'backup'} onClick={() => { setActiveTab('backup'); setMobileMenuOpen(false); }} />}
          </div>

          <div className={`p-4 border-t border-slate-100 flex items-center transition-all duration-300 ${sidebarCollapsed ? 'justify-center' : 'justify-between gap-2'}`}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3 min-w-0 transition-all duration-300 opacity-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex-shrink-0 flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-100">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 transition-all duration-300 w-auto opacity-100">
                  <p className="text-sm font-black text-slate-800 truncate leading-tight">{user.username}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest truncate leading-tight">{user.role}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all ${sidebarCollapsed ? 'w-full flex items-center justify-center' : ''}`}
              title="Déconnexion"
            >
              <LogOut size={20} />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className={`flex-1 p-4 lg:p-8 overflow-x-hidden transition-all duration-300 ${(!sidebarCollapsed && mobileMenuOpen) ? 'blur-sm lg:blur-none' : ''}`}>
          {renderContent()}
        </main>
      </div>

    </div>
  );
}


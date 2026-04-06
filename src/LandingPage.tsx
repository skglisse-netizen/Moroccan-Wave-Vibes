import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Waves, Wind, CheckCircle2, Plus, Minus, MapPin, Mail, Phone, Instagram, Facebook, Twitter, Send, LayoutDashboard, Navigation, Video, ChevronRight, X, Info } from 'lucide-react';
import { Settings as AppSettings } from './types';

// Fix Leaflet marker icon issue
const customIcon = L.divIcon({
  html: `<div class="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  className: 'custom-marker-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

interface PublicService {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_active: boolean;
  discount_percentage?: number;
  sessions_count?: number;
  is_pack?: boolean;
}

interface Conseil {
  id: number;
  title: string;
  content: string;
  image_url?: string;
  is_active: boolean;
}


interface SpotSuggestion {
  type: string;
  name: string;
  link: string;
}

interface Spot {
  id: number;
  name: string;
  description: string;
  lat: number;
  lng: number;
  image_url?: string;
  difficulty: string;
  live_cam_url?: string;
  suggestion_type?: string;
  suggestion_name?: string;
  suggestion_link?: string;
  suggestions?: SpotSuggestion[];
}

interface ForecastData {
  times: string[];
  waveHeight: number[];
  wavePeriod: number[];
  waveDirection: number[];
  windSpeed: number[];
  windGusts: number[];
  windDirection: number[];
  seaLevel: number[];
}


interface LandingPageContent {
  section: string;
  title: string;
  content: string;
  image_url?: string;
  video_url?: string;
  title_style?: string;
  content_style?: string;
  is_active: boolean;
  button_label?: string;
}

export default function LandingPage({
  onLoginClick,
  settings,
  isAdminPreview = false,
  onBackToAdmin
}: {
  onLoginClick: () => void,
  settings: AppSettings,
  isAdminPreview?: boolean,
  onBackToAdmin?: () => void
}) {
  const [content, setContent] = useState<LandingPageContent[]>([]);
  const [services, setServices] = useState<PublicService[]>([]);
  const [conseils, setConseils] = useState<Conseil[]>([]);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [currentPage, setCurrentPage] = useState<'services' | 'reserve' | 'about' | 'contact' | 'spots' | 'conseils' | string>('about');
  const [reservation, setReservation] = useState({
    name: '',
    email: '',
    phone: '',
    service_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    guests: 1
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedConseil, setSelectedConseil] = useState<Conseil | null>(null);
  const [forecasts, setForecasts] = useState<Record<number, ForecastData>>({});
  const [loadingForecast, setLoadingForecast] = useState<number | null>(null);
  const [sponsorIndex, setSponsorIndex] = useState(0);

  // Sponsor rotation effect
  useEffect(() => {
    let sponsors: any[] = [];
    try {
      const parsed = JSON.parse(settings.sponsor_images || '[]');
      sponsors = Array.isArray(parsed) && parsed.length > 0 ? parsed : [
        { url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Rip_Curl_logo.svg', alt: 'Rip Curl' },
        { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Quiksilver_logo.svg', alt: 'Quiksilver' }
      ];
    } catch {
      sponsors = [];
    }

    if (sponsors.length <= 1) return;

    const duration = parseInt(settings.sponsor_duration || '3000');
    const interval = setInterval(() => {
      setSponsorIndex(prev => (prev + 1) % sponsors.length);
    }, duration);

    return () => clearInterval(interval);
  }, [settings.sponsor_images, settings.sponsor_duration]);

  const fetchForecast = async (id: number) => {
    if (forecasts[id] || loadingForecast === id) return;
    setLoadingForecast(id);
    try {
      const res = await fetch(`/api/public/spots/${id}/forecast`);
      const data = await res.json();
      if (data.times) {
        setForecasts(prev => ({ ...prev, [id]: data }));
      }
    } catch (e) {
      console.error("Error fetching forecast", e);
    } finally {
      setLoadingForecast(null);
    }
  };
  useEffect(() => {
    fetch('/api/public/content')
      .then(res => res.json())
      .then(data => {
        setContent(data.content);
        setServices(data.services);
        setSpots(data.spots || []);
        setConseils(data.conseils || []);

        if (data.spots && data.spots.length > 0) {
          data.spots.forEach((spot: any) => {
            fetch(`/api/public/spots/${spot.id}/forecast`)
              .then(res => res.json())
              .then(forecastData => {
                if (forecastData.times) {
                  setForecasts(prev => ({ ...prev, [spot.id]: forecastData }));
                }
              })
              .catch(e => console.error("Error auto-fetching forecast", e));
          });
        }

        // Find first active section to set as default if about is inactive
        const sectionOrder = ['about', 'services', 'reserve', 'conseils', 'spots', 'contact'];
        const aboutData = data.content.find((c: any) => c.section === 'about');
        if (aboutData && !aboutData.is_active) {
          const firstActive = sectionOrder.find(sk => {
            const sd = data.content.find((c: any) => c.section === sk);
            return sd ? sd.is_active : true;
          });
          if (firstActive) setCurrentPage(firstActive);
        }

        const activeOnes = data.services.filter((s: any) => s.is_active);
        if (activeOnes.length > 0) {
          setReservation(prev => ({ ...prev, service_id: activeOnes[0].id.toString() }));
        }
      });
  }, []);

  useEffect(() => {
    // Analytics: Visitor tracking
    if (!isAdminPreview) {
      let sessionId = sessionStorage.getItem('visitor_session_id');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('visitor_session_id', sessionId);
      }

      const pingVisit = () => {
        fetch('/api/public/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        }).catch(() => { });
      };

      pingVisit();
      const interval = setInterval(pingVisit, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdminPreview]);

  useEffect(() => {
    if (settings.body_bg_color) {
      document.body.style.backgroundColor = settings.body_bg_color;
    }
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [settings.body_bg_color]);

  // Sync browser Tab title and favicon
  useEffect(() => {
    if (settings.app_name) {
      document.title = settings.app_name;
    }
    if (settings.app_logo) {
      const favicon = document.getElementById('app-favicon') as HTMLLinkElement;
      if (favicon) {
        favicon.href = settings.app_logo;
      }
    }
  }, [settings.app_name, settings.app_logo]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const getSection = (name: string) => content.find(c => c.section === name);
  const about = getSection('about');
  const contactSection = getSection('contact');

  let contactInfo = { address: '', phone: '', email: '', facebook: '', instagram: '', twitter: '', whatsapp: '', youtube: '' };
  if (contactSection) {
    try {
      contactInfo = { ...contactInfo, ...JSON.parse(contactSection.content) };
    } catch (e) {
      console.error("Error parsing contact content", e);
    }
  }

  const activeServices = services.filter(s => s.is_active);

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    // Get service info to check if it's a pack
    const selectedService = services.find(s => s.id.toString() === reservation.service_id);
    const isPack = selectedService?.is_pack || false;

    try {
      const res = await fetch('/api/public/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reservation,
          service_id: parseInt(reservation.service_id),
          guests: reservation.guests,
          // If it's a pack, date and time might be empty/hidden in UI, 
          // but we send what's in state (initialized to today)
          date: isPack ? (reservation.date || '') : reservation.date,
          time: isPack ? (reservation.time || '') : reservation.time
        })
      });
      if (res.ok) {
        setStatus('success');
        setReservation({
          name: '',
          email: '',
          phone: '',
          service_id: services.find(s => s.is_active)?.id.toString() || '',
          date: new Date().toISOString().split('T')[0],
          time: '10:00',
          guests: 1
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Reservation error:", errorData);
        setStatus('error');
      }
    } catch (e) {
      console.error("Reservation network error:", e);
      setStatus('error');
    }
  };

  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactStatus, setContactStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('loading');
    try {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      if (res.ok) {
        setContactStatus('success');
        setContactForm({ name: '', email: '', subject: '', message: '' });
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("Contact error:", errorData);
        setContactStatus('error');
      }
    } catch (e) {
      console.error("Contact network error:", e);
      setContactStatus('error');
    }
  };

  const NavLinks = ({ isMobile = false } = {}) => {
    const sections = [
      { key: 'about', defaultLabel: '' },
      { key: 'services', defaultLabel: 'Services' },
      { key: 'reserve', defaultLabel: 'Réserver' },
      { key: 'conseils', defaultLabel: 'Conseils' },
      { key: 'spots', defaultLabel: 'Spots' },
      { key: 'contact', defaultLabel: 'Contact' }
    ];

    const activeSections = sections.filter(s => {
      const data = content.find(c => c.section === s.key);
      return data ? data.is_active : true; // Default to true if not found (seeding should prevent this)
    });

    return (
      <>
        {activeSections.map((s, idx) => {
          const data = content.find(c => c.section === s.key);
          const label = data?.button_label || s.defaultLabel;
          return (
            <React.Fragment key={s.key}>
              <button
                onClick={() => { setCurrentPage(s.key as any); setIsMobileMenuOpen(false); }}
                className={`text-[12px] font-bold transition-colors uppercase tracking-widest px-2 text-left lg:text-center ${currentPage === s.key ? 'text-indigo-600' : ''}`}
                style={{ color: currentPage !== s.key ? (isMobile ? '#334155' : (settings.nav_text_color || settings.header_text_color || '#475569')) : undefined }}
              >
                {label}
              </button>
              {idx < activeSections.length - 1 && (
                <div className="hidden lg:block h-3 w-[1px]" style={{ backgroundColor: settings.nav_text_color ? `${settings.nav_text_color}33` : 'rgba(71, 85, 105, 0.2)' }} />
              )}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  const getStyleClasses = (styleString?: string, defaultClasses: string = '') => {
    if (!styleString) return defaultClasses;
    try {
      const styles = JSON.parse(styleString);
      let classes = [];
      if (styles.size) classes.push(styles.size);
      if (styles.weight) classes.push(styles.weight);
      if (styles.italic) classes.push('italic');

      const filteredDefaults = defaultClasses
        .split(' ')
        .filter(cls => {
          const parts = cls.split(':');
          const baseCls = parts[parts.length - 1];

          // Filter out size defaults if custom size/fontSize is provided
          const isSizeClass = /text-(xs|sm|base|lg|[0-9]xl)$/.test(baseCls);
          // Filter out weight defaults if custom weight/fontWeight is provided
          const isWeightClass = /font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/.test(baseCls);
          const isItalicClass = baseCls === 'italic';

          if ((styles.size || styles.fontSize) && isSizeClass) return false;
          if ((styles.weight || styles.fontWeight) && isWeightClass) return false;
          if (styles.italic && isItalicClass) return false;

          return true;
        })
        .join(' ');

      return `${filteredDefaults} ${classes.join(' ')}`.trim();
    } catch (e) {
      return defaultClasses;
    }
  };

  const getStyleObject = (styleString?: string) => {
    if (!styleString) return {};
    try {
      const styles = JSON.parse(styleString);
      return {
        color: styles.color || undefined,
        fontSize: styles.fontSize ? `${styles.fontSize}px` : undefined,
        fontWeight: styles.fontWeight || undefined
      };
    } catch (e) {
      return {};
    }
  };

  const getMainBackgroundStyle = () => {
    let bgImage = '';
    if (currentPage === 'services') bgImage = settings.services_bg_image;
    else if (currentPage === 'conseils') bgImage = settings.conseils_bg_image;
    else if (currentPage === 'reserve') bgImage = settings.reserve_bg_image;

    if (bgImage) {
      return {
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }

    if (currentPage === 'spots') {
      return { backgroundColor: settings.nav_color || '#ffffff' };
    }

    if (currentPage === 'about') {
      return { backgroundColor: settings.body_bg_color || '#f8fafc' };
    }

    return {};
  };

  const hasBackgroundImage = (currentPage === 'services' && !!settings.services_bg_image) ||
    (currentPage === 'conseils' && !!settings.conseils_bg_image) ||
    (currentPage === 'reserve' && !!settings.reserve_bg_image);

  return (
    <div className={`min-h-screen flex flex-col bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 ${settings?.body_bg_color ? `bg-[${settings.body_bg_color}]` : 'bg-slate-50'}`}>
      {/* Unified Navigation */}
      <nav
        className={`${String(settings.sticky_header) === 'true' ? 'fixed' : 'absolute'} top-0 left-0 right-0 z-50 transition-all shadow-sm flex flex-col`}
        style={{
          backgroundColor: settings.header_color ? `${settings.header_color}f2` : 'rgba(255, 255, 255, 0.95)',
          color: settings.header_text_color || '#0f172a'
        }}
      >

        <div className="w-full pl-6 pr-0 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentPage('about')}>
            {settings.app_logo && (
              <img src={settings.app_logo} alt={settings.app_name} className="h-10 w-auto object-contain transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-black uppercase tracking-tighter leading-none" style={{ color: settings.header_text_color || '#0f172a' }}>{settings.app_name}</span>
              <button
                onClick={isAdminPreview ? onBackToAdmin : onLoginClick}
                className="text-[9px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest text-left leading-none"
                style={{ color: settings.header_text_color ? `${settings.header_text_color}88` : undefined }}
              >
                Dashboard
              </button>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <NavLinks />
          </div>

          <div className="flex items-center gap-3">
            {/* Square sponsor carousel widget */}
            {(() => {
              let sponsors: { url: string; alt: string }[] = [];
              try {
                const parsed = JSON.parse(settings.sponsor_images || '[]');
                sponsors = Array.isArray(parsed) ? parsed : [];
              } catch {
                sponsors = [];
              }

              if (sponsors.length === 0) return null;
              return (
                <div
                  className="hidden lg:flex w-32 h-14 overflow-hidden shrink-0 relative"
                  title="Nos sponsors"
                >
                  <div className="flex items-center justify-center h-full w-full overflow-hidden p-1.5">
                    <AnimatePresence mode="wait">
                      {sponsors[sponsorIndex % sponsors.length] && (
                        <motion.img
                          key={sponsorIndex % sponsors.length}
                          src={sponsors[sponsorIndex % sponsors.length].url}
                          alt={sponsors[sponsorIndex % sponsors.length].alt}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.1 }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className="max-w-full max-h-full object-contain"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl transition-colors hover:bg-slate-500/10"
              style={{ color: settings.header_text_color || '#0f172a', borderColor: settings.header_text_color ? `${settings.header_text_color}40` : '#e2e8f0', borderWidth: 1 }}
            >
              {isMobileMenuOpen ? <Plus size={20} className="rotate-45" /> : <div className="space-y-1"><div className="w-5 h-0.5" style={{ backgroundColor: settings.header_text_color || '#0f172a' }}></div><div className="w-5 h-0.5" style={{ backgroundColor: settings.header_text_color || '#0f172a' }}></div><div className="w-5 h-0.5" style={{ backgroundColor: settings.header_text_color || '#0f172a' }}></div></div>}
            </button>
          </div>
        </div>



        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-4">
                <NavLinks isMobile={true} />
                <div className="h-px bg-slate-100 my-2" />
                <button
                  onClick={() => { if (isAdminPreview) onBackToAdmin?.(); else onLoginClick(); setIsMobileMenuOpen(false); }}
                  className="text-left text-[10px] font-black text-indigo-600 uppercase tracking-widest"
                >
                  {isAdminPreview ? 'Dashboard' : 'Espace Staff'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main
        className={`flex-grow pt-16 flex flex-col relative transition-all duration-500 ${(String(settings.sticky_footer) === 'true' && !['about', 'spots', 'contact'].includes(currentPage)) ? 'pb-12' : ''}`}
        style={getMainBackgroundStyle()}
      >
        {hasBackgroundImage && <div className="absolute inset-0 bg-white/20 z-0" />}
        <AnimatePresence mode="wait">
          {currentPage === 'services' && (
            <motion.div
              key="services"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex-grow flex flex-col relative justify-center pt-0 pb-16 z-10"
            >

              <div className="w-full relative z-10">
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-black mb-3 tracking-tight" style={{ color: settings.title_color || '#0f172a' }}>{settings.services_title || ''}</h2>
                  <p className="text-lg font-medium" style={{ color: settings.subtitle_color || '#64748b' }}>{settings.services_subtitle || ''}</p>
                </div>
                <div className={`
                  ${settings.services_layout === 'horizontal-scroll'
                    ? 'flex overflow-x-auto snap-x snap-mandatory gap-8 pb-8 hide-scrollbar px-4 max-w-full'
                    : settings.services_layout === 'single-row-centered'
                      ? 'flex flex-wrap gap-10 justify-center px-4 max-w-7xl mx-auto'
                      : settings.services_layout === 'grid-4'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4 max-w-7xl mx-auto justify-items-center'
                        : settings.services_layout === 'grid-5'
                          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 px-4 max-w-7xl mx-auto justify-items-center'
                          : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4 max-w-7xl mx-auto justify-items-center'}
                `}>
                  {activeServices.map((service) => {
                    return (
                      <div
                        key={service.id}
                        className={`
                            relative bg-white/20 backdrop-blur-3xl rounded-[3rem] border border-white/40 flex flex-col h-full
                            w-full max-w-[340px] overflow-hidden
                            ${settings.services_layout === 'horizontal-scroll' ? 'min-w-[310px] snap-center' : 'mx-auto'}
                            shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] 
                            transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group hover:-translate-y-3
                          `}
                      >
                        {/* Edge-to-edge Title Header */}
                        <div 
                          className="w-full py-2 px-6 text-center border-b border-white/10 flex items-center justify-center gap-3 relative"
                          style={{ backgroundColor: settings.card_button_color || '#0f172a' }}
                        >
                          <h3 className="font-bold tracking-tight text-[12px] md:text-sm uppercase leading-tight" style={{ color: settings.card_title_color || '#ffffff' }}>
                            {service.name}
                          </h3>
                          {service.discount_percentage > 0 && (
                            <div className="px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                              -{service.discount_percentage}%
                            </div>
                          )}
                        </div>

                        {/* Glow Effect on Hover */}
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-20" />

                        {service.image_url && (
                          <div className="relative aspect-[16/4] w-full bg-slate-200/50 ring-1 ring-white/50 shadow-inner group-hover:shadow-2xl transition-all duration-700">
                            <img
                              src={service.image_url}
                              alt={service.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                              referrerPolicy="no-referrer"
                              loading="lazy" decoding="async"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-700" />
                          </div>
                        )}
                        <div className="flex-grow px-6 pt-0 pb-2">
                          <div className="flex items-center justify-between mt-0 mb-1">
                            <div className="flex items-center gap-2">
                              <div className="h-0.5 w-6 bg-indigo-500 rounded-full" />
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{service.sessions_count || 1} SESSION{(Number(service.sessions_count || 1) > 1) ? 'S' : ''}</span>
                            </div>
                            <div className="text-lg font-black text-indigo-600 flex flex-col items-end">
                              {service.discount_percentage > 0 && (
                                <span className="text-[10px] font-bold text-slate-900 line-through">
                                  {service.price} DH
                                </span>
                              )}
                              <span>{service.discount_percentage > 0 ? Math.round(service.price * (1 - service.discount_percentage / 100)) : service.price} DH</span>
                            </div>
                          </div>



                          <p className="text-[12px] font-medium leading-tight line-clamp-6 min-h-[90px]" style={{ color: settings.card_text_color || '#475569' }}>
                            {service.description}
                          </p>
                        </div>

                        <div className="mt-auto border-t border-white/30">
                          <button
                            onClick={() => { setReservation(prev => ({ ...prev, service_id: service.id.toString() })); setCurrentPage('reserve'); }}
                            className="w-full py-2 px-8 active:scale-95 rounded-t-none rounded-b-[3rem] font-bold text-[10px] uppercase tracking-[0.15em] shadow-none transition-all flex items-center justify-center gap-2 group/btn hover:opacity-90"
                            style={{ backgroundColor: settings.card_button_color || '#0f172a', color: settings.card_button_text_color || '#ffffff' }}
                          >
                            Réserver maintenant
                            <ChevronRight size={16} className="opacity-50 group-hover/btn:translate-x-1 transition-transform duration-300" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {currentPage === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex-grow flex flex-col"
            >
              <section className="flex-grow flex items-stretch">
                <div className="flex flex-col md:flex-row items-stretch w-full flex-grow">
                  {/* ===== Panneau Sponsors Carré (remplace l'image) ===== */}
                  {(() => {
                    let sponsors: { url: string; alt: string }[] = [];
                    try {
                      const parsed = JSON.parse((settings as any).sponsor_images || '[]');
                      sponsors = Array.isArray(parsed) ? parsed : [];
                    } catch {
                      sponsors = [];
                    }
                    return (
                      <div
                        className="w-full h-[300px] md:h-auto md:w-[45%] shrink-0 relative flex flex-col overflow-hidden"
                      >
                        {/* Background Image */}
                        {about?.image_url && (
                          <img 
                            src={about.image_url} 
                            alt="À propos" 
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy" decoding="async"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                      </div>
                    );
                  })()}
                  <div className={`flex-1 flex justify-start items-center flex-col px-6 pt-0 ${String(settings.sticky_footer) === 'true' ? 'pb-12' : 'pb-6'} md:pb-10`}>
                    <div className="max-w-xl text-center">
                      {!!about?.show_logo && settings.app_logo && (
                        <img src={settings.app_logo} alt={settings.app_name} className="h-32 w-auto object-contain mx-auto mb-0" referrerPolicy="no-referrer" loading="lazy" decoding="async" />
                      )}
                      <h2
                        className={getStyleClasses(about?.title_style, "text-4xl md:text-5xl font-black mb-4 leading-tight")}
                        style={{ color: settings.title_color || '#0f172a', ...getStyleObject(about?.title_style) }}
                        dangerouslySetInnerHTML={{ __html: about?.title || '' }}
                      />
                      <div
                        className={getStyleClasses(about?.content_style, "space-y-4 font-medium mb-6 whitespace-pre-line text-xl")}
                        style={{ color: settings.subtitle_color || '#64748b', ...getStyleObject(about?.content_style) }}
                        dangerouslySetInnerHTML={{ __html: about?.content || '' }}
                      />
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {!!about?.show_button && (
                          <button
                            onClick={() => setCurrentPage((about?.button_link as any) || 'reserve')}
                            className="px-6 py-3 rounded-2xl font-black shadow-xl shadow-indigo-100/20 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest min-w-[180px] hover:opacity-90"
                            style={{ 
                              backgroundColor: about?.cta1_bg_color || '#4f46e5', 
                              color: about?.cta1_text_color || '#ffffff' 
                            }}
                          >
                            {about?.section_button_label}
                          </button>
                        )}
                        {!!about?.button_label_2 && (about.show_button_2 === undefined || !!about.show_button_2) && (
                          <button
                            onClick={() => setCurrentPage((about?.button_link_2 as any) || 'spots')}
                            className="px-6 py-3 border-2 rounded-2xl font-black shadow-md shadow-slate-100/10 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest min-w-[180px] hover:opacity-90"
                            style={{ 
                              backgroundColor: about?.cta2_bg_color || '#ffffff', 
                              color: about?.cta2_text_color || '#4f46e5',
                              borderColor: about?.cta2_text_color || '#4f46e5'
                            }}
                          >
                            {about.button_label_2}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {currentPage === 'conseils' && (
            <motion.div
              key="conseils"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex-grow flex flex-col relative justify-center pt-0 pb-16 z-10"
            >
              <div className="w-full relative z-10 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-black mb-3 tracking-tight" style={{ color: settings.title_color || '#0f172a' }}>{settings.conseils_title || ''}</h2>
                  <p className="text-lg font-medium" style={{ color: settings.subtitle_color || '#64748b' }}>{settings.conseils_subtitle || ''}</p>
                </div>
                <div className={`
                    ${settings.conseils_layout === 'horizontal-scroll'
                    ? 'flex overflow-x-auto snap-x snap-mandatory gap-8 pb-8 hide-scrollbar px-4 max-w-full'
                    : settings.conseils_layout === 'single-row-centered'
                      ? 'flex flex-wrap gap-10 justify-center px-4 max-w-7xl mx-auto'
                      : settings.conseils_layout === 'grid-4'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-4 max-w-7xl mx-auto justify-items-center'
                        : settings.conseils_layout === 'grid-5'
                          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 px-4 max-w-7xl mx-auto justify-items-center'
                          : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4 max-w-7xl mx-auto justify-items-center'}
                  `}>
                  {conseils.filter(c => c.is_active).map((conseil) => {
                    const isLong = (conseil.content || '').length > 460;
                    const displayContent = isLong ? (conseil.content || '').substring(0, 450) + '...' : conseil.content;

                    return (
                      <div
                        key={conseil.id}
                        className={`
                            relative bg-white/20 backdrop-blur-3xl rounded-[3rem] border border-white/40 flex flex-col h-full
                            w-full max-w-[340px] overflow-hidden
                            ${settings.conseils_layout === 'horizontal-scroll' ? 'min-w-[310px] snap-center' : 'mx-auto'}
                            shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] 
                            transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group hover:-translate-y-3
                          `}
                      >
                        {/* Edge-to-edge Title Header */}
                        <div 
                          className="w-full py-2 px-6 text-center border-b border-white/10"
                          style={{ backgroundColor: settings.card_button_color || '#0f172a' }}
                        >
                          <h3 className="font-bold tracking-tight text-[12px] uppercase leading-tight" style={{ color: settings.card_title_color || '#ffffff' }}>
                            {conseil.title}
                          </h3>
                        </div>

                        {/* Glow Effect on Hover */}
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-20" />

                        {conseil.image_url && (
                          <div className="relative aspect-[21/5] w-full bg-slate-200/50 ring-1 ring-white/50 shadow-inner group-hover:shadow-2xl transition-all duration-700">
                            <img
                              src={conseil.image_url}
                              alt={conseil.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                              referrerPolicy="no-referrer"
                              loading="lazy" decoding="async"
                            />
                          </div>
                        )}
                        <div className="flex-grow px-6 pt-0 pb-2">
                          <p className="text-[12px] font-medium leading-tight line-clamp-8 min-h-[120px] mt-2" style={{ color: settings.card_text_color || '#475569' }}>
                            {displayContent}
                          </p>
                        </div>
                        {(isLong || settings.conseils_button_text) && (
                          <div className="mt-auto border-t border-white/20">
                            <button
                              onClick={() => setSelectedConseil(conseil)}
                              className="w-full py-2 px-5 rounded-t-none rounded-b-[3rem] font-bold text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group/btn border-t-0 active:scale-95 shadow-none hover:opacity-90"
                              style={{ backgroundColor: settings.card_button_color || '#0f172a', color: settings.card_button_text_color || '#ffffff' }}
                            >
                              {settings.conseils_button_text}
                              <ChevronRight size={14} className="opacity-40 group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {currentPage === 'reserve' && (
            <motion.div
              key="reserve"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex-grow flex flex-col relative justify-center z-10"
            >

              <section className="flex-grow flex items-center justify-center p-4 pt-0 pb-2 relative z-10">
                <div className={`w-full max-w-6xl mx-auto flex flex-col ${settings.reserve_layout === 'split' ? 'lg:flex-row lg:items-center gap-12 xl:gap-20' : 'items-center'}`}>
                  {settings.reserve_layout === 'split' && (
                    <div className="hidden lg:flex w-1/2 flex-col justify-center">
                      <h2 className="text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-tight drop-shadow-xl" style={{ color: settings.title_color || '#0f172a' }}>
                        {settings.reserve_title}
                      </h2>
                      <p className="text-xl lg:text-2xl font-bold leading-relaxed drop-shadow-md" style={{ color: settings.subtitle_color || '#64748b' }}>
                        {settings.reserve_subtitle}
                      </p>
                    </div>
                  )}
                  <div className={`w-full ${settings.reserve_layout === 'split' ? 'lg:w-1/2' : 'max-w-2xl'}`}>
                    {settings.reserve_layout !== 'split' && (
                      <div className="text-center mb-10">
                        <h2 className="text-4xl font-black mb-3 tracking-tight" style={{ color: settings.title_color || '#0f172a' }}>{settings.reserve_title}</h2>
                        <p className="text-lg font-medium" style={{ color: settings.subtitle_color || '#64748b' }}>{settings.reserve_subtitle}</p>
                      </div>
                    )}
                    <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-white/50 shadow-2xl">
                      {status === 'success' ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} />
                          </div>
                          <h3 className="text-2xl font-black text-slate-900 mb-2">Réservation Envoyée !</h3>
                          <p className="text-sm text-slate-500 font-medium mb-6">Nous vous contacterons très prochainement pour confirmer votre session.</p>
                          <button
                            onClick={() => setStatus('idle')}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm"
                          >
                            Faire une autre réservation
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleReserve} className="space-y-2">
                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="space-y-0.5">
                              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Nom Complet</label>
                              <input
                                required
                                type="text"
                                value={reservation.name}
                                onChange={e => setReservation({ ...reservation, name: e.target.value })}
                                className="w-full px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                                placeholder=" Nom et Prenom "
                              />
                            </div>
                            <div className="space-y-0.5">
                              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Téléphone</label>
                              <input
                                required
                                type="tel"
                                value={reservation.phone}
                                onChange={e => setReservation({ ...reservation, phone: e.target.value })}
                                className="w-full px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                                placeholder="06..."
                              />
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Email</label>
                            <input
                              required
                              type="email"
                              value={reservation.email}
                              onChange={e => setReservation({ ...reservation, email: e.target.value })}
                              className="w-full px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                              placeholder="votre@email.com"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Service</label>
                            <select
                              value={reservation.service_id}
                              onChange={e => setReservation({ ...reservation, service_id: e.target.value })}
                              className="w-full px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold appearance-none text-sm"
                            >
                              {activeServices.map(s => {
                                const finalPrice = s.discount_percentage > 0
                                  ? Math.round(s.price * (1 - s.discount_percentage / 100))
                                  : s.price;
                                return (
                                  <option key={s.id} value={s.id}>
                                    {s.name} - {finalPrice} DH {s.discount_percentage > 0 ? `(Promo -${s.discount_percentage}%)` : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          {!(services.find(s => s.id.toString() === reservation.service_id)?.is_pack) && (
                            <>
                              <div className="grid md:grid-cols-2 gap-3">
                                <div className="space-y-0.5">
                                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Date</label>
                                  <input
                                    required
                                    type="date"
                                    value={reservation.date}
                                    onChange={e => setReservation({ ...reservation, date: e.target.value })}
                                    className="w-full px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Heure</label>
                                  <input
                                    required
                                    type="time"
                                    value={reservation.time}
                                    onChange={e => setReservation({ ...reservation, time: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Nombre de personnes</label>
                                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-1">
                                  <button
                                    type="button"
                                    onClick={() => setReservation(prev => ({ ...prev, guests: Math.max(1, prev.guests - 1) }))}
                                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <input
                                    type="number"
                                    value={reservation.guests}
                                    readOnly
                                    className="w-full bg-transparent border-none text-center font-black text-sm focus:ring-0 py-0.5"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setReservation(prev => ({ ...prev, guests: prev.guests + 1 }))}
                                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                          <button
                            disabled={status === 'loading'}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
                          >
                            {status === 'loading' ? 'Envoi...' : 'Confirmer la réservation'}
                          </button>
                          {status === 'error' && (
                            <p className="text-rose-500 text-sm font-bold text-center mt-3">Une erreur est survenue. Veuillez réessayer.</p>
                          )}
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}


          {currentPage === 'spots' && (
            <motion.div
              key="spots"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              style={{ backgroundColor: 'transparent' }}
              className="flex-grow flex flex-col relative overflow-hidden z-10"
            >

              <div className={`w-full flex-grow flex flex-col ${settings.spots_layout === 'grid-2' || settings.spots_layout === 'grid-1' || settings.spots_layout === 'horizontal-scroll' ? 'items-center' : 'lg:flex-row items-stretch'} relative z-10 overflow-hidden`}>
                {/* Content Column / Header */}
                <div className={`
                  ${settings.spots_layout === 'grid-2' || settings.spots_layout === 'grid-1' || settings.spots_layout === 'horizontal-scroll'
                    ? 'w-full max-w-6xl p-8 text-center'
                    : 'w-full lg:w-[45%] p-8 lg:p-12 xl:p-16 flex flex-col justify-center overflow-y-auto scrollbar-premium'}
                `}>
                  <div className={settings.spots_layout === 'grid-2' || settings.spots_layout === 'grid-1' || settings.spots_layout === 'horizontal-scroll' ? 'mx-auto' : 'max-w-xl'}>
                    <h2 className="text-4xl lg:text-5xl font-black mb-8 tracking-tight leading-tight" style={{ color: settings.title_color || '#0f172a' }}>
                      {settings.spots_title || ''}
                    </h2>
                    <p className="text-xl font-bold mb-6 leading-relaxed" style={{ color: settings.subtitle_color || '#475569' }}>
                      {settings.spots_subtitle || ''}
                    </p>
                    <div className="text-base text-slate-500 font-medium leading-relaxed space-y-4">
                      {settings.spots_content || ""}
                    </div>
                  </div>

                  {/* Grid/Scroll Layout for Spots Cards (if not split) */}
                  {(settings.spots_layout === 'grid-2' || settings.spots_layout === 'grid-1' || settings.spots_layout === 'horizontal-scroll') && (
                    <div className={`
                      mt-12 w-full
                      ${settings.spots_layout === 'horizontal-scroll'
                        ? 'flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 hide-scrollbar'
                        : 'grid grid-cols-1 ' + (settings.spots_layout === 'grid-2' ? 'md:grid-cols-2' : '') + ' gap-8'}
                    `}>
                      {spots.map((spot) => (
                        <div key={spot.id} className={`
                          bg-white/40 backdrop-blur-sm p-6 rounded-[2rem] border border-slate-200/60 flex flex-col md:flex-row gap-6 text-left
                          ${settings.spots_layout === 'horizontal-scroll' ? 'min-w-[350px] max-w-[450px] snap-center' : 'w-full'}
                          shadow-sm hover:shadow-xl transition-all duration-300 group
                        `}>
                          {spot.image_url && (
                            <div className="w-full md:w-40 aspect-square rounded-2xl overflow-hidden shrink-0">
                              <img src={spot.image_url} alt={spot.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
                            </div>
                          )}
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-black text-slate-900 truncate">{spot.name}</h3>
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{spot.difficulty}</span>
                            </div>
                            <p className="text-slate-500 text-sm font-medium line-clamp-3 mb-4">{spot.description}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-600 hover:text-white transition-all"
                              >
                                <Navigation size={12} /> Itinéraire
                              </a>
                              {spot.live_cam_url && (
                                <a
                                  href={spot.live_cam_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
                                >
                                  <Video size={12} /> Live Cam
                                </a>
                              )}

                            </div>

                            {/* Hourly Forecast Grid */}
                            {forecasts[spot.id] && (
                              <div className="mt-2 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="h-1 w-1 bg-indigo-500 rounded-full" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Prévisions aujourd'hui</span>
                                </div>
                                <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-xl bg-white/50 backdrop-blur-sm shadow-inner">
                                  <table className="w-full text-left border-collapse min-w-max text-[10px] font-medium text-slate-600">
                                    <thead>
                                      <tr className="bg-slate-100/80">
                                        <th className="p-2 font-black text-slate-800 sticky left-0 z-10 bg-slate-100 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Heure</th>
                                        {forecasts[spot.id].times.map(t => <th key={t} className="py-2 px-3 text-center font-bold text-slate-700 border-r border-slate-200/50 min-w-[50px]">{t.split('T')[1].split(':')[0]}h</th>)}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {/* Vitesse du vent */}
                                      <tr className="border-t border-slate-200/50">
                                        <td className="p-2 sticky left-0 z-10 bg-white/95 backdrop-blur-xl border-r border-slate-200 flex items-center gap-1.5 font-bold shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                          <Wind size={12} className="text-emerald-500" /> Vent <span className="font-normal text-[8px] opacity-70">(km/h)</span>
                                        </td>
                                        {forecasts[spot.id].windSpeed.map((v, i) => (
                                          <td key={i} className={`p-2 text-center border-r border-slate-200/50 font-black ${v > 30 ? 'bg-amber-100 text-amber-900' : v > 15 ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}>
                                            {Math.round(v)}
                                          </td>
                                        ))}
                                      </tr>
                                      {/* Rafales */}
                                      <tr className="border-t border-slate-200/50 bg-slate-50/50">
                                        <td className="p-2 sticky left-0 z-10 bg-slate-50/95 backdrop-blur-xl border-r border-slate-200 font-bold text-slate-500 pl-6 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Rafales</td>
                                        {forecasts[spot.id].windGusts?.map((v, i) => <td key={i} className="p-2 text-center border-r border-slate-200/50 text-slate-500">{Math.round(v)}</td>)}
                                      </tr>
                                      {/* Direction du vent */}
                                      <tr className="border-t border-slate-200/50">
                                        <td className="p-2 sticky left-0 z-10 bg-white/95 backdrop-blur-xl border-r border-slate-200 font-bold text-slate-500 pl-6 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-[9px] uppercase tracking-widest">Dir. Vent</td>
                                        {forecasts[spot.id].windDirection.map((v, i) => (
                                          <td key={i} className="p-2 text-center border-r border-slate-200/50">
                                            <Navigation size={12} className="mx-auto text-emerald-600 drop-shadow-sm" style={{ transform: `rotate(${v}deg)` }} />
                                          </td>
                                        ))}
                                      </tr>
                                      {/* Houle */}
                                      <tr className="border-t border-slate-200 border-t-2">
                                        <td className="p-2 sticky left-0 z-10 bg-indigo-50/95 backdrop-blur-xl border-r border-indigo-100 flex items-center gap-1.5 font-bold shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                          <Waves size={12} className="text-indigo-600" /> Vagues <span className="font-normal text-[8px] opacity-70">(m)</span>
                                        </td>
                                        {forecasts[spot.id].waveHeight.map((v, i) => (
                                          <td key={i} className={`p-2 text-center border-r border-indigo-100/50 font-black ${v >= 1.5 ? 'bg-indigo-100 text-indigo-900' : 'bg-indigo-50/30 text-indigo-700'}`}>
                                            {v}
                                          </td>
                                        ))}
                                      </tr>
                                      {/* Période */}
                                      <tr className="border-t border-indigo-100/50 bg-indigo-50/10">
                                        <td className="p-2 sticky left-0 z-10 bg-white/95 backdrop-blur-xl border-r border-indigo-100 font-bold text-slate-500 pl-6 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-[9px]">Période (s)</td>
                                        {forecasts[spot.id].wavePeriod.map((v, i) => <td key={i} className="p-2 text-center border-r border-indigo-100/50 font-bold text-slate-600">{v}</td>)}
                                      </tr>
                                      {/* Direction Houle */}
                                      <tr className="border-t border-indigo-100/50">
                                        <td className="p-2 sticky left-0 z-10 bg-white/95 backdrop-blur-xl border-r border-indigo-100 font-bold text-slate-500 pl-6 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-[9px] uppercase tracking-widest">Dir. Vague</td>
                                        {forecasts[spot.id].waveDirection.map((v, i) => (
                                          <td key={i} className="p-2 text-center border-r border-indigo-100/50">
                                            <Navigation size={12} className="mx-auto text-indigo-500 drop-shadow-sm" style={{ transform: `rotate(${v}deg)` }} />
                                          </td>
                                        ))}
                                      </tr>
                                      {/* Marée */}
                                      <tr className="border-t border-sky-100/50 bg-sky-50/20">
                                        <td className="p-2 sticky left-0 z-10 bg-white/95 backdrop-blur-xl border-r border-sky-100 font-bold text-slate-500 pl-6 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-[9px] uppercase tracking-widest">Marée (m)</td>
                                        {forecasts[spot.id].seaLevel?.map((v, i) => (
                                          <td key={i} className="p-2 text-center border-r border-sky-100/50 font-black text-sky-700 bg-sky-50/40">
                                            {v}
                                          </td>
                                        ))}
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Map Column (Only if split layout or explicit map layout) */}
                {(settings.spots_layout === undefined || settings.spots_layout === '' || settings.spots_layout === 'split') && (
                  <div className="w-full lg:w-[55%] relative min-h-[500px] lg:min-h-0 border-l border-slate-200/50">
                    <div className="absolute inset-0 overflow-hidden">
                      <MapContainer
                        center={[30.5442, -9.7088]}
                        zoom={12}
                        className="w-full h-full"
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {spots.map((spot) => (
                          <Marker
                            key={spot.id}
                            position={[spot.lat, spot.lng]}
                            icon={customIcon}
                          >
                            <Popup className="custom-popup">
                              <div className="w-80 bg-white p-1">
                                <div className="aspect-video rounded-xl overflow-hidden mb-3 bg-slate-50 border border-slate-100">
                                  {spot.image_url ? (
                                    <img src={spot.image_url} alt={spot.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                      <Waves size={32} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                      <h4 className="font-black text-slate-900 text-sm truncate max-w-full">{spot.name}</h4>
                                      <span className={`shrink-0 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${(spot.difficulty?.toLowerCase().includes('deb')) ? 'bg-emerald-100 text-emerald-600' :
                                        (spot.difficulty?.toLowerCase().includes('int')) ? 'bg-amber-100 text-amber-600' :
                                        (spot.difficulty?.toLowerCase().includes('tout')) ? 'bg-sky-100 text-sky-600' :
                                          'bg-rose-100 text-rose-600'
                                        }`}>
                                        {spot.difficulty}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 line-clamp-2 font-medium uppercase tracking-tight leading-tight">{spot.description}</p>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                    {spot.live_cam_url && (
                                      <a
                                        href={spot.live_cam_url.startsWith('http') ? spot.live_cam_url : `https://${spot.live_cam_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-7 h-7 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm"
                                        title="Voir la Live Cam"
                                      >
                                        <Video size={12} />
                                      </a>
                                    )}
                                    <a
                                      href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center w-7 h-7 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm"
                                      title="Itinéraire vers ce spot"
                                    >
                                      <Navigation size={12} className="ml-px" />
                                    </a>
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2">



                                  {forecasts[spot.id] && (
                                    <div className="mt-1 pt-3 border-t border-slate-100">
                                      <div className="overflow-x-auto hide-scrollbar border border-slate-200 rounded-lg bg-white">
                                        <table className="w-full text-left border-collapse min-w-max text-[8px] font-medium text-slate-600">
                                          <thead>
                                            <tr className="bg-slate-100/80">
                                              <th className="p-1.5 font-black text-slate-800 sticky left-0 z-10 bg-slate-100 border-r border-slate-200 shadow-[1px_0_3px_rgba(0,0,0,0.05)]">H</th>
                                              {forecasts[spot.id].times.map(t => <th key={t} className="py-1.5 px-2 text-center font-bold text-slate-700 border-r border-slate-200/50 min-w-[35px]">{t.split('T')[1].split(':')[0]}h</th>)}
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr className="border-t border-slate-200/50">
                                              <td className="p-1.5 sticky left-0 z-10 bg-white/95 border-r border-slate-200 flex items-center gap-1 font-bold"><Wind size={8} className="text-emerald-500" /> Vent</td>
                                              {forecasts[spot.id].windSpeed.map((v, i) => <td key={i} className={`p-1.5 text-center border-r border-slate-200/50 font-black ${v > 15 ? 'text-emerald-700' : 'text-slate-700'}`}>{Math.round(v)}</td>)}
                                            </tr>
                                            <tr className="border-t border-slate-200/50 bg-slate-50/50">
                                              <td className="p-1.5 sticky left-0 z-10 bg-slate-50/95 border-r border-slate-200 font-bold text-slate-500 pl-4">Raf.</td>
                                              {forecasts[spot.id].windGusts?.map((v, i) => <td key={i} className="p-1.5 text-center border-r border-slate-200/50 font-bold">{Math.round(v)}</td>)}
                                            </tr>
                                            <tr className="border-t border-slate-200/50">
                                              <td className="p-1.5 sticky left-0 z-10 bg-white/95 border-r border-slate-200 text-center"><Navigation size={8} className="mx-auto text-emerald-600" /></td>
                                              {forecasts[spot.id].windDirection.map((v, i) => <td key={i} className="p-1.5 text-center border-r border-slate-200/50"><Navigation size={8} className="mx-auto text-emerald-500" style={{ transform: `rotate(${v}deg)` }} /></td>)}
                                            </tr>
                                            <tr className="border-t border-slate-200 border-t-2">
                                              <td className="p-1.5 sticky left-0 z-10 bg-indigo-50/95 border-r border-indigo-100 flex items-center gap-1 font-bold"><Waves size={8} className="text-indigo-600" /> Houle</td>
                                              {forecasts[spot.id].waveHeight.map((v, i) => <td key={i} className="p-1.5 text-center border-r border-indigo-100/50 font-black text-indigo-700 bg-indigo-50/30">{v}</td>)}
                                            </tr>
                                            <tr className="border-t border-indigo-100/50 bg-indigo-50/10">
                                              <td className="p-1.5 sticky left-0 z-10 bg-white/95 border-r border-indigo-100 font-bold text-slate-500 pl-4">Pér.</td>
                                              {forecasts[spot.id].wavePeriod.map((v, i) => <td key={i} className="p-1.5 text-center border-r border-indigo-100/50 font-bold">{v}</td>)}
                                            </tr>
                                            <tr className="border-t border-indigo-100/50">
                                              <td className="p-1.5 sticky left-0 z-10 bg-white/95 border-r border-indigo-100 text-center"><Navigation size={8} className="mx-auto text-indigo-500" /></td>
                                              {forecasts[spot.id].waveDirection.map((v, i) => <td key={i} className="p-1.5 text-center border-r border-indigo-100/50"><Navigation size={8} className="mx-auto text-indigo-400" style={{ transform: `rotate(${v}deg)` }} /></td>)}
                                            </tr>
                                            <tr className="border-t border-sky-100/50 bg-sky-50/10">
                                              <td className="p-1.5 sticky left-0 z-10 bg-sky-50/95 border-r border-sky-100 font-bold text-slate-500 pl-3">Marée</td>
                                              {forecasts[spot.id].seaLevel?.map((v, i) => <td key={i} className="p-1.5 text-center border-r border-sky-100/50 font-black text-sky-700 bg-sky-50/30">{v}</td>)}
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                  {((spot.suggestions && spot.suggestions.length > 0) || spot.suggestion_name) && (
                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4 mb-1.5 border-t border-slate-100 pt-2">Nos Suggestions</h4>
                                  )}
                                  {spot.suggestions && spot.suggestions.length > 0 ? (
                                    spot.suggestions.map((sugg, idx) => (
                                      <div key={idx} className="mt-1 flex items-start gap-1.5">
                                        <span className="shrink-0 text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">{sugg.type}</span>
                                        {sugg.link ? (
                                          <a
                                            href={sugg.link.startsWith('http') ? sugg.link : `https://${sugg.link}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] font-bold text-slate-700 hover:text-indigo-600 hover:underline leading-tight transition-colors"
                                          >
                                            {sugg.name}
                                          </a>
                                        ) : (
                                          <span className="text-[11px] font-bold text-slate-700 leading-tight">{sugg.name}</span>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    spot.suggestion_name && (
                                      <div className="mt-1 flex items-start gap-1.5">
                                        <span className="shrink-0 text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">{spot.suggestion_type || 'Suggestion'}</span>
                                        {spot.suggestion_link ? (
                                          <a
                                            href={spot.suggestion_link.startsWith('http') ? spot.suggestion_link : `https://${spot.suggestion_link}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[11px] font-bold text-slate-700 hover:text-indigo-600 hover:underline leading-tight transition-colors"
                                          >
                                            {spot.suggestion_name}
                                          </a>
                                        ) : (
                                          <span className="text-[11px] font-bold text-slate-700 leading-tight">{spot.suggestion_name}</span>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </MapContainer>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {currentPage === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex-grow flex flex-col justify-center pt-0 pb-4 relative overflow-hidden"
              style={{ 
                backgroundColor: settings.body_bg_color || '#f8fafc',
                backgroundImage: contactSection?.content_style === 'section_bg' ? `url(${contactSection?.image_url})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {contactSection?.content_style === 'section_bg' && (
                <div 
                  className="absolute inset-0 z-0" 
                  style={{ backgroundColor: settings.body_bg_color ? `${settings.body_bg_color}BF` : 'rgba(248, 250, 252, 0.75)' }} 
                />
              )}
              <section className="flex-grow flex items-center justify-center p-6 lg:p-8 relative z-10">
                <div className={`grid grid-cols-1 ${contactSection?.content_style === 'centered' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-8 items-center w-full max-w-[1400px] mx-auto`}>
                  <div className={`flex flex-col justify-center ${String(settings.sticky_footer) === 'true' ? 'pb-24' : 'pb-4'}`}>
                    <div className="max-w-lg w-full">
                      <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                        Contactez-nous
                      </span>
                      <h2 className="text-4xl font-black mb-10 tracking-tight" style={{ color: settings.title_color || '#0f172a' }}>Une question ? Un projet ?</h2>
                      <div className="space-y-6 mb-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                            <Mail size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                            <p className="font-bold text-slate-700">{contactInfo.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                            <Phone size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Téléphone</p>
                            <p className="font-bold text-slate-700">{contactInfo.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                            <MapPin size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adresse</p>
                            <p className="font-bold text-slate-700 mb-2">{contactInfo.address}</p>
                            {contactInfo.address && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors w-fit"
                              >
                                <Navigation size={14} /> Itinéraire
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        {contactInfo.instagram && (
                          <a href={contactInfo.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:scale-110 transition-transform">
                            <Instagram size={18} />
                          </a>
                        )}
                        {contactInfo.facebook && (
                          <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:scale-110 transition-transform">
                            <Facebook size={18} />
                          </a>
                        )}
                        {contactInfo.twitter && (
                          <a href={contactInfo.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:scale-110 transition-transform">
                            <Twitter size={18} />
                          </a>
                        )}
                        {contactInfo.whatsapp && (
                          <a href={`https://wa.me/${contactInfo.whatsapp.replace(/\s+/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:scale-110 transition-transform">
                            <Phone size={18} />
                          </a>
                        )}
                        {contactInfo.youtube && (
                          <a href={contactInfo.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:scale-110 transition-transform" title="Chaîne YouTube">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Centered Image Column (only shown in 'centered' style) */}
                  {contactSection?.content_style === 'centered' && (
                    <div className="flex flex-col items-center justify-center order-first lg:order-none">
                      {contactSection?.image_url && (
                        <div className="flex flex-col items-center">
                          <img 
                            src={contactSection?.image_url} 
                            alt={settings.app_name} 
                            className="h-72 sm:h-96 lg:h-[450px] w-auto object-contain transition-transform hover:scale-105 rounded-3xl shadow-2xl shadow-indigo-100/20" 
                            referrerPolicy="no-referrer" 
                            loading="lazy" 
                            decoding="async" 
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-center relative overflow-hidden w-full">
                    <div 
                      className="p-8 lg:p-10 rounded-3xl border border-white shadow-2xl max-w-2xl w-full relative z-10 overflow-hidden"
                      style={{ 
                        backgroundColor: contactSection?.content_style === 'form_bg' ? 'transparent' : 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: contactSection?.content_style === 'form_bg' ? 'none' : 'blur(24px)',
                        backgroundImage: contactSection?.content_style === 'form_bg' ? `url(${contactSection?.image_url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    >
                      {contactSection?.content_style === 'form_bg' && (
                        <div 
                          className="absolute inset-0 z-0" 
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(4px)' }} 
                        />
                      )}
                      <div className="relative z-10 w-full">
                        {contactStatus === 'success' ? (
                          <div className="text-center py-8 w-full">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Message Envoyé !</h3>
                            <p className="text-sm text-slate-500 font-medium mb-6">Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais.</p>
                            <button
                              onClick={() => setContactStatus('idle')}
                              style={{ 
                                backgroundColor: contactSection?.cta1_bg_color || '#4f46e5',
                                color: contactSection?.cta1_text_color || '#ffffff'
                              }}
                              className="px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-all text-sm"
                            >
                              Envoyer un autre message
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={handleContactSubmit} className="w-full space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom</label>
                                <input
                                  required
                                  type="text"
                                  value={contactForm.name}
                                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                                  placeholder="Nom et Prenom"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</label>
                                <input
                                  required
                                  type="email"
                                  value={contactForm.email}
                                  onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                                  placeholder="votre@email.com"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sujet</label>
                              <input
                                required
                                type="text"
                                value={contactForm.subject}
                                onChange={e => setContactForm({ ...contactForm, subject: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm"
                                placeholder="Comment pouvons-nous vous aider ?"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message</label>
                              <textarea
                                required
                                rows={4}
                                value={contactForm.message}
                                onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm resize-none"
                                placeholder="Votre message..."
                              ></textarea>
                            </div>
                            <button
                              type="submit"
                              disabled={contactStatus === 'loading'}
                              style={{ 
                                backgroundColor: contactSection?.cta1_bg_color || '#4f46e5',
                                color: contactSection?.cta1_text_color || '#ffffff'
                              }}
                              className="w-full py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              {contactStatus === 'loading' ? 'Envoi...' : (contactSection?.section_button_label || 'Envoyer le message')} <Send size={18} />
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          <AnimatePresence>
            {selectedConseil && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedConseil(null)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-2xl overflow-hidden"
                >
                  <button
                    onClick={() => setSelectedConseil(null)}
                    className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors z-10"
                  >
                    <X size={20} />
                  </button>

                  <div className="p-8 md:p-12">
                    <div className="flex items-center gap-2 text-indigo-600 mb-4">
                      <Info size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/80">Conseil & Astuce</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
                      {selectedConseil.title}
                    </h3>
                    <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                      <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-line text-lg">
                        {selectedConseil.content}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedConseil(null)}
                      className="mt-8 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs"
                    >
                      Fermer le guide
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </AnimatePresence>
      </main>
      <Footer settings={settings} />
    </div>
  );
}

function Footer({ settings }: { settings: AppSettings }) {
  const isSticky = String(settings.sticky_footer) === 'true';
  return (
    <footer
      className={`${isSticky ? 'fixed bottom-0 left-0 right-0' : 'relative'} py-1 border-t border-slate-100 z-40`}
      style={{
        backgroundColor: settings.footer_color || '#ffffff',
        color: settings.footer_text_color || 'inherit'
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-50">
            © 2026 {settings.app_name}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Waves, CheckCircle2, Plus, Minus, MapPin, Mail, Phone, Instagram, Facebook, Twitter, Send, LayoutDashboard, Navigation } from 'lucide-react';
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


interface Spot {
  id: number;
  name: string;
  description: string;
  lat: number;
  lng: number;
  image_url?: string;
  difficulty: 'debutant' | 'intermediaire' | 'expert';
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
  useEffect(() => {
    fetch('/api/public/content')
      .then(res => res.json())
      .then(data => {
        setContent(data.content);
        setServices(data.services);
        setSpots(data.spots || []);
        setConseils(data.conseils || []);

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

  const NavLinks = () => {
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
                className={`text-[12px] font-bold transition-colors uppercase tracking-widest px-2 text-left lg:text-center ${currentPage === s.key ? 'text-slate-400' : ''}`}
                style={{ color: currentPage !== s.key ? (settings.nav_text_color || settings.header_text_color || '#475569') : undefined }}
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
        className={`${String(settings.sticky_header) === 'true' ? 'fixed' : 'absolute'} top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-slate-200/50 transition-all`}
        style={{
          backgroundColor: settings.header_color ? `${settings.header_color}cc` : 'rgba(255, 255, 255, 0.85)',
          color: settings.header_text_color || '#0f172a'
        }}
      >
        <div className="w-full px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentPage('about')}>
            {settings.app_logo && (
              <img src={settings.app_logo} alt={settings.app_name} className="h-8 w-auto object-contain transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-black uppercase tracking-tighter leading-none" style={{ color: settings.header_text_color || '#0f172a' }}>{settings.app_name}</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <NavLinks />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={isAdminPreview ? onBackToAdmin : onLoginClick}
              className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-widest px-2"
            >
              Dashboard
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              {isMobileMenuOpen ? <Plus size={20} className="rotate-45" /> : <div className="space-y-1"><div className="w-5 h-0.5 bg-slate-900"></div><div className="w-5 h-0.5 bg-slate-900"></div><div className="w-5 h-0.5 bg-slate-900"></div></div>}
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
                <NavLinks />
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
        className={`flex-grow pt-10 flex flex-col relative transition-all duration-500 ${(String(settings.sticky_footer) === 'true' && !['about', 'spots', 'contact'].includes(currentPage)) ? 'pb-12' : ''}`}
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
              className="flex-grow flex flex-col relative justify-center pt-8 pb-16 z-10"
            >

              <div className="w-full relative z-10">
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-black mb-3 tracking-tight" style={{ color: settings.title_color || '#0f172a' }}>{settings.services_title || ''}</h2>
                  <p className="text-lg font-medium max-w-2xl mx-auto" style={{ color: settings.subtitle_color || '#64748b' }}>{settings.services_subtitle || ''}</p>
                </div>
                <div className="flex flex-wrap lg:flex-nowrap justify-center gap-4 lg:gap-3 pb-6 px-0 lg:px-4">
                  {activeServices.map((service) => (
                    <div
                      key={service.id}
                      className="bg-slate-100/40 backdrop-blur-sm p-3 lg:p-2.5 rounded-2xl border border-slate-200/60 flex flex-col w-full min-w-[240px] lg:min-w-[190px] max-w-[260px] lg:max-w-[240px] snap-start shadow-sm hover:shadow-md transition-shadow"
                    >
                      {service.image_url && (
                        <div className="aspect-video rounded-xl overflow-hidden mb-2">
                          <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <h3 className="text-base lg:text-base font-black mb-0.5 tracking-tight" style={{ color: settings.title_color || '#0f172a' }}>{service.name}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        {service.discount_percentage > 0 && (
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[9px] font-black uppercase tracking-widest">
                            -{service.discount_percentage}%
                          </span>
                        )}
                      </div>
                      <p className="font-medium mb-3 leading-snug text-xs lg:text-[11px] whitespace-pre-line flex-grow line-clamp-3" style={{ color: settings.subtitle_color || '#64748b' }}>
                        <span className="text-indigo-600 font-bold lg:text-[11px]">{service.sessions_count || 1} {Number(service.sessions_count || 1) > 1 ? 'séances' : 'séance'} - </span>
                        {service.description}
                      </p>
                      <div className="mt-auto space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Prix</span>
                          {service.discount_percentage > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 line-through font-bold">
                                {service.price} DH
                              </span>
                              <span className="text-base font-black text-indigo-600">
                                {Math.round(service.price * (1 - (service.discount_percentage || 0) / 100))} DH
                              </span>
                            </div>
                          ) : (
                            <span className="text-base font-black text-indigo-600">{service.price} DH</span>
                          )}
                        </div>
                        <button
                          onClick={() => { setReservation(prev => ({ ...prev, service_id: service.id.toString() })); setCurrentPage('reserve'); }}
                          className="w-full px-3 py-2 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-all text-[11px] lg:text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-100/50"
                        >
                          Réserver
                        </button>
                      </div>
                    </div>
                  ))}
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
                  <div className="w-full h-[300px] md:h-auto md:w-[45%] lg:w-[48%] shrink-0 relative bg-slate-100">
                    <div className="absolute inset-0 overflow-hidden">
                      {about?.video_url ? (
                        <video
                          src={about.video_url}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <img
                          src={about?.image_url}
                          alt="À Propos"
                          className="w-full h-full object-cover object-center"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                  </div>
                  <div className={`flex-1 flex justify-start items-center flex-col px-6 pt-4 ${String(settings.sticky_footer) === 'true' ? 'pb-12' : 'pb-6'} md:pb-10`}>
                    <div className="max-w-xl text-center">
                      {!!about?.show_logo && settings.app_logo && (
                        <img src={settings.app_logo} alt={settings.app_name} className="h-48 w-auto object-contain mx-auto mb-0" referrerPolicy="no-referrer" />
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
                      {!!about?.show_button && (
                        <button
                          onClick={() => setCurrentPage((about?.button_link as any) || 'reserve')}
                          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all text-base uppercase tracking-widest"
                        >
                          {about?.section_button_label || 'Réserver un cours'}
                        </button>
                      )}
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
              className="flex-grow flex flex-col relative justify-center pt-8 pb-16 z-10"
            >
              <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-10">
                  <h2 className="text-4xl font-black mb-3 tracking-tight" style={{ color: settings.title_color || '#0f172a' }}>{settings.conseils_title || ''}</h2>
                  <p className="text-lg font-medium max-w-2xl mx-auto" style={{ color: settings.subtitle_color || '#64748b' }}>{settings.conseils_subtitle || ''}</p>
                </div>
                <div className="flex flex-wrap lg:flex-nowrap justify-center gap-4 lg:gap-3 pb-6 px-0 lg:px-4">
                  {conseils.filter(c => c.is_active).map((conseil) => (
                    <div
                      key={conseil.id}
                      className="bg-slate-100/40 backdrop-blur-sm p-3 lg:p-2.5 rounded-2xl border border-slate-200/60 flex flex-col w-full min-w-[240px] lg:min-w-[190px] max-w-[260px] lg:max-w-[240px] snap-start shadow-sm hover:shadow-md transition-shadow"
                    >
                      {conseil.image_url && (
                        <div className="aspect-video rounded-xl overflow-hidden mb-2 bg-slate-50/50 flex items-center justify-center">
                          <img src={conseil.image_url} alt={conseil.title} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <h3 className="text-lg font-black mb-1 tracking-tight" style={{ color: settings.title_color || '#0f172a' }}>{conseil.title}</h3>
                      <p className="font-medium mb-4 leading-relaxed text-sm whitespace-pre-line" style={{ color: settings.subtitle_color || '#64748b' }}>
                        {conseil.content}
                      </p>
                    </div>
                  ))}
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

              <section className="flex-grow flex items-center justify-center p-4 py-2 relative z-10">
                <div className={`w-full max-w-4xl mx-auto flex flex-col ${settings.reserve_layout === 'split' ? 'lg:flex-row lg:items-center gap-12' : 'items-center'}`}>
                  <div className={`w-full ${settings.reserve_layout === 'split' ? 'lg:w-1/2' : 'max-w-xl'}`}>
                    <div className="text-center mb-10">
                      <h2 className="text-4xl font-black mb-3 tracking-tight" style={{ color: settings.title_color || '#0f172a' }}>{settings.reserve_title || ''}</h2>
                      <p className="text-lg font-medium" style={{ color: settings.subtitle_color || '#64748b' }}>{settings.reserve_subtitle || ''}</p>
                    </div>
                    <div className="bg-slate-100/40 backdrop-blur-sm p-2 md:p-3 rounded-3xl border border-slate-200/60">
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

              <div className="w-full flex-grow flex flex-col lg:flex-row items-stretch relative z-10 overflow-hidden">
                {/* Left Content Column */}
                <div className="w-full lg:w-[45%] p-8 lg:p-12 xl:p-16 flex flex-col justify-center overflow-y-auto scrollbar-premium">
                  <div className="max-w-xl">
                    <h2 className="text-4xl lg:text-5xl font-black mb-10 tracking-tight leading-tight" style={{ color: settings.title_color || '#0f172a' }}>
                      {settings.spots_title || ''}
                    </h2>
                    <p className="text-xl font-bold mb-8 leading-relaxed" style={{ color: settings.subtitle_color || '#475569' }}>
                      {settings.spots_subtitle || ''}
                    </p>
                    <div className="text-base text-slate-300 font-medium leading-relaxed space-y-4">
                      <p>
                        {settings.spots_content || ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Map Column */}
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
                            <div className="w-56 bg-white p-1">
                              <div className="aspect-video rounded-xl overflow-hidden mb-3 bg-slate-50 border border-slate-100">
                                {spot.image_url ? (
                                  <img src={spot.image_url} alt={spot.name} className="w-full h-full object-cover" />
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
                                        'bg-rose-100 text-rose-600'
                                      }`}>
                                      {spot.difficulty}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 line-clamp-2 font-medium uppercase tracking-tight leading-tight">{spot.description}</p>
                                </div>
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 flex items-center justify-center w-7 h-7 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm mt-0.5"
                                  title="Itinéraire vers ce spot"
                                >
                                  <Navigation size={12} className="ml-px" />
                                </a>
                              </div>

                              <div className="flex flex-col gap-2">
                                {spot.suggestion_name && (
                                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-2 mt-0.5">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">
                                      SUGGESTION {spot.suggestion_type ? `- ${spot.suggestion_type}` : ''}
                                    </p>
                                    {spot.suggestion_link ? (
                                      <a
                                        href={spot.suggestion_link.startsWith('http') ? spot.suggestion_link : `https://${spot.suggestion_link}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline truncate block"
                                      >
                                        {spot.suggestion_name}
                                      </a>
                                    ) : (
                                      <p className="text-xs font-bold text-indigo-700 truncate">{spot.suggestion_name}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>

                  </div>
                </div>
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
              className="flex-grow flex flex-col justify-center py-12"
            >
              <section className="flex-grow flex items-stretch">
                <div className="flex flex-col md:flex-row items-stretch w-full flex-grow">
                  <div className={`flex-1 flex flex-col justify-center pt-4 md:py-6 ${String(settings.sticky_footer) === 'true' ? 'pb-24' : 'pb-4'} pl-6 lg:pl-16`}>
                    <div className="max-w-md w-full">
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

                  {settings.app_logo && (
                    <div className="hidden lg:flex flex-col items-center justify-center self-center px-12 lg:px-24">
                      <div className="w-px h-12 bg-gradient-to-b from-transparent via-slate-200 to-transparent mb-4" />
                      <img src={settings.app_logo} alt={settings.app_name} className="h-80 w-auto object-contain transition-transform hover:scale-105" referrerPolicy="no-referrer" />
                      <div className="w-px h-12 bg-gradient-to-t from-transparent via-slate-200 to-transparent mt-4" />
                    </div>
                  )}

                  <div className="flex-1 flex items-center justify-center px-6 lg:px-12 py-4 md:py-6 relative overflow-hidden">
                    <div className="bg-slate-100/40 backdrop-blur-md p-8 lg:p-10 rounded-3xl border border-slate-200/60 shadow-xl max-w-xl w-full relative z-10">
                      {contactStatus === 'success' ? (
                        <div className="text-center py-8 w-full">
                          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} />
                          </div>
                          <h3 className="text-2xl font-black text-slate-900 mb-2">Message Envoyé !</h3>
                          <p className="text-sm text-slate-500 font-medium mb-6">Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais.</p>
                          <button
                            onClick={() => setContactStatus('idle')}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm"
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
                            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {contactStatus === 'loading' ? 'Envoi...' : 'Envoyer le message'} <Send size={18} />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
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
            © 2026 {settings.app_name || 'Mon Site'}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

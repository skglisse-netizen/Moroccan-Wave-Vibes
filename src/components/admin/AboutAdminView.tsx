import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, LandingPageContent } from '../../types';
import { Button, Input, Card, Modal } from './UIComponents';
import { FileText, Upload, Settings, Check } from 'lucide-react';

export function AboutAdminView({ content, onUpdate, user, onUpdateContent }: { 
  content: LandingPageContent[], 
  onUpdate: (params?: any) => Promise<void>, 
  user: User, 
  onUpdateContent: (section: string, data: any) => Promise<void> 
}) {
  const initialAbout = (content || []).find(c => c.section === 'about') || { 
    section: 'about',
    title: '', 
    content: '', 
    image_url: '', 
    video_url: '', 
    title_style: '', 
    content_style: '',
    button_label: '',
    section_button_label: 'Réserver un cours',
    show_logo: true,
    show_button: true,
    button_link: 'reserve',
    is_active: true
  };
  
  const [aboutForm, setAboutForm] = useState(initialAbout);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    if (initialAbout) setAboutForm(initialAbout);
  }, [content]);

  const applyRichStyle = (field: 'title' | 'content', color: string) => {
    const textarea = document.getElementById(`about-${field}-textarea`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    if (start === end) return;

    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + `<span style="color: ${color}">${selectedText}</span>` + text.substring(end);

    setAboutForm(prev => ({ ...prev, [field]: newText }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + `<span style="color: ${color}">`.length + selectedText.length + '</span>'.length);
    }, 10);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const res = await fetch('/api/upload/media', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (res.ok) {
        const { url } = await res.json();
        setAboutForm(prev => ({ ...prev, [type === 'image' ? 'image_url' : 'video_url']: url }));
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const StyleControls = ({ value, onChange, onApplyRichColor }: { value: string, onChange: (val: string) => void, onApplyRichColor?: (color: string) => void }) => {
    const styles = value ? JSON.parse(value) : {};
    return (
      <div className="flex flex-wrap items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2">
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Couleur</label>
          <input 
            type="color" 
            value={styles.color || '#000000'} 
            onChange={(e: any) => onChange(JSON.stringify({ ...styles, color: e.target.value }))}
            className="w-8 h-8 p-0 border-2 border-white rounded-full overflow-hidden cursor-pointer shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taille (px)</label>
          <input 
            type="number" 
            min="8" 
            max="120"
            value={styles.fontSize || ''} 
            placeholder="Auto"
            onChange={(e) => onChange(JSON.stringify({ ...styles, fontSize: e.target.value ? parseInt(e.target.value) : undefined }))}
            className="w-16 px-2 py-1 text-xs font-bold border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Épaisseur</label>
          <select 
            value={styles.fontWeight || 'normal'} 
            onChange={(e) => onChange(JSON.stringify({ ...styles, fontWeight: e.target.value }))}
            className="px-2 py-1 text-xs font-bold border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="light">Fin</option>
            <option value="normal">Normal</option>
            <option value="medium">Medium</option>
            <option value="semibold">Demi-gras</option>
            <option value="bold">Gras</option>
            <option value="black">Extra-gras</option>
          </select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {onApplyRichColor && (
            <Button variant="ghost" className="text-[10px] px-3 py-1.5 h-auto font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50" onClick={() => onApplyRichColor(styles.color || '#000000')}>
              Appliquer à la sélection
            </Button>
          )}
        </div>
      </div>
    );
  };

  const sectionData = (content || []).find(c => c.section === 'about') || { 
    section: 'about', 
    button_label: '', 
    section_button_label: 'Réserver un cours',
    show_logo: true, 
    show_button: true, 
    button_link: 'reserve', 
    is_active: true 
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">Configuration de la section</h3>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowConfig(!showConfig)}>
            <Settings size={18} /> Configuration
          </Button>
          <Button onClick={() => onUpdateContent('about', aboutForm)}>Enregistrer Tout</Button>
        </div>
      </div>

      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-6 border-indigo-100 bg-indigo-50/10 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
                <div className="w-full">
                  <Input
                    label="Nom dans le menu"
                    defaultValue={sectionData.button_label}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                      const newVal = e.target.value;
                      if (newVal !== sectionData.button_label) {
                        onUpdateContent('about', { ...sectionData, button_label: newVal });
                      }
                    }}
                  />
                </div>
                <div className="w-full">
                  <Input
                    label="Texte du bouton sur la page"
                    defaultValue={sectionData.section_button_label}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                      const newVal = e.target.value;
                      if (newVal !== sectionData.section_button_label) {
                        onUpdateContent('about', { ...sectionData, section_button_label: newVal });
                      }
                    }}
                  />
                </div>
                <div className="w-full">
                  <Input
                    label="Lien du bouton (ex: reserve, contact)"
                    defaultValue={sectionData.button_link}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                      const newVal = e.target.value;
                      if (newVal !== sectionData.button_link) {
                        onUpdateContent('about', { ...sectionData, button_link: newVal });
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col items-center justify-center shrink-0">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 text-center">Visibilité Publique</label>
                  <button
                    type="button"
                    onClick={() => onUpdateContent('about', { ...sectionData, is_active: !sectionData.is_active })}
                    className={`w-12 h-6 rounded-full relative transition-colors ${sectionData.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${sectionData.is_active ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex flex-col items-center justify-center shrink-0">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 text-center">Afficher Bouton</label>
                  <button
                    type="button"
                    onClick={() => onUpdateContent('about', { ...sectionData, show_button: !Boolean(sectionData.show_button) })}
                    className={`w-12 h-6 rounded-full relative transition-colors ${Boolean(sectionData.show_button) ? 'bg-indigo-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${Boolean(sectionData.show_button) ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <div className="flex flex-col items-center justify-center shrink-0">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2 text-center">Afficher Logo</label>
                  <button
                    type="button"
                    onClick={() => onUpdateContent('about', { ...sectionData, show_logo: !Boolean(sectionData.show_logo) })}
                    className={`w-12 h-6 rounded-full relative transition-colors ${Boolean(sectionData.show_logo) ? 'bg-indigo-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${Boolean(sectionData.show_logo) ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText size={20} className="text-indigo-600" /> Contenu de la Section
          </h3>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Titre</label>
            <textarea
              id="about-title-textarea"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold leading-tight h-20"
              value={aboutForm.title}
              onChange={(e) => setAboutForm({ ...aboutForm, title: e.target.value })}
            />
            <StyleControls
              value={aboutForm.title_style || ''}
              onChange={(val) => setAboutForm({ ...aboutForm, title_style: val })}
              onApplyRichColor={(color) => applyRichStyle('title', color)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Description</label>
            <textarea
              id="about-content-textarea"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm h-40"
              value={aboutForm.content}
              onChange={(e) => setAboutForm({ ...aboutForm, content: e.target.value })}
            />
            <StyleControls
              value={aboutForm.content_style || ''}
              onChange={(val) => setAboutForm({ ...aboutForm, content_style: val })}
              onApplyRichColor={(color) => applyRichStyle('content', color)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Image</label>
              <div className="flex gap-2 items-center">
                <Input className="flex-1" placeholder="URL de l'image" value={aboutForm.image_url || ''} onChange={(e: any) => setAboutForm({ ...aboutForm, image_url: e.target.value })} />
                <div className="relative">
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Button variant="secondary"><Upload size={16} /></Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Vidéo (Optionnel)</label>
              <div className="flex gap-2 items-center">
                <Input className="flex-1" placeholder="URL de la vidéo" value={aboutForm.video_url || ''} onChange={(e: any) => setAboutForm({ ...aboutForm, video_url: e.target.value })} />
                <div className="relative">
                  <input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Button variant="secondary"><Upload size={16} /></Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

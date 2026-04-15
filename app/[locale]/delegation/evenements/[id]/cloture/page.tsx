'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { 
  CheckCircle, 
  Image as ImageIcon, 
  Upload, 
  X, 
  FileText, 
  Users,
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';

export default function ClotureEventPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const t = useTranslations('delegation.dashboard.event_closure');
  const tEdit = useTranslations('delegation.dashboard.event_edit'); // reusing some if needed
  const locale = useLocale();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<any>(null);
  
  // Form State
  const [nbParticipants, setNbParticipants] = useState('');
  const [bilanDescription, setBilanDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [compteRenduUrl, setCompteRenduUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Charger infos event
    fetch(`/api/delegation/evenements/${eventId}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
            setEvent(data.data);
            if (data.data.bilanNbParticipants) setNbParticipants(data.data.bilanNbParticipants.toString());
            if (data.data.bilanDescription) setBilanDescription(data.data.bilanDescription);
        }
      })
      .catch(console.error);
  }, [eventId]);

  const handleCompteRenduUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('type', 'EVENT_REPORT');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (res.ok && data.url) {
        setCompteRenduUrl(data.url);
        toast.success(t('report.success'));
      } else {
        toast.error("Erreur upload document");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur upload");
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('type', 'EVENT_BILAN'); 

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (res.ok && data.url) {
        setImages(prev => [...prev, data.url]);
      } else {
         toast.error(tEdit('errors.image_upload_failed'));
      }
    } catch (error) {
      console.error(error);
      toast.error(tEdit('errors.image_upload_failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nbParticipants || !bilanDescription) {
        toast.error(t('validation.required_fields'));
        return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/delegation/evenements/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLOTURE',
          bilanNbParticipants: nbParticipants,
          bilanDescription: bilanDescription,
          images: images,
          compteRenduUrl: compteRenduUrl
        }),
      });

      if (res.ok) {
        router.push('/delegation/evenements');
        router.refresh();
      } else {
        toast.error(t('validation.closure_error'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('validation.server_error'));
    } finally {
      setLoading(false);
    }
  };

  if (!event) return (
     <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
  );

  return (
    <div className={`min-h-screen ${direction === 'rtl' ? 'font-cairo text-right' : 'text-left'}`} dir={direction}>
        <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Header */}
            <div className={`mb-6 flex flex-col ${direction === 'rtl' ? 'items-start text-right' : 'items-start text-left'}`}>
                <Link 
                    href="/delegation/evenements"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-4 transition-colors group font-bold text-sm no-underline"
                    dir={direction}
                >
                    <ArrowRight size={20} className={`${direction === 'rtl' ? 'rotate-180' : ''} group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform`} />
                    <span>{t('breadcrumbs')}</span>
                </Link>

                <div className={`flex items-center gap-4 mb-2 w-full`}>
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl text-white shadow-lg shadow-green-200 shrink-0">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className={`text-2xl font-black text-gray-900 leading-tight text-start`}>
                            {t('title')}
                        </h1>
                        <p className={`text-gray-500 font-medium italic text-start`}>
                            {t('event_label')} <span className="font-bold text-blue-600 not-italic">{event.titre}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex items-start gap-4 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full -translate-y-16 translate-x-16 blur-3xl group-hover:bg-amber-100 transition-colors" />
                <div className="p-2.5 bg-white rounded-xl text-amber-600 shadow-sm shrink-0 relative z-10">
                    <AlertCircle size={22} />
                </div>
                <div className={`text-amber-900 py-0.5 relative z-10 w-full text-start`}>
                    <p className="font-bold text-base mb-1">{t('info_box.title')}</p>
                    <p className="text-sm font-medium opacity-90 leading-relaxed font-cairo">{t('info_box.text')}</p>
                </div>
            </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            
                {/* Bilan Chiffré */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                    <div className={`flex items-center gap-3 mb-6`} dir={direction}>
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                            <Users className="w-5 h-5" />
                        </div>
                        <h2 className={`text-lg font-bold text-gray-800 text-start w-full`}>
                            {t('participation.title')}
                        </h2>
                    </div>
                    <div className="space-y-3">
                        <label className={`block text-sm font-bold text-gray-700 text-start w-full`}>
                            {t('participation.real_count')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                            <input
                                type="number"
                                dir={direction}
                                value={nbParticipants}
                                onChange={(e) => setNbParticipants(e.target.value)}
                                placeholder={t('participation.placeholder')}
                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-sm ${direction === 'rtl' ? 'text-right pr-4 pl-12' : 'text-left pl-4 pr-12'}`}
                                required
                            />
                            <div className={`absolute top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none ${direction === 'rtl' ? 'left-4' : 'right-4'}`}>
                                <Users size={20} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bilan Qualitatif */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300">
                    <div className={`flex items-center gap-3 mb-6`} dir={direction}>
                        <div className="p-2 bg-purple-50 rounded-xl text-purple-600 shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h2 className={`text-lg font-bold text-gray-800 text-start w-full`}>
                            {t('qualitative.title')}
                        </h2>
                    </div>
                    <div className="space-y-3">
                        <label className={`block text-sm font-bold text-gray-700 text-start w-full`}>
                            {t('qualitative.label')} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={6}
                            dir={direction}
                            value={bilanDescription}
                            onChange={(e) => setBilanDescription(e.target.value)}
                            placeholder={t('qualitative.placeholder')}
                            className={`w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-bold text-sm leading-relaxed resize-none ${direction === 'rtl' ? 'text-right' : 'text-left'}`}
                            required
                        />
                    </div>
                </div>


                {/* Compte Rendu (Document) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300">
                    <div className={`flex items-center gap-3 mb-6`} dir={direction}>
                        <div className="p-2 bg-orange-50 rounded-xl text-orange-600">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h2 className={`text-lg font-bold text-gray-800 w-full ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                            {t('report.title')}
                        </h2>
                    </div>
                    <div className="space-y-3">
                        <label className={`block text-sm font-bold text-gray-700 text-start w-full`}>{t('report.label')}</label>
                        
                        {compteRenduUrl ? (
                            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl shadow-inner">
                            <div className="flex items-center gap-3 text-green-700">
                                <CheckCircle size={22} className="fill-green-100" />
                                <span className="font-bold">{t('report.success')}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setCompteRenduUrl(null)}
                                className="text-red-500 hover:text-white p-2 hover:bg-red-500 rounded-lg transition-all"
                            >
                                <X size={20} />
                            </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-orange-50/30 hover:border-orange-400 transition-all group relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                                        <Upload className="w-7 h-7 text-gray-400 group-hover:text-orange-600 transition-colors" />
                                    </div>
                                    <p className="text-base font-bold text-gray-700 mb-1 group-hover:text-orange-800 transition-colors">{t('report.upload_text')}</p>
                                    <p className="text-sm text-gray-400 font-medium italic">{t('report.formats')}</p>
                                </div>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    accept=".pdf,image/*" 
                                    onChange={handleCompteRenduUpload}
                                    disabled={uploading}
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* Galerie Photos */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">
                            {t('gallery.title')}
                        </h2>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group shadow-sm hover:shadow-md transition-all">
                                <img src={img} alt="Souvenir" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                    <button 
                                        type="button"
                                        onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                        className="bg-red-500 text-white p-3 rounded-xl hover:bg-red-600 transition-all transform hover:scale-110 shadow-xl"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        
                        <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-400 transition-all group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/0 to-indigo-50/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                            {uploading ? (
                                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            ) : (
                                <div className="flex flex-col items-center relative z-10 transition-transform group-hover:translate-y-[-2px]">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-2 shadow-sm group-hover:shadow-md transition-all">
                                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-600 group-hover:text-indigo-800 transition-colors">{t('gallery.add')}</span>
                                </div>
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                    </div>
                    <p className="text-xs font-medium text-gray-400 italic flex items-center gap-1.5">
                        <AlertCircle size={14} />
                        {t('gallery.hint')}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-100">
                    <Link
                        href="/delegation/evenements"
                        className="px-8 py-3.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all font-bold text-sm"
                    >
                        {t('buttons.cancel')}
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-10 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-xl hover:shadow-green-500/30 hover:-translate-y-0.5 transition-all font-bold text-sm flex items-center gap-3 disabled:opacity-50 disabled:transform-none"
                    >
                        {loading ? (
                             <>
                                <Loader2 size={24} className="animate-spin" />
                                {t('buttons.processing')}
                             </>
                        ) : (
                            <>
                                <CheckCircle size={24} />
                                {t('buttons.confirm')}
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    </div>
  );
}

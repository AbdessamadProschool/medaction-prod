'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import Link from 'next/link';
import { toast } from 'sonner';

export default function ClotureEventPage({ params }: { params: { id: string } }) {
  const t = useTranslations('delegation.dashboard.event_closure');
  const tEdit = useTranslations('delegation.dashboard.event_edit'); // reusing some if needed
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
    fetch(`/api/delegation/evenements/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
            setEvent(data.data);
            if (data.data.bilanNbParticipants) setNbParticipants(data.data.bilanNbParticipants.toString());
            if (data.data.bilanDescription) setBilanDescription(data.data.bilanDescription);
        }
      })
      .catch(console.error);
  }, [params.id]);

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
      const res = await fetch(`/api/delegation/evenements/${params.id}`, {
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
    <div className="min-h-screen font-sans" dir="rtl">
        <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
            <Link 
                href="/delegation/evenements"
                className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors group font-bold"
            >
                <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>{t('breadcrumbs')}</span>
            </Link>

            <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-2xl text-green-600">
                    <CheckCircle className="w-8 h-8" />
                </div>
                {t('title')}
            </h1>
            <p className="text-gray-600 mt-2 font-medium text-lg">
                {t('event_label')} <span className="font-bold text-gray-900 text-xl">{event.titre}</span>
            </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-sm">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0">
               <AlertCircle size={24} />
            </div>
            <div className="text-amber-900 py-1">
                <p className="font-bold text-lg mb-1">{t('info_box.title')}</p>
                <p className="font-medium opacity-90 leading-relaxed">{t('info_box.text')}</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Bilan Chiffré */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-all duration-300">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                   <Users className="w-6 h-6" />
                </div>
                {t('participation.title')}
            </h2>
            <div className="space-y-3">
                <label className="block text-base font-bold text-gray-800">{t('participation.real_count')}</label>
                <div className="relative group">
                    <input
                        type="number"
                        dir="rtl"
                        value={nbParticipants}
                        onChange={(e) => setNbParticipants(e.target.value)}
                        placeholder={t('participation.placeholder')}
                        className="w-full px-6 py-4 pr-14 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-lg"
                        required
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                        <Users size={24} />
                    </div>
                </div>
            </div>
            </div>

            {/* Bilan Qualitatif */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-all duration-300">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                  <FileText className="w-6 h-6" />
                </div>
                {t('qualitative.title')}
            </h2>
            <div className="space-y-3">
                <label className="block text-base font-bold text-gray-800">{t('qualitative.label')}</label>
                <textarea
                    rows={6}
                    dir="rtl"
                    value={bilanDescription}
                    onChange={(e) => setBilanDescription(e.target.value)}
                    placeholder={t('qualitative.placeholder')}
                    className="w-full px-6 py-4 rounded-2xl border border-gray-200 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition-all font-medium text-lg leading-relaxed"
                    required
                />
            </div>
            </div>


            {/* Compte Rendu (Document) */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-all duration-300">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                   <FileText className="w-6 h-6" />
                </div>
                {t('report.title')}
            </h2>
            <div className="space-y-3">
                <label className="block text-base font-bold text-gray-800">{t('report.label')}</label>
                
                {compteRenduUrl ? (
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-2xl">
                    <div className="flex items-center gap-3 text-green-700">
                        <CheckCircle size={20} className="fill-green-100" />
                        <span className="font-bold">{t('report.success')}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCompteRenduUrl(null)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-3 border-dashed border-gray-200 rounded-3xl cursor-pointer hover:bg-gray-50/50 hover:border-orange-300 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                             <Upload className="w-6 h-6 text-gray-500 group-hover:text-orange-600 transition-colors" />
                        </div>
                        <p className="text-lg font-bold text-gray-700 mb-1 group-hover:text-orange-700 transition-colors">{t('report.upload_text')}</p>
                        <p className="text-sm text-gray-400 font-medium">{t('report.formats')}</p>
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
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-all duration-300">
             <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                  <ImageIcon className="w-6 h-6" />
                </div>
                {t('gallery.title')}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 group shadow-sm">
                        <img src={img} alt="Souvenir" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                                type="button"
                                onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                className="bg-red-500 text-white p-2.5 rounded-xl hover:bg-red-600 transition-colors transform hover:scale-110 shadow-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                
                <label className="aspect-square border-3 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/30 hover:border-indigo-300 transition-all group">
                    {uploading ? (
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    ) : (
                        <>
                          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2 group-hover:bg-WHITE group-hover:shadow-sm transition-all">
                             <Upload className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                          </div>
                          <span className="text-sm font-bold text-gray-500 group-hover:text-indigo-700 transition-colors">{t('gallery.add')}</span>
                        </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                </label>
            </div>
            <p className="text-sm font-medium text-gray-400">{t('gallery.hint')}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-6 pt-6 border-t border-gray-200">
                <Link
                    href="/delegation/evenements"
                    className="px-8 py-4 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-bold text-lg"
                >
                    {t('buttons.cancel')}
                </Link>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-1 transition-all shadow-green-900/10 font-bold text-lg flex items-center gap-3 disabled:opacity-50 disabled:transform-none"
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

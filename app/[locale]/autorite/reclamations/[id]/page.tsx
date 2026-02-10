
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  User,
  Phone,
  Mail,
  Building2,
  MessageSquare,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Send,
  Download,
  ArrowRight,
} from 'lucide-react';
import DownloadPhotosButton from '@/components/reclamations/DownloadPhotosButton';

interface Reclamation {
  id: number;
  titre: string;
  description: string;
  categorie: string;
  dateAffectation: string;
  createdAt: string;
  dateResolution: string | null;
  solutionApportee: string | null;
  quartierDouar: string | null;
  adresseComplete: string | null;
  latitude: number | null;
  longitude: number | null;
  commune: { id: number; nom: string };
  user: { id: number; nom: string; prenom: string; telephone: string | null; email: string };
  etablissement: { id: number; nom: string; secteur: string } | null;
  medias: { id: number; urlPublique: string; type: string }[];
  historique: { id: number; action: string; details: any; createdAt: string }[];
}

export default function ReclamationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('authority_reclamation_detail');
  const tCommon = useTranslations('common'); // Fallback or global
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [reclamation, setReclamation] = useState<Reclamation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [solution, setSolution] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  useEffect(() => {
    fetchReclamation();
  }, [params.id]);

  const fetchReclamation = async () => {
    try {
      const res = await fetch(`/api/autorite/reclamations/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setReclamation(data.data);
        setSolution(data.data.solutionApportee || '');
      } else if (res.status === 404) {
        router.push('/autorite/reclamations');
      }
    } catch (error) {
      console.error('Erreur chargement réclamation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!solution.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/autorite/reclamations/${params.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solution }),
      });

      if (res.ok) {
        await fetchReclamation();
        setShowResolveForm(false);
      }
    } catch (error) {
      console.error('Erreur résolution:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-4 border-gov-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!reclamation) {
    return (
      <div className={`flex flex-col items-center justify-center py-24 text-center ${isRtl ? 'font-cairo' : ''}`}>
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('not_found.title')}</h3>
        <Link 
          href="/autorite/reclamations" 
          className="text-gov-blue hover:text-blue-700 font-medium flex items-center gap-2 transition-colors"
        >
          {isRtl ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
          {t('not_found.back')}
        </Link>
      </div>
    );
  }

  const isResolue = reclamation.dateResolution !== null;
  const joursDepuisAffectation = reclamation.dateAffectation 
    ? Math.floor((Date.now() - new Date(reclamation.dateAffectation).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div className={`space-y-8 ${isRtl ? 'font-cairo' : ''}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <Link
          href="/autorite/reclamations"
          className="p-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm group self-start"
        >
          <BackIcon size={22} className="text-gray-600 group-hover:text-gov-blue transition-colors" />
        </Link>
        
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className={`px-3 py-1 rounded-full text-sm font-bold shadow-sm ${
              isResolue
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-amber-100 text-amber-700 border border-amber-200'
            }`}>
              {isResolue ? t('status.resolved') : t('status.pending')}
            </span>
            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 shadow-sm">
              {reclamation.categorie}
            </span>
          </div>
          
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">
            {reclamation.titre}
          </h1>
          
          <p className="text-gray-500 font-medium flex items-center gap-2">
            <Clock size={16} />
            {t('assigned_since', { days: joursDepuisAffectation, id: reclamation.id })}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 overflow-hidden relative"
          >
            {/* Décoration d'arrière-plan */}
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <MessageSquare size={120} />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <MessageSquare size={20} className="text-gov-blue" />
              </div>
              {t('description')}
            </h2>
            <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100/50 relative z-10">
               <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                 {reclamation.description}
               </p>
            </div>
          </motion.div>

          {/* Photos */}
          {reclamation.medias.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <ImageIcon size={20} className="text-indigo-600" />
                  </div>
                  {t('photos', { count: reclamation.medias.filter(m => m.type === 'IMAGE').length })}
                </h2>
                <DownloadPhotosButton
                  reclamationId={reclamation.id}
                  photoCount={reclamation.medias.filter(m => m.type === 'IMAGE').length}
                  variant="button"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {reclamation.medias.map((media) => (
                  <a
                    key={media.id}
                    href={media.urlPublique}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-video rounded-xl overflow-hidden bg-gray-100 group relative border border-gray-200 shadow-sm"
                  >
                    <img
                      src={media.urlPublique}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* Solution apportée */}
          {isResolue && reclamation.solutionApportee && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-green-50/50 rounded-2xl p-6 md:p-8 shadow-sm border border-green-100 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-100/50 rounded-full blur-3xl -mr-10 -mt-10" />
              
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
                {t('solution.title')}
              </h2>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-green-100 shadow-sm relative z-10">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{reclamation.solutionApportee}</p>
                <div className="mt-4 pt-4 border-t border-green-100 flex items-center gap-2 text-sm text-green-700 font-medium">
                  <Clock size={14} />
                  {t('solution.date', { date: formatDate(reclamation.dateResolution!) })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Formulaire de résolution */}
          {!isResolue && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-lg ring-1 ring-black/5"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gov-blue/10 flex items-center justify-center">
                  <Send size={20} className="text-gov-blue" />
                </div>
                {t('resolve_form.title')}
              </h2>
              
              {showResolveForm ? (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        {t('resolve_form.label')}
                    </label>
                    <textarea
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue transition-all bg-gray-50 resize-y"
                      placeholder={t('resolve_form.placeholder')}
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleResolve}
                      disabled={!solution.trim() || submitting}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:shadow-none"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                      {t('resolve_form.submit')}
                    </button>
                    <button
                      onClick={() => setShowResolveForm(false)}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors border border-gray-200"
                    >
                      {t('resolve_form.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowResolveForm(true)}
                  className="w-full py-4 bg-gov-blue text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/10 group"
                >
                  <CheckCircle size={20} className="group-hover:scale-110 transition-transform" />
                  {t('resolve_form.open_btn')}
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Citoyen */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 pb-3 border-b border-gray-50">
              <User size={18} className="text-gov-blue" />
              {t('citizen.title')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gov-blue to-blue-700 flex items-center justify-center text-white text-xl font-bold shadow-md">
                  {reclamation.user.prenom.charAt(0)}{reclamation.user.nom.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">
                    {reclamation.user.prenom} {reclamation.user.nom}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Demandeur</p>
                </div>
              </div>
              
              {reclamation.user.telephone && (
                <a
                  href={`tel:${reclamation.user.telephone}`}
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-xl text-green-700 hover:bg-green-100 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <Phone size={16} className="text-green-600" />
                  </div>
                  <span className="font-medium font-outfit" dir="ltr">{reclamation.user.telephone}</span>
                </a>
              )}
              
              <a
                href={`mailto:${reclamation.user.email}`}
                className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <Mail size={16} className="text-blue-600" />
                </div>
                <span className="font-medium truncate">{reclamation.user.email}</span>
              </a>
            </div>
          </motion.div>

          {/* Localisation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 pb-3 border-b border-gray-50">
              <MapPin size={18} className="text-gov-blue" />
              {t('location.title')}
            </h3>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="font-bold text-gray-900 mb-1">{reclamation.commune.nom}</p>
                {reclamation.quartierDouar && (
                  <p className="text-sm text-gray-600 mb-1">{reclamation.quartierDouar}</p>
                )}
                {reclamation.adresseComplete && (
                   <p className="text-sm text-gray-500 leading-relaxed">{reclamation.adresseComplete}</p>
                )}
              </div>

              {reclamation.latitude && reclamation.longitude && (
                <a
                  href={`https://maps.google.com/?q=${reclamation.latitude},${reclamation.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-gov-blue/30 text-gov-blue rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors"
                >
                   <MapPin size={16} />
                   {t('location.view_map')}
                </a>
              )}
            </div>
          </motion.div>

          {/* Établissement concerné */}
          {reclamation.etablissement && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 pb-3 border-b border-gray-50">
                <Building2 size={18} className="text-gov-blue" />
                {t('establishment.title')}
              </h3>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="font-bold text-gray-900">{reclamation.etablissement.nom}</p>
                <p className="text-sm text-amber-700 font-medium mt-1">{reclamation.etablissement.secteur}</p>
              </div>
              {/* Link disabled until generic page is ready */}
              {/* <Link
                  href={`/etablissements/${reclamation.etablissement.id}`}
                  className="block mt-3 text-sm text-[hsl(213,80%,28%)] hover:underline font-medium text-center"
                >
                  {t('establishment.view_sheet')}
                </Link> */}
            </motion.div>
          )}

          {/* Dates clés */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2 pb-3 border-b border-gray-50">
              <Calendar size={18} className="text-gov-blue" />
              {t('dates.title')}
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg">
                <span className="text-gray-500 text-sm font-medium">{t('dates.submitted')}</span>
                <span className="font-bold text-gray-900 text-sm">
                  {formatDate(reclamation.createdAt)}
                </span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg">
                <span className="text-gray-500 text-sm font-medium">{t('dates.assigned')}</span>
                <span className="font-bold text-gray-900 text-sm">
                  {formatDate(reclamation.dateAffectation)}
                </span>
              </div>
              {reclamation.dateResolution && (
                <div className="flex justify-between items-center bg-green-50 p-2.5 rounded-lg border border-green-100">
                  <span className="text-green-700 text-sm font-medium">{t('dates.resolved')}</span>
                  <span className="font-bold text-green-800 text-sm">
                    {formatDate(reclamation.dateResolution)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

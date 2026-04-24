'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
import DemandeForm from '@/app/components/etablissements/workflow/DemandeForm';
import { ChevronLeft, Loader2, Building2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function DemandeModificationPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const t = useTranslations('establishments_workflow');
  const [etablissement, setEtablissement] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEtablissement = async () => {
      try {
        const res = await fetch(`/api/etablissements/${params.id}`);
        const data = await res.json();
        if (res.ok) {
          setEtablissement(data.data);
        } else {
          toast.error("Établissement non trouvé");
        }
      } catch (err) {
        toast.error("Erreur serveur");
      } finally {
        setLoading(false);
      }
    };

    fetchEtablissement();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (!etablissement) {
    return (
      <div className="p-20 text-center text-gray-500">
        <Building2 size={64} className="mx-auto mb-4 opacity-10" />
        <p>L'établissement est introuvable. Veuillez contacter un administrateur.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in">
      <Link 
        href="/delegation/etablissements" 
        className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors font-bold text-sm"
      >
        <ChevronLeft size={16} />
        {t('back_list')}
      </Link>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
           <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none rounded-lg px-3 py-1">#{etablissement.code}</Badge>
           <h1 className="text-3xl font-black text-gray-900 dark:text-white">{t('request_edit')}</h1>
        </div>
        <p className="text-gray-500 mt-2">{t('update_etab')}: <span className="text-emerald-600 font-bold">{etablissement.nom}</span></p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 p-8 pt-10 relative">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 opacity-5 pointer-events-none ltr:right-0 rtl:left-0">
           <Building2 size={180} />
        </div>
        <DemandeForm 
          type="MODIFICATION" 
          initialData={etablissement} 
          etablissementId={parseInt(params.id)} 
        />
      </div>
    </div>
  );
}


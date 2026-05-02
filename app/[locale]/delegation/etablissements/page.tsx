'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  MapPin, 
  Plus, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  Filter,
  Layers,
  History
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function DelegationEtablissementsPage() {
  const t = useTranslations('establishments_workflow');
  const te = useTranslations('admin.establishments');
  const [etablissements, setEtablissements] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEtablissements = async () => {
      try {
        const res = await fetch(`/api/etablissements?search=${search}&limit=50`);
        const data = await res.json();
        if (res.ok) {
          setEtablissements(data.data);
        }
      } catch (err) {
        toast.error("Erreur lors du chargement des établissements");
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchEtablissements, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Section Historique (Déplacée en haut) */}
      <div className="pb-2">
         <div className="bg-gradient-to-br from-[hsl(213,80%,28%)] to-[hsl(213,80%,20%)] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none rotate-12">
               <History size={220} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="text-center md:text-start">
                  <h2 className="text-2xl font-black flex items-center justify-center md:justify-start gap-3 text-white">
                     <div className="p-2 bg-white/10 rounded-xl border border-white/10">
                        <History className="text-white" size={24} />
                     </div>
                     {t('pending_requests_title')}
                  </h2>
                  <p className="text-blue-100 mt-3 max-w-md text-base leading-relaxed font-medium">
                     {t('pending_requests_desc')}
                  </p>
               </div>
               <Link href="/delegation/etablissements/mes-demandes">
                  <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl px-10 py-7 backdrop-blur-md font-bold text-base transition-all active:scale-95 shadow-lg">
                     {t('view_history')}
                     <ChevronRight className="ltr:ml-2 rtl:mr-2 rtl:rotate-180" size={20} />
                  </Button>
               </Link>
            </div>
         </div>
      </div>

      {/* Barre de Recherche + Bouton Création */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        <div className="relative group flex-1">
          <Search className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[hsl(213,80%,28%)] transition-colors" size={20} />
          <input
            type="text"
            placeholder={te('search_placeholder') || "Rechercher un établissement..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full ltr:pl-12 rtl:pr-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-gray-900 dark:text-white font-medium"
          />
        </div>
        <Link href="/delegation/etablissements/nouveau">
           <Button className="bg-[hsl(213,80%,28%)] hover:bg-[hsl(213,80%,20%)] text-white rounded-2xl px-8 py-7 shadow-lg shadow-blue-900/10 h-full whitespace-nowrap font-bold text-base">
             <Plus className="ltr:mr-2 rtl:ml-2" size={22} />
             {t('request_creation')}
           </Button>
        </Link>
      </div>

      {/* Liste des Établissements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
          ))
        ) : etablissements.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-gray-900/40 rounded-3xl border border-dashed border-gray-200">
            <Building2 className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 font-medium">Aucun établissement trouvé</p>
          </div>
        ) : (
          etablissements.map(e => (
            <div key={e.id} className="group bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <Badge variant="outline" className="bg-blue-50 text-[hsl(213,80%,28%)] border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 font-bold px-3 py-1 rounded-lg">
                  {e.secteur}
                </Badge>
                <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">#{e.code}</span>
              </div>

              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-[hsl(213,80%,28%)] transition-colors">{e.nom}</h3>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6 font-medium">
                <MapPin size={14} className="shrink-0 text-gray-400" />
                <span className="truncate">{e.commune?.nom}</span>
              </div>

              <div className="flex gap-2">
                <Link href={`/etablissements/${e.id}`} className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl border-gray-100 py-6 font-bold hover:bg-blue-50 hover:text-[hsl(213,80%,28%)] dark:hover:bg-blue-900/20 group-hover:border-blue-200 transition-all">
                    <Building2 size={18} className="ltr:mr-2 rtl:ml-2" />
                    {te('view_details') || 'Voir les détails'}
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>


    </div>
  );
}

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
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Building2 className="text-emerald-500" size={32} />
            {t('title')}
          </h1>
          <p className="text-gray-500 mt-2">{t('subtitle')}</p>
        </div>
        <Link href="/delegation/etablissements/nouveau">
           <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-6 py-6 shadow-lg shadow-emerald-200 dark:shadow-none">
             <Plus className="mr-2" size={20} />
             {t('request_creation')}
           </Button>
        </Link>
      </div>

      {/* Barre de Recherche */}
      <div className="relative group">
        <Search className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Rechercher un établissement par nom ou code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full ltr:pl-12 rtl:pr-12 pr-4 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
        />
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
            <p className="text-gray-500">Aucun établissement trouvé</p>
          </div>
        ) : (
          etablissements.map(e => (
            <div key={e.id} className="group bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400">
                  {e.secteur}
                </Badge>
                <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">#{e.code}</span>
              </div>

              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 line-clamp-1">{e.nom}</h3>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <MapPin size={14} className="shrink-0" />
                <span className="truncate">{e.commune?.nom}</span>
              </div>

              <div className="flex gap-2">
                <Link href={`/delegation/etablissements/${e.id}/demande-modification`} className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl border-gray-100 py-5 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/20 group-hover:border-emerald-200">
                    <Edit3 size={16} className="mr-2" />
                    {t('request_edit')}
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Section Historique */}
      <div className="pt-12">
         <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
               <Clock size={200} />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
               <div>
                  <h2 className="text-2xl font-black flex items-center gap-2">
                     <History className="text-orange-400" />
                     Mes demandes en cours
                  </h2>
                  <p className="text-gray-400 mt-1">Suivez l'état de validation de vos propositions par l'administration.</p>
               </div>
               <Link href="/delegation/etablissements/mes-demandes">
                  <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl px-8 py-6 backdrop-blur-md">
                     Voir l'historique
                     <ChevronRight className="ml-2" size={18} />
                  </Button>
               </Link>
            </div>
         </div>
      </div>
    </div>
  );
}

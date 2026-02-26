'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, List, ArrowRight } from 'lucide-react';
import { PermissionGuard } from '@/hooks/use-permission';

export default function ReclamationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Si l'utilisateur est connecté, le rediriger vers ses réclamations
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/mes-reclamations');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[hsl(213,80%,28%)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[hsl(213,80%,20%)] py-20 sm:py-24">
        {/* Background Effects */}
        <div className="absolute inset-0">
           <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[hsl(213,80%,30%)] blur-3xl opacity-50" />
           <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[hsl(45,93%,47%)] blur-3xl opacity-20" />
           <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5" />
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-8 border border-white/20 shadow-2xl">
              <MessageSquare size={32} className="text-[hsl(45,93%,47%)]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
              Espace Réclamations Citoyen
            </h1>
            <p className="text-xl text-[hsl(213,20%,90%)] max-w-2xl mx-auto leading-relaxed">
              Contribuez à l'amélioration de votre cadre de vie. Une plateforme transparente et sécurisée pour soumettre et suivre vos requêtes.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Card: Nouvelle Réclamation */}
          <PermissionGuard 
            permission="reclamations.create"
            fallback={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="h-full"
              >
                <Link href={`/login?callbackUrl=${encodeURIComponent('/reclamations/nouvelle')}`} className="block h-full">
                  <div className="bg-white rounded-3xl p-8 h-full shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(45,93%,47%)]/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-[hsl(45,93%,47%)]/20 transition-all" />
                    
                    <div className="w-16 h-16 bg-[hsl(45,93%,47%)]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Plus size={32} className="text-[hsl(45,93%,47%)]" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[hsl(213,80%,28%)] transition-colors">
                      Nouvelle réclamation
                    </h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      Signalez un dysfonctionnement, une anomalie ou un problème concernant un service public.
                    </p>
                    
                    <div className="mt-auto inline-flex items-center gap-2 text-[hsl(213,80%,28%)] font-bold bg-blue-50 px-4 py-2 rounded-xl group-hover:bg-[hsl(213,80%,28%)] group-hover:text-white transition-all">
                      <span>🔒 Se connecter</span>
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            }
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="h-full"
            >
              <Link href="/reclamations/nouvelle" className="block h-full">
                <div className="bg-white rounded-3xl p-8 h-full shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-blue-200 transition-all" />
                  
                  <div className="w-16 h-16 bg-[hsl(213,80%,28%)]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Plus size={32} className="text-[hsl(213,80%,28%)]" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[hsl(213,80%,28%)] transition-colors">
                    Nouvelle réclamation
                  </h2>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Initiez une nouvelle procédure pour signaler un incident ou une insatisfaction.
                  </p>
                  
                  <div className="mt-auto inline-flex items-center gap-2 text-white font-bold bg-[hsl(213,80%,28%)] px-5 py-3 rounded-xl shadow-lg shadow-blue-200 group-hover:bg-[hsl(213,80%,20%)] transition-all">
                    <span>Commencer</span>
                    <ArrowRight size={18} />
                  </div>
                </div>
              </Link>
            </motion.div>
          </PermissionGuard>

          {/* Card: Mes Réclamations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="h-full"
          >
            <Link href={session ? '/mes-reclamations' : '/login?callbackUrl=/mes-reclamations'} className="block h-full">
              <div className="bg-white rounded-3xl p-8 h-full shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 group relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-emerald-200 transition-all" />

                <div className="w-16 h-16 bg-emerald-100/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <List size={32} className="text-emerald-700" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-700 transition-colors">
                  Suivre mes dossiers
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Consultez l'état d'avancement de vos réclamations et interagissez avec l'administration.
                </p>
                
                <div className="mt-auto inline-flex items-center gap-2 text-emerald-800 font-bold bg-emerald-50 px-5 py-3 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <span>{session ? 'Accéder au suivi' : 'Se connecter'}</span>
                  <ArrowRight size={18} />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Process Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-20 mb-16"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900">Processus de traitement</h3>
            <p className="text-gray-500 mt-2">Votre demande suit un parcours structuré pour garantir une réponse adaptée</p>
          </div>

          <div className="relative grid md:grid-cols-3 gap-8">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-[hsl(213,80%,80%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)] opacity-30" />

            {[
              {
                step: '1',
                title: 'Soumission',
                desc: 'Remplissez le formulaire et joignez vos preuves.',
                icon: '📝',
                color: 'bg-blue-100 text-blue-700'
              },
              {
                step: '2',
                title: 'Traitement',
                desc: 'Analyse par les services compétents.',
                icon: '⚙️',
                color: 'bg-[hsl(45,93%,85%)] text-[hsl(45,93%,35%)]'
              },
              {
                step: '3',
                title: 'Résolution',
                desc: 'Réponse officielle et clôture du dossier.',
                icon: '✅',
                color: 'bg-emerald-100 text-emerald-700'
              },
            ].map((item, i) => (
              <div key={i} className="relative flex flex-col items-center text-center group">
                <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg mb-4 relative z-10 group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600 px-4">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

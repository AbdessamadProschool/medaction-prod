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
        <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gov-blue-dark py-20 sm:py-24">
        {/* Background Effects */}
        <div className="absolute inset-0">
           <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-gov-blue-dark blur-3xl opacity-50" />
           <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-gov-gold blur-3xl opacity-20" />
           <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center mb-8">
              <MessageSquare size={40} className="text-gov-gold" />
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
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gov-gold/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-gov-gold/20 transition-all" />
                    
                    <div className="mb-6">
                      <Plus size={32} className="text-gov-gold mb-4" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gov-blue transition-colors">
                      Nouvelle réclamation
                    </h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                      Signalez un dysfonctionnement, une anomalie ou un problème concernant un service public.
                    </p>
                    
                    <div className="mt-auto inline-flex items-center gap-2 text-gov-blue font-bold bg-blue-50 px-4 py-2 rounded-xl group-hover:bg-gov-blue group-hover:text-white transition-all">
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
                  
                  <div className="mb-6">
                    <Plus size={32} className="text-gov-blue mb-4" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gov-blue transition-colors">
                    Nouvelle réclamation
                  </h2>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Initiez une nouvelle procédure pour signaler un incident ou une insatisfaction.
                  </p>
                  
                  <div className="mt-auto inline-flex items-center gap-2 text-white font-bold bg-gov-blue px-5 py-3 rounded-xl shadow-lg shadow-blue-200 group-hover:bg-gov-blue-dark transition-all">
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
                 <div className="absolute top-0 right-0 w-32 h-32 bg-gov-green/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-gov-green/10 transition-all" />

                <div className="mb-6">
                  <List size={32} className="text-gov-green-dark mb-4" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gov-green-dark transition-colors">
                  Suivre mes dossiers
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Consultez l'état d'avancement de vos réclamations et interagissez avec l'administration.
                </p>
                
                <div className="mt-auto inline-flex items-center gap-2 text-gov-green-dark font-bold bg-gov-green/5 px-5 py-3 rounded-xl group-hover:bg-gov-green group-hover:text-white transition-all">
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
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-[hsl(213,80%,80%)] via-gov-gold to-gov-green opacity-30" />

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
                color: 'bg-gov-green/10 text-gov-green-dark'
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

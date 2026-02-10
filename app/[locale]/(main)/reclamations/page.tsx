'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header - Gouvernemental */}
      <div className="bg-gradient-to-br from-[hsl(213,80%,20%)] to-[hsl(213,80%,30%)] py-16 relative">
        {/* Bande tricolore */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(348,83%,47%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)]" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageSquare size={40} className="text-[hsl(45,93%,47%)]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Espace Réclamations
            </h1>
            <p className="text-lg text-[hsl(45,93%,70%)] max-w-2xl mx-auto">
              Faites entendre votre voix. Soumettez vos réclamations et suivez leur traitement en temps réel.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Nouvelle réclamation */}
          <PermissionGuard 
            permission="reclamations.create"
            fallback={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Link href={`/login?callbackUrl=${encodeURIComponent('/reclamations/nouvelle')}`} className="block">
                  <div className="gov-card gov-card-official p-8 h-full hover:shadow-xl transition-shadow group">
                    <div className="w-14 h-14 bg-[hsl(45,93%,47%)]/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[hsl(45,93%,47%)] transition-colors">
                      <Plus size={28} className="text-[hsl(45,93%,47%)] group-hover:text-gray-900 transition-colors" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Nouvelle réclamation
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Signalez un problème concernant un établissement ou un service public de la province.
                    </p>
                    <span className="inline-flex items-center gap-2 text-[hsl(213,80%,28%)] font-medium group-hover:gap-3 transition-all">
                      🔒 Se connecter pour signaler
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            }
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Link href="/reclamations/nouvelle" className="block">
                <div className="gov-card gov-card-official p-8 h-full hover:shadow-xl transition-shadow group">
                  <div className="w-14 h-14 bg-[hsl(45,93%,47%)]/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[hsl(45,93%,47%)] transition-colors">
                    <Plus size={28} className="text-[hsl(45,93%,47%)] group-hover:text-gray-900 transition-colors" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Nouvelle réclamation
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Signalez un problème concernant un établissement ou un service public de la province.
                  </p>
                  <span className="inline-flex items-center gap-2 text-[hsl(213,80%,28%)] font-medium group-hover:gap-3 transition-all">
                    Soumettre une réclamation
                    <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            </motion.div>
          </PermissionGuard>

          {/* Mes réclamations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link href={session ? '/mes-reclamations' : '/login?callbackUrl=/mes-reclamations'} className="block">
              <div className="gov-card p-8 h-full hover:shadow-xl transition-shadow group border-2 border-transparent hover:border-[hsl(213,80%,28%)]/20">
                <div className="w-14 h-14 bg-[hsl(213,80%,28%)]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[hsl(213,80%,28%)] transition-colors">
                  <List size={28} className="text-[hsl(213,80%,28%)] group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Mes réclamations
                </h2>
                <p className="text-gray-600 mb-4">
                  Consultez l'historique et le statut de toutes vos réclamations soumises.
                </p>
                <span className="inline-flex items-center gap-2 text-[hsl(213,80%,28%)] font-medium group-hover:gap-3 transition-all">
                  {session ? 'Voir mes réclamations' : 'Se connecter pour accéder'}
                  <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Informations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 gov-card p-8"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4">Comment ça marche ?</h3>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Soumettez',
                desc: 'Décrivez votre réclamation et joignez des photos si nécessaire',
              },
              {
                step: '2',
                title: 'Suivi en temps réel',
                desc: 'Recevez des notifications à chaque étape du traitement',
              },
              {
                step: '3',
                title: 'Résolution',
                desc: 'Votre réclamation est traitée par les services concernés',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 bg-[hsl(45,93%,47%)] rounded-full flex items-center justify-center text-gray-900 font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqData = [
  {
    category: "Général",
    questions: [
      {
        q: "Qu'est-ce que Médiouna Action ?",
        a: "Médiouna Action est une plateforme participative numérique initiée par la Province de Médiouna. Elle permet aux citoyens de s'informer, de signaler des problèmes, de proposer des idées et de participer activement à la vie locale."
      },
      {
        q: "L'inscription est-elle obligatoire ?",
        a: "L'accès aux informations publiques est libre. Cependant, pour soumettre une réclamation, proposer une idée ou participer à des sondages, la création d'un compte est nécessaire pour assurer l'authenticité des échanges."
      }
    ]
  },
  {
    category: "Réclamations",
    questions: [
      {
        q: "Comment déposer une réclamation ?",
        a: "Connectez-vous à votre compte, cliquez sur le bouton 'Nouvelle Réclamation', remplissez le formulaire en précisant le lieu et la nature du problème, et ajoutez des photos si possible. Vous recevrez un numéro de suivi."
      },
      {
        q: "Quel est le délai de traitement ?",
        a: "Le délai varie selon la nature et la complexité de la demande. En général, une première réponse ou prise en charge est effectuée sous 48h ouvrables. Vous pouvez suivre l'avancement en temps réel depuis votre espace personnel."
      }
    ]
  },
  {
    category: "Compte & Sécurité",
    questions: [
      {
        q: "Mes données personnelles sont-elles protégées ?",
        a: "Oui, nous prenons la protection de vos données très au sérieux. Elles sont traitées conformément à la loi 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel."
      },
      {
        q: "Comment modifier mon mot de passe ?",
        a: "Rendez-vous dans votre espace 'Profil', section 'Sécurité'. Vous pourrez y modifier votre mot de passe et gérer vos options de connexion."
      }
    ]
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="bg-gradient-to-br from-[hsl(213,80%,20%)] to-[hsl(213,80%,30%)] py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Questions Fréquentes
          </h1>
          <p className="text-xl text-[hsl(45,93%,70%)] max-w-2xl mx-auto">
            Trouvez rapidement des réponses à vos questions sur l'utilisation de la plateforme.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="space-y-12">
          {faqData.map((section, sIndex) => (
            <div key={sIndex}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="w-8 h-1 bg-emerald-500 rounded-full"></span>
                {section.category}
              </h2>
              <div className="space-y-4">
                {section.questions.map((item, qIndex) => {
                  const id = `${sIndex}-${qIndex}`;
                  const isOpen = openIndex === id;

                  return (
                    <div 
                      key={qIndex}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-shadow hover:shadow-md"
                    >
                      <button
                        onClick={() => toggle(id)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 focus:outline-none"
                      >
                        <span className="font-medium text-gray-900 text-lg">{item.q}</span>
                        <span className={`transform transition-transform duration-300 text-emerald-600 ${isOpen ? 'rotate-180' : ''}`}>
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </span>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-blue-50 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Vous n'avez pas trouvé votre réponse ?</h3>
          <p className="text-gray-600 mb-6">Notre équipe est là pour vous aider.</p>
          <a 
            href="/contact" 
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Contactez le support
          </a>
        </div>
      </div>
    </div>
  );
}

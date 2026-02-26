// Types d'activités organisés par catégorie pour les centres sociaux
export interface TypeActivite {
  value: string;
  label: string;
  category: string;
  icon?: string;
}

export const ACTIVITY_CATEGORIES = [
  { id: 'education', label: '📚 Éducatives & Formation', color: 'blue' },
  { id: 'culturel', label: '🎨 Culturelles & Artistiques', color: 'purple' },
  { id: 'sport', label: '⚽ Sportives & Loisirs', color: 'green' },
  { id: 'social', label: '🌱 Sociales & Citoyennes', color: 'emerald' },
  { id: 'professionnel', label: '💼 Insertion Professionnelle', color: 'amber' },
  { id: 'developpement', label: '🧠 Développement Personnel', color: 'pink' },
  { id: 'sante', label: '🩺 Sensibilisation & Santé', color: 'red' },
  { id: 'public', label: '👨‍👩‍👧‍👦 Spécifiques par Public', color: 'indigo' },
  { id: 'religieux', label: '🕌 Religieuses & Éthiques', color: 'teal' },
] as const;

export const ACTIVITY_TYPES: TypeActivite[] = [
  // 📚 1. Activités Éducatives & de Formation
  { value: 'soutien_scolaire_primaire', label: 'Soutien scolaire - Primaire', category: 'education' },
  { value: 'soutien_scolaire_college', label: 'Soutien scolaire - Collège', category: 'education' },
  { value: 'soutien_scolaire_lycee', label: 'Soutien scolaire - Lycée', category: 'education' },
  { value: 'alphabetisation_adultes', label: 'Alphabétisation adultes', category: 'education' },
  { value: 'alphabetisation_femmes', label: 'Alphabétisation femmes', category: 'education' },
  { value: 'cours_arabe', label: 'Cours d\'arabe', category: 'education' },
  { value: 'cours_francais', label: 'Cours de français', category: 'education' },
  { value: 'cours_anglais', label: 'Cours d\'anglais', category: 'education' },
  { value: 'aide_devoirs', label: 'Aide aux devoirs', category: 'education' },
  { value: 'informatique_bureautique', label: 'Formation informatique et bureautique', category: 'education' },
  { value: 'preparation_examens', label: 'Préparation aux examens', category: 'education' },

  // 🎨 2. Activités Culturelles & Artistiques
  { value: 'theatre', label: 'Théâtre et expression dramatique', category: 'culturel' },
  { value: 'musique_chant', label: 'Musique - Chant', category: 'culturel' },
  { value: 'musique_instruments', label: 'Musique - Instruments', category: 'culturel' },
  { value: 'dessin_peinture', label: 'Dessin, peinture et arts plastiques', category: 'culturel' },
  { value: 'danse_traditionnelle', label: 'Danse traditionnelle', category: 'culturel' },
  { value: 'danse_moderne', label: 'Danse moderne', category: 'culturel' },
  { value: 'calligraphie', label: 'Calligraphie', category: 'culturel' },
  { value: 'cine_club', label: 'Ciné-club et débats culturels', category: 'culturel' },

  // ⚽ 3. Activités Sportives & de Loisirs
  { value: 'football', label: 'Football', category: 'sport' },
  { value: 'basketball', label: 'Basketball', category: 'sport' },
  { value: 'volleyball', label: 'Volleyball', category: 'sport' },
  { value: 'karate', label: 'Karaté', category: 'sport' },
  { value: 'taekwondo', label: 'Taekwondo', category: 'sport' },
  { value: 'fitness', label: 'Fitness, gymnastique', category: 'sport' },
  { value: 'jeux_societe', label: 'Jeux de société (échecs, dames)', category: 'sport' },
  { value: 'tournois_sportifs', label: 'Tournois sportifs', category: 'sport' },
  { value: 'loisirs_enfants', label: 'Activités récréatives pour enfants', category: 'sport' },

  // 🌱 4. Activités Sociales & Citoyennes
  { value: 'citoyennete', label: 'Sensibilisation à la citoyenneté', category: 'social' },
  { value: 'volontariat', label: 'Volontariat et actions solidaires', category: 'social' },
  { value: 'proprete', label: 'Campagnes de propreté', category: 'social' },
  { value: 'environnement', label: 'Activités environnementales', category: 'social' },
  { value: 'droits_humains', label: 'Éducation aux droits humains', category: 'social' },
  { value: 'mediation_sociale', label: 'Médiation sociale', category: 'social' },

  // 💼 5. Activités d'Insertion Professionnelle
  { value: 'orientation_pro', label: 'Orientation professionnelle', category: 'professionnel' },
  { value: 'recherche_emploi', label: 'Ateliers de recherche d\'emploi', category: 'professionnel' },
  { value: 'cv_entretien', label: 'Rédaction CV et préparation entretiens', category: 'professionnel' },
  { value: 'entrepreneuriat', label: 'Initiation à l\'entrepreneuriat', category: 'professionnel' },
  { value: 'formation_couture', label: 'Formation couture', category: 'professionnel' },
  { value: 'formation_coiffure', label: 'Formation coiffure', category: 'professionnel' },
  { value: 'formation_cuisine', label: 'Formation cuisine', category: 'professionnel' },
  { value: 'formation_menuiserie', label: 'Formation menuiserie', category: 'professionnel' },
  { value: 'cooperatives', label: 'Coopératives et économie sociale', category: 'professionnel' },

  // 🧠 6. Activités de Développement Personnel
  { value: 'communication', label: 'Communication et confiance en soi', category: 'developpement' },
  { value: 'leadership', label: 'Leadership et travail d\'équipe', category: 'developpement' },
  { value: 'gestion_stress', label: 'Gestion du stress', category: 'developpement' },
  { value: 'education_financiere', label: 'Éducation financière de base', category: 'developpement' },
  { value: 'coaching_jeunes', label: 'Coaching pour jeunes', category: 'developpement' },

  // 🩺 7. Activités de Sensibilisation & Santé
  { value: 'hygiene_sante', label: 'Sensibilisation hygiène et santé', category: 'sante' },
  { value: 'prevention_addictions', label: 'Prévention des addictions', category: 'sante' },
  { value: 'sante_reproductive', label: 'Santé reproductive', category: 'sante' },
  { value: 'sante_mentale', label: 'Santé mentale', category: 'sante' },
  { value: 'premiers_secours', label: 'Premiers secours', category: 'sante' },

  // 👨‍👩‍👧‍👦 8. Activités Spécifiques par Public
  { value: 'activites_enfants', label: 'Activités pour enfants', category: 'public' },
  { value: 'programmes_jeunes', label: 'Programmes pour jeunes', category: 'public' },
  { value: 'activites_femmes', label: 'Activités pour femmes', category: 'public' },
  { value: 'activites_handicap', label: 'Activités pour personnes en situation de handicap', category: 'public' },
  { value: 'activites_seniors', label: 'Activités pour seniors', category: 'public' },

  // 🕌 9. Activités Religieuses & Éthiques
  { value: 'education_religieuse', label: 'Cours d\'éducation religieuse', category: 'religieux' },
  { value: 'valeurs_morales', label: 'Valeurs morales et éthiques', category: 'religieux' },
  { value: 'concours_coran', label: 'Concours de récitation du Coran', category: 'religieux' },
];

// Regrouper les types par catégorie
export const getActivityTypesByCategory = () => {
  const grouped: Record<string, TypeActivite[]> = {};
  
  ACTIVITY_TYPES.forEach(type => {
    if (!grouped[type.category]) {
      grouped[type.category] = [];
    }
    grouped[type.category].push(type);
  });
  
  return grouped;
};

// Heures simplifiées (8h à 22h)
export const HOURS_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const hour = i + 8;
  return {
    value: hour.toString(),
    label: `${hour}h00`,
  };
});

// Obtenir le label d'un type d'activité par sa valeur
export const getActivityTypeLabel = (value: string): string => {
  const type = ACTIVITY_TYPES.find(t => t.value === value);
  return type?.label || value;
};

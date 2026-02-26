export interface EtablissementScoreInput {
  evenementsCount?: number;
  activitesCount?: number;
  reclamationsCount?: number;
  evaluationsCount?: number;
  abonnementsCount?: number;
  actualitesCount?: number;
  noteMoyenne?: number;
}

export const getEtabScore = (e: EtablissementScoreInput): number => {
  // 1. Events (10 pts each)
  const eventScore = (e.evenementsCount || 0) * 10;
  
  // 2. Activities (9 pts each)
  const activityScore = (e.activitesCount || 0) * 9;

  // 3. Campaigns (3 pts each) - Placeholder: 20% of events are campaigns
  const campaignScore = (e.evenementsCount || 0) * 0.2 * 3; 

  // 4. Reclamations (-0.5 per rec, +0.1 resolved slow, +0.3 resolved fast)
  // Net estimate: -0.4 per count (avg)
  const reclamationScore = (e.reclamationsCount || 0) * -0.4;

  // 5. User Reviews (0.1 per review)
  const reviewScore = (e.evaluationsCount || 0) * 0.1;

  // 6. Subscriptions (0.3 per subscriber)
  const subScore = (e.abonnementsCount || 0) * 0.3;

  // 7. Articles/News (0.3 per article)
  const newsScore = (e.actualitesCount || 0) * 0.3;

  let total = eventScore + activityScore + campaignScore + reclamationScore + reviewScore + subScore + newsScore;
  
  // Ensure non-negative score
  return Math.max(0, total);
};

export const checkUrgency = (e: { reclamationsCount?: number; noteMoyenne?: number; nombreEvaluations?: number }) => {
  // Urgent if Reclamations are high OR Rating is very low
  const criticalReclamations = (e.reclamationsCount || 0) >= 3;
  const criticalRating = (e.noteMoyenne || 5) < 2.5 && (e.nombreEvaluations || 0) > 2;
  return criticalReclamations || criticalRating;
};

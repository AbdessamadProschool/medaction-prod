/**
 * Utility for mapping territory names (communes, annexes) when database data is missing
 * specific translations.
 */

export const TERRITORY_NAMES_AR: Record<string, string> = {
  // Communes
  'MEDIOUNA': 'مديونة',
  'TIT MELLIL': 'تيط مليل',
  'LAHRAOUIYINE': 'الهراويين',
  'SIDI HAJJAJ OUED HASSAR': 'سيدي حجاج',
  'MAJJATIA OULED TALEB': 'مجاطية',
  'Majjatia Ouled Taleb': 'مجاطية',
  'Sidi Hajjaj Oued Hassar': 'سيدي حجاج',
  'Lahraouiyine': 'الهراويين',
  'Tit Mellil': 'تيط مليل',
  'Mediouna': 'مديونة',
  
  // Annexes
  'Annexes Administratives': 'الملحقات الإدارية',
  'Administration': 'الإدارة',
  'Bureau': 'مكتب',
  'Centre': 'مركز',
  'MAJJATIA': 'مجاطية',
  'RASCHAD': 'الرشاد',
  'AL HAMD': 'الحمد',
  'ABRAR': 'أبرار',
  'ZERKTOUNI': 'الزرقطوني',
  'BADR': 'بدر',
  'RAHMA': 'الرحمة',
  'HAJ MOUSSA': 'حاج موسى',
  'VILLE NOUVELLE': 'المدينة الجديدة',
  'NASR ALLAH': 'نصر الله',
  'RIAD': 'الرياض',
  'OULED HADDA': 'أولاد حدة',
  'CHAMS EL MADINA': 'شمس المدينة',
  'ALIA BADR': 'عليا بدر',
  'SIDI HAJJAJ': 'سيدي حجاج',
  'ZONE INDUSTRIELLE': 'الحي الصناعي',
  'HALHAL': 'حلهال',
};

/**
 * Gets the localized name for a territory (commune or annexe)
 */
export function getLocalizedCommuneName(territory: { nom: string; nomArabe?: string | null }, locale: string): string {
  if (locale === 'ar') {
    if (territory.nomArabe) return territory.nomArabe;
    
    const upperNom = territory.nom.toUpperCase();
    if (TERRITORY_NAMES_AR[upperNom]) return TERRITORY_NAMES_AR[upperNom];
    if (TERRITORY_NAMES_AR[territory.nom]) return TERRITORY_NAMES_AR[territory.nom];
    
    // Check for partial matches
    for (const [key, value] of Object.entries(TERRITORY_NAMES_AR)) {
      if (upperNom.includes(key.toUpperCase())) return value;
    }
    
    return territory.nom;
  }
  
  return territory.nom;
}

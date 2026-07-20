// lib/utils.ts
export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Décode les entités HTML courantes dans une chaîne de texte.
 * Utilisé pour corriger les descriptions stockées avec double-encodage en DB.
 * Compatible SSR et client (pas de dépendance au DOM).
 */
export function decodeHtmlEntities(str: string): string {
  if (!str || typeof str !== 'string') return str ?? '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&([a-zA-Z]+);/g, (match) => {
      const entities: Record<string, string> = {
        laquo: '«', raquo: '»', mdash: '—', ndash: '–',
        hellip: '…', ldquo: '"', rdquo: '"', lsquo: '\u2018', rsquo: '\u2019',
      };
      return entities[match.slice(1, -1)] ?? match;
    });
}

---
name: Portail Médiouna (MedAction)
description: Plateforme gouvernementale de services citoyens pour la Province de Médiouna, Maroc.
colors:
  bleu-administratif: "#0E4281"
  bleu-administratif-profond: "#0A2F5C"
  bleu-administratif-clair: "#1A6AB5"
  rouge-drapeau: "#DA1851"
  rouge-drapeau-profond: "#AD1340"
  or-royal: "#E7B408"
  or-royal-profond: "#B68E06"
  vert-officiel: "#1E8550"
  vert-officiel-profond: "#155C37"
  surface-claire: "#FAFAFA"
  surface-carte: "#FFFFFF"
  texte-principal: "#212530"
  texte-secondaire: "#676C78"
  bordure: "#E3E5E8"
  fond-secondaire: "#EEEFF1"
  fond-muted: "#F3F4F5"
  destructif: "#DE3030"
typography:
  display:
    fontFamily: "Cairo, Noto Kufi Arabic, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Cairo, Noto Kufi Arabic, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.02em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "48px"
components:
  button-primary:
    backgroundColor: "{colors.bleu-administratif}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.bleu-administratif-profond}"
  button-secondary:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.bleu-administratif}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-success:
    backgroundColor: "{colors.vert-officiel}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-danger:
    backgroundColor: "{colors.destructif}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card-default:
    backgroundColor: "{colors.surface-carte}"
    textColor: "{colors.texte-principal}"
    rounded: "{rounded.lg}"
    padding: "24px"
  badge-primary:
    backgroundColor: "#E8EFF8"
    textColor: "{colors.bleu-administratif}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  badge-success:
    backgroundColor: "#E6F5ED"
    textColor: "{colors.vert-officiel}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  badge-warning:
    backgroundColor: "#FEF5E0"
    textColor: "{colors.or-royal-profond}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  badge-danger:
    backgroundColor: "#FDEAEA"
    textColor: "{colors.destructif}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  input-default:
    backgroundColor: "{colors.surface-claire}"
    textColor: "{colors.texte-principal}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
---

# Design System: Portail Médiouna (MedAction)

## 1. Overview

**Creative North Star: "La Gouvernance Moderne"**

Un design sérieux et institutionnel qui privilégie la clarté de l'information, sans fioritures décoratives. Chaque pixel sert un objectif fonctionnel : aider le citoyen à soumettre une réclamation, permettre à l'administrateur de traiter un dossier, offrir au gouverneur une vision stratégique de la province.

Le système visuel s'enracine dans l'identité nationale marocaine : le bleu administratif structure l'autorité, l'or royal accentue les éléments critiques, le vert officiel confirme les actions réussies, le rouge du drapeau signale les alertes. Ces quatre couleurs ne sont jamais décoratives ; elles portent toujours une signification fonctionnelle.

Le portail rejette catégoriquement les esthétiques de startups SaaS (gradients violets, glassmorphisme, animations rebondissantes), les templates de dashboard génériques (grilles de cartes identiques, métriques héroïques) et le design-spectacle. La densité d'information est médiane : assez compacte pour le travail administratif quotidien, assez aérée pour ne jamais submerger un citoyen non-technique.

**Key Characteristics:**
- Clarté institutionnelle : hiérarchie visuelle forte, labels explicites, jamais d'ambiguïté
- Bilingue natif : chaque composant fonctionne en Français (LTR) et Arabe (RTL)
- Plat par défaut : les surfaces sont planes au repos, les ombres n'apparaissent qu'en réponse à une interaction
- Épuré et discret : bordures fines, coins légèrement arrondis, contrastes forts sur le texte

## 2. Colors: La Palette Institutionnelle Marocaine

Une palette à quatre piliers fonctionnels, dérivée de l'identité nationale, complétée par des neutres chauds.

### Primary
- **Bleu Administratif** (hsl(213, 80%, 28%) / #0E4281) : Couleur dominante de l'autorité. En-têtes, sidebar, boutons d'action principale, liens actifs. Utilisé sur maximum 30% de la surface visible.
- **Bleu Administratif Profond** (hsl(213, 80%, 20%) / #0A2F5C) : États hover, dégradés de header, fond de sidebar.
- **Bleu Administratif Clair** (hsl(213, 80%, 45%) / #1A6AB5) : Liens, indicateurs d'information, graphiques.

### Secondary
- **Or Royal** (hsl(45, 93%, 47%) / #E7B408) : Accent d'importance. Bordures de distinction (barre sous le header), badges prioritaires, étoiles d'évaluation. Utilisé avec parcimonie.
- **Or Royal Profond** (hsl(45, 93%, 37%) / #B68E06) : Texte sur fond clair pour les avertissements.

### Tertiary
- **Vert Officiel** (hsl(145, 63%, 32%) / #1E8550) : Confirmation et succès. Badges "résolu", boutons de validation, indicateurs de progression.
- **Rouge Drapeau** (hsl(348, 83%, 47%) / #DA1851) : Alerte et danger. Erreurs de formulaire, boutons de suppression, badges "urgent".

### Neutral
- **Surface Claire** (#FAFAFA) : Fond de page principal. Ni blanc pur (trop clinique) ni gris (trop terne).
- **Surface Carte** (#FFFFFF) : Fond des cartes et des conteneurs surélevés.
- **Texte Principal** (#212530) : Corps de texte. Noir teinté bleu, jamais #000000 pur.
- **Texte Secondaire** (#676C78) : Labels, descriptions, métadonnées. Ratio de contraste ≥ 4.5:1 sur fond clair.
- **Bordure** (#E3E5E8) : Séparateurs, contours d'inputs, diviseurs de tableaux.
- **Fond Secondaire** (#EEEFF1) : Zones désactivées, arrière-plans alternés de tableaux.

### Named Rules
**La Règle des Quatre Piliers.** Chaque couleur sémantique (bleu, or, vert, rouge) porte exactement un rôle fonctionnel. Le bleu = autorité/navigation. L'or = importance/attention. Le vert = succès/confirmation. Le rouge = danger/alerte. Aucune couleur n'est jamais utilisée à des fins purement décoratives.

**La Règle du Contraste.** Tout texte atteint un ratio de contraste WCAG AA minimum de 4.5:1 sur son fond. Le texte secondaire (#676C78) sur fond clair (#FAFAFA) atteint 4.87:1. Aucune exception.

## 3. Typography

**Display/Heading Font:** Cairo (avec fallback Noto Kufi Arabic, sans-serif)
**Body Font:** Inter (avec fallback ui-sans-serif, system-ui)
**Accent Font:** Outfit (avec fallback ui-sans-serif, system-ui) pour les titres latins distinctifs

**Character:** Cairo apporte la gravité institutionnelle nécessaire aux en-têtes et fonctionne nativement en arabe. Inter fournit la lisibilité technique pour le corps de texte dense des tableaux et formulaires administratifs. Le duo est sobre, lisible et professionnel.

### Hierarchy
- **Display** (Cairo, 700, clamp(2rem, 5vw, 3rem), line-height 1.2) : Titre de page principal, héros. Un seul par écran.
- **Headline** (Cairo, 700, clamp(1.5rem, 3vw, 2rem), line-height 1.2) : Titres de section dans les dashboards.
- **Title** (Inter, 600, 1.25rem, line-height 1.4) : En-têtes de cartes, titres de modals, noms de colonnes de tableau.
- **Body** (Inter, 400, 0.875rem, line-height 1.625) : Texte courant, descriptions, contenus de formulaires. Longueur de ligne max : 65-75ch.
- **Label** (Inter, 600, 0.75rem, line-height 1.5, letter-spacing 0.02em) : Labels de champs, légendes de graphiques, métadonnées de tableaux.

### Named Rules
**La Règle Cairo-Inter.** Les en-têtes utilisent toujours Cairo. Le corps utilise toujours Inter. Pas de mélange. En mode RTL (arabe), Cairo s'applique à tout le texte car elle est optimisée pour l'arabe.

**La Règle de l'Échelle.** Chaque niveau typographique est au moins 1.25x plus grand que le niveau inférieur. Pas d'échelles plates : la hiérarchie doit être immédiatement perceptible.

## 4. Elevation

Le système est plat par défaut. Les surfaces sont posées sur un fond neutre sans distinction d'élévation au repos. Les ombres n'apparaissent que comme réponse à un état : survol, focus, menu ouvert. Cette retenue est intentionnelle : un portail gouvernemental ne doit pas ressembler à une interface de jeu avec des éléments flottants.

### Shadow Vocabulary
- **Ambient au repos** (`box-shadow: 0 1px 3px rgba(0,0,0,0.06)`) : Ombre minimale sur les cartes, à peine perceptible. Sépare visuellement la carte du fond sans effet de "flottement".
- **Hover élévation** (`box-shadow: 0 4px 12px rgba(0,0,0,0.08)`) : Apparaît au survol d'une carte ou d'un bouton. Transition douce de 200ms.
- **Menu/Dropdown** (`box-shadow: 0 8px 24px rgba(0,0,0,0.12)`) : Menus déroulants, popovers, modals.

### Named Rules
**La Règle du Repos Plat.** Les surfaces sont plates au repos. Les ombres apparaissent uniquement en réponse à une interaction (hover, focus, ouverture). Si un élément a une ombre permanente, il doit le justifier par sa fonction (ex: sticky header).

## 5. Components

### Buttons
- **Shape:** Coins doucement arrondis (8px radius), jamais de pill-buttons sauf les badges
- **Primary:** Bleu Administratif (#0E4281) + texte blanc, padding 10px 20px, font-weight 600, font-size 0.875rem
- **Hover / Focus:** Fond passe au Bleu Profond (#0A2F5C), ombre 0 4px 12px rgba(0,0,0,0.08) apparaît en 200ms. Focus: ring 2px offset 2px en bleu
- **Secondary:** Fond blanc, bordure 1px solide Bleu Administratif, texte Bleu. Hover: fond bleu à 5% d'opacité
- **Success / Danger:** Vert Officiel / Rouge Drapeau, mêmes proportions que Primary
- **Disabled:** Opacité 50%, cursor not-allowed

### Badges
- **Shape:** Pill (border-radius 9999px), padding 4px 12px, font-size 0.75rem, font-weight 600
- **Variantes:** Fond teinté à 10% de la couleur sémantique, texte en couleur pleine, bordure 1px à 30% d'opacité
- **État:** Statique, pas de hover. Toujours accompagné d'un texte lisible

### Cards / Containers
- **Corner Style:** Coins arrondis (10px radius)
- **Background:** Blanc (#FFFFFF) sur fond page (#FAFAFA)
- **Shadow Strategy:** Ombre minimale au repos (0 1px 3px), hover élévation (0 4px 12px) en 300ms
- **Border:** 1px solid #E3E5E8
- **Internal Padding:** 24px sur desktop, 16px sur mobile
- **Card Officielle:** Barre tricolore de 3px en haut (gradient bleu → or → vert) pour les documents officiels

### Inputs / Fields
- **Style:** Bordure 2px solid #E3E5E8, fond #FAFAFA, border-radius 8px, padding 10px 16px
- **Focus:** Bordure passe au Bleu Administratif, ring 2px en bleu à 20% d'opacité. Transition 200ms
- **Error:** Bordure Rouge Drapeau, message d'erreur en rouge sous le champ
- **Disabled:** Fond #F3F4F5, opacité 50%

### Navigation
- **Header Gouvernemental:** Gradient du Bleu Profond au Bleu Administratif, bordure inférieure 4px Or Royal, texte blanc
- **Sidebar Admin:** Gradient vertical Bleu Profond → Bleu-Gris foncé, items en blanc à 70% d'opacité, item actif : blanc 100% + fond blanc 15% + barre latérale Or Royal
- **Mobile:** Menu hamburger, slide-in panel, transition 200ms ease-out

### Tables Administratives
- **Header:** Fond gradient Bleu Administratif, texte blanc, uppercase, font-size 0.75rem, letter-spacing 0.05em
- **Lignes:** Alternance fond blanc / fond #F3F4F5, hover fond #EEEFF1. Bordure inférieure 1px #E3E5E8
- **Actions:** Icônes Lucide au survol de la ligne

## 6. Do's and Don'ts

### Do:
- **Do** utiliser la palette des quatre piliers (bleu, or, vert, rouge) exclusivement pour leurs rôles fonctionnels assignés
- **Do** vérifier que chaque texte atteint un ratio de contraste WCAG AA ≥ 4.5:1
- **Do** tester chaque composant en mode RTL (arabe) et en mode sombre
- **Do** respecter `prefers-reduced-motion` sur toutes les animations
- **Do** utiliser des ombres uniquement en réponse à une interaction (hover, focus, ouverture)
- **Do** garder les transitions à 200-300ms avec courbe ease-out
- **Do** utiliser des icônes Lucide React flat et monochromes
- **Do** structurer les formulaires avec des labels explicites au-dessus des champs

### Don't:
- **Don't** utiliser de gradients violets, de glassmorphisme ou d'animations rebondissantes (anti-références PRODUCT.md)
- **Don't** créer des grilles de cartes identiques avec icône + titre + texte répétées indéfiniment
- **Don't** utiliser de template "hero-metric" (gros chiffre + petit label + accent gradient)
- **Don't** appliquer de `border-left` ou `border-right` supérieur à 1px comme accent coloré sur les cartes ou alertes
- **Don't** utiliser de `background-clip: text` avec gradient (gradient text)
- **Don't** utiliser #000000 ou #FFFFFF purs. Teinter chaque neutre vers le bleu de la marque
- **Don't** animer les propriétés CSS de layout (width, height, top, left). Utiliser transform et opacity
- **Don't** utiliser de modale comme premier réflexe. Épuiser les alternatives inline et progressives d'abord
- **Don't** mélanger Cairo et Inter dans les en-têtes. Cairo pour les titres, Inter pour le corps
- **Don't** dépasser 65-75 caractères par ligne de texte courant

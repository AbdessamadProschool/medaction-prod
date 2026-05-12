# Product Context: Portail Médiouna (MedAction)

## Product Purpose
Government citizen services platform for the Province of Médiouna, Morocco. Manages complaints (réclamations), public events, campaigns, establishments, and inter-authority coordination. Serves both public-facing citizen interactions and internal administrative workflows.

## Users
- **Citizens**: Submit complaints, track status, evaluate services, discover local events. Non-technical, mobile-first, Arabic/French bilingual.
- **Local Authority Agents (Autorité Locale)**: Process complaints, manage their jurisdiction. Daily administrative work.
- **Coordinators**: Oversee complaint routing and follow-up across sectors.
- **Administrators**: Manage users, permissions, system settings, audit logs.
- **Governor (Gouverneur)**: High-level oversight, statistics, reports, strategic decisions.
- **Super Admin**: Full platform control, license management, backups.

## Brand Personality
- **Institutional**: Official government portal, not a startup product.
- **Trustworthy**: Citizens must feel their complaints are taken seriously.
- **Accessible**: Must work for all literacy levels, bilingual Arabic (RTL) and French (LTR).
- **Professional**: Clean, structured, no decorative excess.
- **Moroccan identity**: Colors derived from the national flag and royal emblems.

## Register
product

## Visual Direction
- Color palette: Moroccan institutional (blue administratif, gold royal, green officiel, red drapeau)
- Typography: Inter (Latin body), Outfit (Latin headings), Cairo (Arabic)
- Tone: Formal but approachable, never playful
- Density: Medium (admin panels need information density without clutter)

## Anti-references
- SaaS startup landing pages (purple gradients, glassmorphism, bouncy animations)
- Generic dashboard templates (identical card grids, hero-metric templates)
- Over-designed marketing sites (design IS NOT the product here)
- Dark-by-default themes (government portals should feel open and transparent)

## Technical Constraints
- Next.js 15 App Router + TypeScript
- Tailwind CSS with custom gov-* design tokens in globals.css
- next-intl for i18n (French + Arabic RTL)
- Framer Motion for animations (already installed)
- Lucide React for icons (already installed)
- Dark mode supported via next-themes
- Must respect prefers-reduced-motion

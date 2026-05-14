// Loading Components
export { default as LoadingScreen, InlineLoader, BrandSkeleton } from './LoadingScreen';
export { default as PageLoader } from './PageLoader';
export { default as Pagination } from './Pagination';

// Core UI Components
export { Button, buttonVariants } from './button';
export { Input } from './input';
export { Textarea } from './textarea';
export { Badge, badgeVariants } from './badge';
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';

// === GOV DESIGN SYSTEM — Étapes 3, 5, 6 ===
/** Étape 3 — Bouton universel gouvernemental */
export { GovButton, govButtonVariants } from './GovButton';
export type { GovButtonProps } from './GovButton';

/** Étape 5 — Carte KPI avec animation et variation */
export { KpiCard, KpiGrid } from './KpiCard';
export type { KpiCardProps, KpiVariant } from './KpiCard';

/** Étape 6 — Badge de statut avec helpers domaine */
export { StatusBadge, resolveReclamationStatus, resolveEvenementStatus } from './StatusBadge';
export type { StatusBadgeProps, ReclamationStatut, EvenementStatut } from './StatusBadge';

// Custom / App Components
export { OptimizedImage, ProfileImage, CardImage, HeroImage, UserAvatar, ImageGallery } from './OptimizedImage';
export { default as EmptyState } from './EmptyState';
export { SafeHTML } from './SafeHTML';
export { StarRating, RatingDistribution, RatingSummary } from './StarRating';
export { default as Breadcrumb } from './Breadcrumb';
export { default as CardSkeleton } from './CardSkeleton';


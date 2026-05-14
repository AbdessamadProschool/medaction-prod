# MedAction Modernization Patterns

Ce document détaille les patterns UI/UX à utiliser pour la modernisation des modules administratifs de la plateforme MedAction, basés sur le système de design gouvernemental.

## 1. Cartes de Statistiques (`gov-stat-card`)

Utilisez cette structure pour les indicateurs clés (KPIs) en haut des pages.

```tsx
<div className="gov-stat-card group hover:shadow-md transition-all">
  <div className="flex items-start justify-between relative z-10">
    <div>
      <p className="gov-stat-label">Total Utilisateurs</p>
      <p className="gov-stat-value">1,234</p>
    </div>
    <div className="gov-stat-icon">
      <Users className="w-6 h-6" />
    </div>
  </div>
  {/* Optionnel: Indicateur de variation */}
  <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-600">
    <TrendingUp className="w-3 h-3" />
    +12% ce mois
  </div>
</div>
```

## 2. Tableaux Administratifs (`gov-table`)

Tous les tableaux doivent être enveloppés dans un `gov-table-wrapper` pour assurer la responsivité.

```tsx
<div className="gov-card overflow-hidden">
  <div className="gov-table-wrapper">
    <table className="gov-table">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Statut</th>
          <th className="gov-table-col-optional">Date</th>
          <th className="text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>...</td>
          <td><span className="gov-badge gov-badge-success">Validé</span></td>
          <td className="gov-table-col-optional">12/05/2026</td>
          <td className="text-right">
             <button className="p-2 hover:bg-muted rounded-lg transition-colors">
               <Eye size={18} />
             </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

## 3. Modaux et Transitions (`AnimatePresence`)

Utilisez `framer-motion` pour des transitions fluides. Les modaux doivent avoir un backdrop flouté.

```tsx
<AnimatePresence>
  {isOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-xl">Titre du Modal</h3>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {/* Contenu */}
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
```

## 4. Gestion des Actions Asynchrones (`toast.promise`)

Ne pas utiliser de `window.confirm` ou de gestion manuelle des états de chargement pour les actions simples. Privilégiez `toast.promise`.

```tsx
const handleDelete = async (id: string) => {
  toast.promise(
    fetch(`/api/admin/resource/${id}`, { method: 'DELETE' }),
    {
      loading: 'Suppression en cours...',
      success: 'Ressource supprimée avec succès',
      error: 'Erreur lors de la suppression',
    }
  );
};
```

## 5. Couleurs et Branding

Utilisez exclusivement les tokens HSL définis dans `globals.css` pour assurer la cohérence avec la charte graphique :

- **Bleu Administratif** : `hsl(var(--gov-blue))`
- **Or Royal** : `hsl(var(--gov-gold))`
- **Vert Officiel** : `hsl(var(--gov-green))`
- **Rouge Marocain** : `hsl(var(--gov-red))`

Exemple : `text-[hsl(var(--gov-blue))]` ou `bg-[hsl(var(--gov-blue))]`.

const fs = require('fs');

// Load FR file
const frPath = 'locales/fr/common.json';
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// ============================================================
// COMPLETE MISSING TRANSLATION STRUCTURE FOR DELEGATION
// ============================================================

const newBlocks = {
    // news_creation - used by actualites/[id]/page.tsx
    news_creation: {
        back_to_list: "Retour aux actualités",
        subtitle: "Modifier Actualité",
        edit_title: "Modifier l'actualité #{id}",
        title: "Nouvelle Actualité",
        validation: {
            titre_min: "Le titre doit faire au moins 5 caractères",
            content_min: "Le contenu doit faire au moins 20 caractères",
            establishment_required: "Veuillez sélectionner un établissement"
        },
        errors: {
            not_found: "Actualité non trouvée",
            update_failed: "Erreur lors de la mise à jour",
            server_error: "Erreur serveur"
        },
        success: {
            updated: "Actualité mise à jour avec succès",
            created: "Actualité publiée avec succès"
        },
        sections: {
            media: {
                title: "Image de couverture",
                placeholder: "Cliquer pour ajouter une image",
                hint: "PNG, JPG jusqu'à 5MB",
                remove_btn: "Supprimer",
                selected_label: "Image sélectionnée",
                size_error: "L'image ne doit pas dépasser 5MB"
            },
            content: {
                title: "Rédaction",
                titre_label: "Titre de l'article",
                titre_placeholder: "Ex: Rénovation de la façade terminée",
                description_label: "Chapeau / Description courte",
                description_placeholder: "Un résumé rapide pour l'aperçu...",
                body_label: "Contenu complet",
                body_placeholder: "Rédigez votre article ici..."
            },
            context: {
                category_title: "Catégorie",
                establishment_title: "Établissement",
                establishment_placeholder: "Sélectionner un établissement...",
                category_options: {
                    general: "Général",
                    works: "Travaux & Aménagements",
                    announcement: "Annonce Officielle",
                    partnership: "Partenariat",
                    success_story: "Réussite"
                }
            }
        },
        actions: {
            cancel: "Annuler",
            update: "Enregistrer",
            updating: "Enregistrement...",
            publish: "Publier",
            publishing: "Publication..."
        }
    },

    // event_edit - used by evenements/[id]/modifier/page.tsx
    event_edit: {
        subtitle: "Modifier l'événement",
        title: "Modification de l'événement",
        errors: {
            not_found: "Événement non trouvé",
            update_failed: "Erreur lors de la mise à jour",
            image_upload_failed: "Erreur lors de l'upload de l'image"
        },
        success: {
            updated: "Événement mis à jour avec succès"
        },
        buttons: {
            cancel: "Annuler",
            save: "Enregistrer les modifications",
            saving: "Enregistrement..."
        }
    },

    // event_closure - used by evenements/[id]/cloture/page.tsx
    event_closure: {
        breadcrumbs: "Clôture de l'événement",
        title: "Clôturer l'événement",
        event_label: "Événement à clôturer",
        report: {
            title: "Rapport de clôture",
            label: "Rapport (PDF ou Word)",
            upload_text: "Cliquer pour ajouter un fichier",
            formats: "PDF, DOC jusqu'à 10MB",
            success: "Événement clôturé avec succès"
        },
        info_box: {
            title: "Informations",
            text: "Une fois clôturé, l'événement ne peut plus être modifié."
        },
        participation: {
            title: "Participation",
            real_count: "Nombre de participants réels",
            placeholder: "Ex: 150"
        },
        qualitative: {
            title: "Évaluation qualitative",
            label: "Appréciation globale de l'événement",
            placeholder: "Décrivez le déroulement, les points positifs et les axes d'amélioration..."
        },
        gallery: {
            title: "Galerie photos",
            add: "Ajouter des photos",
            hint: "JPG, PNG jusqu'à 5MB chacune"
        },
        validation: {
            required_fields: "Veuillez remplir tous les champs requis",
            closure_error: "Erreur lors de la clôture",
            server_error: "Erreur serveur"
        },
        errors: {
            image_upload_failed: "Erreur lors de l'upload de l'image"
        },
        buttons: {
            cancel: "Annuler",
            confirm: "Confirmer la clôture",
            processing: "Traitement en cours..."
        }
    }
};

// articles sub-namespaces
const articlesNew = {
    ...(fr.delegation?.dashboard?.articles || {}),
    limit: "Limite",
    search: "Rechercher",
    statut: "Statut",
    creation: {
        back_to_list: "Retour aux articles",
        subtitle: "Nouvel Article",
        title: "Créer un article",
        validation: {
            title_min: "Le titre doit faire au moins 5 caractères",
            content_min: "Le contenu doit faire au moins 50 caractères"
        },
        errors: {
            upload_failed: "Erreur lors du téléchargement de l'image",
            create_failed: "Erreur lors de la création de l'article"
        },
        success: {
            created: "Article créé avec succès"
        },
        sections: {
            cover: {
                title: "Image de couverture",
                click_to_add: "Cliquer pour ajouter une image",
                formats: "PNG, JPG jusqu'à 5MB",
                selected: "Image sélectionnée",
                remove: "Supprimer"
            },
            content: {
                title: "Contenu de l'article",
                article_title: "Titre de l'article",
                article_title_placeholder: "Titre accrocheur de votre article...",
                summary: "Résumé",
                summary_placeholder: "Un court résumé de l'article...",
                full_content: "Contenu détaillé",
                full_content_placeholder: "Rédigez votre article complet ici..."
            },
            metadata: {
                title: "Métadonnées",
                category: "Catégorie",
                category_placeholder: "Sélectionner une catégorie",
                tags: "Tags",
                tags_hint: "(séparés par des virgules)",
                tags_placeholder: "santé, éducation, sport...",
                categories: {
                    actualite: "Actualité",
                    dossier: "Dossier",
                    interview: "Interview",
                    reportage: "Reportage",
                    tribune: "Tribune"
                }
            },
            publication: {
                title: "Publication",
                publish_now: "Publier immédiatement",
                publish_now_desc: "L'article sera visible dès la création"
            }
        },
        actions: {
            cancel: "Annuler",
            save: "Publier l'article",
            saving: "Publication..."
        }
    },
    edit_page: {
        back_to_list: "Retour aux articles",
        subtitle: "Modifier Article",
        title: "Modification",
        errors: {
            not_found: "Article non trouvé",
            update_failed: "Erreur lors de la mise à jour"
        },
        success: {
            updated: "Article mis à jour avec succès"
        },
        actions: {
            cancel: "Annuler",
            save: "Enregistrer",
            saving: "Enregistrement..."
        }
    }
};

// campaigns sub-namespaces
const campaignsNew = {
    ...(fr.delegation?.dashboard?.campaigns || {}),
    limit: "Limite",
    search: "Rechercher",
    statut: "Statut",
    delete_confirm: "Êtes-vous sûr de vouloir supprimer cette campagne ?",
    delete_success: "Campagne supprimée avec succès",
    delete_error: "Erreur lors de la suppression",
    status_active: "Active",
    status_finished: "Terminée",
    types: {
        sante: "Santé",
        environnement: "Environnement",
        education: "Éducation",
        social: "Social",
        solidarite: "Solidarité",
        ecologie: "Écologie",
        citoyennete: "Citoyenneté",
        autre: "Autre"
    },
    details: {
        general_progress: "Progression",
        description_title: "Description",
        content_title: "Contenu",
        stats_title: "Statistiques",
        participants: "Participants",
        objective: "Objectif",
        planning_title: "Planning",
        start_date: "Date de début",
        end_date: "Date de fin",
        location: "Lieu",
        management_title: "Gestion",
        edit: "Modifier",
        delete: "Supprimer"
    },
    creation: {
        back_to_list: "Retour aux campagnes",
        subtitle: "Nouvelle Campagne",
        title: "Créer une campagne",
        validation: {
            title_min: "Le titre doit faire au moins 5 caractères",
            description_min: "La description doit faire au moins 20 caractères",
            type_required: "Veuillez sélectionner un type",
            start_date_required: "La date de début est requise"
        },
        errors: {
            upload_failed: "Erreur lors du téléchargement de l'image",
            create_failed: "Erreur lors de la création"
        },
        success: {
            created: "Campagne créée avec succès"
        },
        sections: {
            cover: {
                title: "Image de couverture",
                click_to_add: "Cliquer pour ajouter une image",
                formats: "PNG, JPG jusqu'à 5MB"
            },
            general: {
                title: "Informations générales",
                type: "Type de campagne",
                type_placeholder: "Sélectionner un type",
                campaign_title: "Titre de la campagne",
                campaign_title_placeholder: "Titre de votre campagne...",
                description: "Description courte",
                description_placeholder: "Un court résumé de la campagne..."
            },
            datetime: {
                title: "Dates et Lieu",
                start_date: "Date de début",
                end_date: "Date de fin",
                location: "Lieu",
                location_placeholder: "Ville, lieu précis..."
            },
            objectives: {
                title: "Objectifs",
                target_participants: "Objectif de participants",
                target_placeholder: "Ex: 500"
            }
        },
        actions: {
            cancel: "Annuler",
            create: "Lancer la campagne",
            creating: "Création..."
        }
    },
    edit_page: {
        back_to_list: "Retour aux campagnes",
        subtitle: "Modifier Campagne",
        title: "Modification de la campagne",
        errors: {
            not_found: "Campagne non trouvée",
            update_failed: "Erreur lors de la mise à jour"
        },
        success: {
            updated: "Campagne mise à jour avec succès"
        },
        actions: {
            cancel: "Annuler",
            save: "Enregistrer",
            saving: "Enregistrement..."
        }
    }
};

// my_events additions
const myEventsNew = {
    ...(fr.delegation?.dashboard?.my_events || {}),
    success: "Événement supprimé avec succès",
    page: "Page",
    limit: "Limite",
    search: "Rechercher",
    statut: "Statut"
};

// event_creation additions
const eventCreationNew = {
    ...(fr.delegation?.dashboard?.event_creation || {}),
    errors: {
        not_found: "Événement non trouvé",
        update_failed: "Erreur lors de la mise à jour",
        image_upload_failed: "Erreur lors de l'upload de l'image"
    },
    success: {
        updated: "Événement mis à jour avec succès"
    },
    buttons: {
        save: "Enregistrer",
        saving: "Enregistrement..."
    }
};

// Apply all changes to fr object
if (!fr.delegation) fr.delegation = {};
if (!fr.delegation.dashboard) fr.delegation.dashboard = {};

// Merge new blocks into dashboard
Object.assign(fr.delegation.dashboard, newBlocks);

// Set updated sub-objects
fr.delegation.dashboard.articles = articlesNew;
fr.delegation.dashboard.campaigns = campaignsNew;
fr.delegation.dashboard.my_events = myEventsNew;
fr.delegation.dashboard.event_creation = eventCreationNew;

// Write back
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
console.log('✅ FR file updated with all delegation translation blocks');

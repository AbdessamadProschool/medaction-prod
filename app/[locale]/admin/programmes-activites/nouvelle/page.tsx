"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Loader2, Save, CalendarIcon, Clock } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";

export default function AdminNouveauProgrammePage() {
  const t = useTranslations('admin_activity_create');
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [etablissements, setEtablissements] = useState<any[]>([]);
  const [loadingEtabs, setLoadingEtabs] = useState(true);

  // Schema definition inside component to use translations
  const formSchema = useMemo(() => z.object({
    titre: z.string().min(5, t('fields.activity_title') + " " + t('messages.error')).max(150), // Simplified validation msg for now
    etablissementId: z.string().min(1, t('fields.select_etablissement')),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t('messages.date_format')),
    heureDebut: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, t('messages.time_format')),
    heureFin: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, t('messages.time_format')),
    typeActivite: z.string().min(2, t('fields.type_activity')),
    lieu: z.string().optional(),
    responsableNom: z.string().optional(),
    participantsAttendus: z.string().optional().refine((val) => !val || !isNaN(parseInt(val)), t('fields.participants')), // "Must be a number"
    description: z.string().optional(),
  }), [t]);

  type FormValues = z.infer<typeof formSchema>;

  // Fetch establishments
  useEffect(() => {
    fetch('/api/etablissements?limit=100')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setEtablissements(data.data);
        }
      })
      .catch(err => console.error("Erreur chargement établissements", err))
      .finally(() => setLoadingEtabs(false));
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      typeActivite: "Culturel",
      participantsAttendus: "0"
    }
  });

  const { register, handleSubmit, formState: { errors } } = form;

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        etablissementId: parseInt(data.etablissementId),
        participantsAttendus: data.participantsAttendus ? parseInt(data.participantsAttendus) : undefined,
      };

      const res = await fetch("/api/programmes-activites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || responseData.error || t('messages.error'));
      }

      toast.success(t('messages.success'));
      router.push("/admin/programmes-activites");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/programmes-activites"
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6 rtl:rotate-180" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-sm">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950 rounded-lg border p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Section 1: Informations Principales */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">{t('sections.general')}</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('fields.etablissement')} <span className="text-red-500">*</span></label>
                <select 
                  {...register("etablissementId")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loadingEtabs}
                >
                  <option value="">{t('fields.select_etablissement')}</option>
                  {etablissements.map(etab => (
                    <option key={etab.id} value={etab.id}>{etab.nom}</option>
                  ))}
                </select>
                {errors.etablissementId && <p className="text-sm text-red-500">{errors.etablissementId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('fields.type_activity')} <span className="text-red-500">*</span></label>
                <select 
                  {...register("typeActivite")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="Culturel">{t('activity_types.Culturel')}</option>
                  <option value="Sportif">{t('activity_types.Sportif')}</option>
                  <option value="Educatif">{t('activity_types.Educatif')}</option>
                  <option value="Social">{t('activity_types.Social')}</option>
                  <option value="Formation">{t('activity_types.Formation')}</option>
                  <option value="Reunion">{t('activity_types.Reunion')}</option>
                  <option value="Autre">{t('activity_types.Autre')}</option>
                </select>
                {errors.typeActivite && <p className="text-sm text-red-500">{errors.typeActivite.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('fields.activity_title')} <span className="text-red-500">*</span></label>
              <input
                {...register("titre")}
                placeholder={t('fields.title_placeholder')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {errors.titre && <p className="text-sm text-red-500">{errors.titre.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('fields.description')}</label>
              <textarea
                {...register("description")}
                placeholder={t('fields.description_placeholder')}
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {/* Section 2: Planification */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">{t('sections.planning')}</h2>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('fields.date')} <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground z-10">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="date"
                    lang="fr"
                    dir="ltr"
                    {...register("date")}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-right md:text-left"
                    style={{ colorScheme: 'light' }}
                  />
                </div>
                {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('fields.start_time')} <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground z-10">
                    <Clock className="h-4 w-4" />
                  </div>
                  <input
                    type="time"
                    lang="fr"
                    dir="ltr"
                    {...register("heureDebut")}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-right md:text-left"
                    style={{ colorScheme: 'light' }}
                  />
                </div>
                {errors.heureDebut && <p className="text-sm text-red-500">{errors.heureDebut.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('fields.end_time')} <span className="text-red-500">*</span></label>
                <div className="relative group">
                   <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground z-10">
                    <Clock className="h-4 w-4" />
                  </div>
                  <input
                    type="time"
                    lang="fr"
                    dir="ltr"
                    {...register("heureFin")}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 pl-10 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none text-right md:text-left"
                    style={{ colorScheme: 'light' }}
                  />
                </div>
                {errors.heureFin && <p className="text-sm text-red-500">{errors.heureFin.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Détails Logistiques */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">{t('sections.logistics')}</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('fields.location')}</label>
                <input
                  {...register("lieu")}
                  placeholder={t('fields.location_placeholder')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('fields.manager')}</label>
                <input
                  {...register("responsableNom")}
                  placeholder={t('fields.manager_placeholder')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

               <div className="space-y-2">
                <label className="text-sm font-medium">{t('fields.participants')}</label>
                <input
                  type="number"
                  {...register("participantsAttendus")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {errors.participantsAttendus && <p className="text-sm text-red-500">{errors.participantsAttendus.message}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="mr-4 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4"
            >
              {t('buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               {t('buttons.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

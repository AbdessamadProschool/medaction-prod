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
    isOrganiseParProvince: z.boolean().optional(),
    sousCouvertProvince: z.boolean().optional(),
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
      participantsAttendus: "0",
      isOrganiseParProvince: false,
      sousCouvertProvince: false,
    }
  });

  const { register, handleSubmit, formState: { errors } } = form;

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    const submitPromise = new Promise(async (resolve, reject) => {
      try {
        const payload = {
          ...data,
          etablissementId: parseInt(data.etablissementId),
          participantsAttendus: data.participantsAttendus ? parseInt(data.participantsAttendus) : undefined,
          isOrganiseParProvince: data.isOrganiseParProvince,
          sousCouvertProvince: data.sousCouvertProvince,
        };

        const res = await fetch("/api/programmes-activites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const responseData = await res.json();

        if (!res.ok) {
          reject(new Error(responseData.message || responseData.error || t('messages.error')));
          return;
        }

        resolve(true);
        router.push("/admin/programmes-activites");
        router.refresh();
      } catch (error: any) {
        console.error(error);
        reject(new Error(error.message || t('messages.error')));
      } finally {
        setLoading(false);
      }
    });

    toast.promise(submitPromise, {
      loading: 'Création en cours...',
      success: t('messages.success'),
      error: (err: any) => err.message,
    });
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
                  className="gov-select w-full"
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
                  className="gov-select w-full"
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
                className="gov-input w-full"
              />
              {errors.titre && <p className="text-sm text-red-500">{errors.titre.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('fields.description')}</label>
              <textarea
                {...register("description")}
                placeholder={t('fields.description_placeholder')}
                className="gov-textarea w-full"
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
                    className="gov-input w-full pl-10 text-right md:text-left"
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
                    className="gov-input w-full pl-10 text-right md:text-left"
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
                    className="gov-input w-full pl-10 text-right md:text-left"
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
                  className="gov-input w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('fields.manager')}</label>
                <input
                  {...register("responsableNom")}
                  className="gov-input w-full"
                />
              </div>

               <div className="space-y-2">
                 <label className="text-sm font-medium">{t('fields.participants')}</label>
                <input
                  type="number"
                  className="gov-input w-full"
                />
                {errors.participantsAttendus && <p className="text-sm text-red-500">{errors.participantsAttendus.message}</p>}
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group">
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-[hsl(var(--gov-blue))] focus:ring-[hsl(var(--gov-blue))]"
                  />
                </div>
                <div className="text-start">
                  <span className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors text-xs">منظمة من طرف العمالة</span>
                  <p className="text-[10px] text-gray-500 mt-1">سيتم ربط النشاط مباشرة بعمالة مديونة</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group">
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-[hsl(var(--gov-blue))] focus:ring-[hsl(var(--gov-blue))]"
                  />
                </div>
                <div className="text-start">
                  <span className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors text-xs">تحت غطاء العمالة</span>
                  <p className="text-[10px] text-gray-500 mt-1">إظهار عبارة "تحت غطاء السيد العامل"</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="gov-btn gov-btn-secondary mr-4"
            >
              {t('buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="gov-btn gov-btn-primary px-8"
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

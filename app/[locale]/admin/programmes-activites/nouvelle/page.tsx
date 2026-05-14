"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  CalendarIcon, 
  Clock, 
  Building2, 
  FileText, 
  MapPin, 
  Users, 
  User, 
  Sparkles, 
  CheckCircle2,
  XCircle,
  Layout,
  Info,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";


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
    <div className="space-y-8 max-w-[1200px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link 
            href="/admin/programmes-activites"
            className="w-12 h-12 flex items-center justify-center bg-card border border-border rounded-2xl hover:bg-muted transition-all shadow-sm group"
          >
            <ArrowLeft className="text-muted-foreground group-hover:text-foreground group-hover:-translate-x-1 transition-all rtl:rotate-180 rtl:group-hover:translate-x-1" size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[hsl(var(--gov-blue))/0.1] rounded-xl flex items-center justify-center border border-[hsl(var(--gov-blue))/0.2]">
                <Sparkles className="text-[hsl(var(--gov-blue))] w-5 h-5" />
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
                {t('title')}
              </h1>
            </div>
            <p className="text-muted-foreground font-medium text-lg ml-1">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl shadow-[hsl(var(--gov-blue))/0.02]">
        <form onSubmit={handleSubmit(onSubmit)} className="divide-y divide-border">
          
          {/* Section 1: Informations Principales */}
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--gov-blue))/0.1] flex items-center justify-center border border-[hsl(var(--gov-blue))/0.2]">
                <Info className="text-[hsl(var(--gov-blue))] w-4 h-4" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-widest text-foreground">{t('sections.general')}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  {t('fields.etablissement')} <span className="text-[hsl(var(--gov-red))]">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors">
                    <Building2 size={16} />
                  </div>
                  <select 
                    {...register("etablissementId")}
                    className="gov-input pl-12 h-12 text-sm font-medium appearance-none cursor-pointer"
                    disabled={loadingEtabs}
                  >
                    <option value="">{t('fields.select_etablissement')}</option>
                    {etablissements.map(etab => (
                      <option key={etab.id} value={etab.id}>{etab.nom}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                {errors.etablissementId && <p className="text-[10px] font-bold text-[hsl(var(--gov-red))] ml-1">{errors.etablissementId.message}</p>}
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  {t('fields.type_activity')} <span className="text-[hsl(var(--gov-red))]">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors">
                    <Layout size={16} />
                  </div>
                  <select 
                    {...register("typeActivite")}
                    className="gov-input pl-12 h-12 text-sm font-medium appearance-none cursor-pointer"
                  >
                    {["Culturel", "Sportif", "Educatif", "Social", "Formation", "Reunion", "Autre"].map(type => (
                      <option key={type} value={type}>{t(`activity_types.${type}`)}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
                {errors.typeActivite && <p className="text-[10px] font-bold text-[hsl(var(--gov-red))] ml-1">{errors.typeActivite.message}</p>}
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                {t('fields.activity_title')} <span className="text-[hsl(var(--gov-red))]">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors">
                  <FileText size={16} />
                </div>
                <input
                  {...register("titre")}
                  className="gov-input pl-12 h-12 text-sm font-black"
                  placeholder="Ex: Caravane médicale de dépistage précoce..."
                />
              </div>
              {errors.titre && <p className="text-[10px] font-bold text-[hsl(var(--gov-red))] ml-1">{errors.titre.message}</p>}
            </div>

            <div className="space-y-2.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('fields.description')}</label>
              <textarea
                {...register("description")}
                placeholder={t('fields.description_placeholder')}
                className="gov-textarea p-6 text-sm font-medium min-h-[120px]"
              />
            </div>
          </div>

          {/* Section 2: Planification */}
          <div className="p-8 space-y-8 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--gov-blue))/0.1] flex items-center justify-center border border-[hsl(var(--gov-blue))/0.2]">
                <CalendarIcon className="text-[hsl(var(--gov-blue))] w-4 h-4" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-widest text-foreground">{t('sections.planning')}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  {t('fields.date')} <span className="text-[hsl(var(--gov-red))]">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors">
                    <CalendarIcon size={16} />
                  </div>
                  <input
                    type="date"
                    {...register("date")}
                    className="gov-input pl-12 h-12 text-sm font-bold"
                  />
                </div>
                {errors.date && <p className="text-[10px] font-bold text-[hsl(var(--gov-red))] ml-1">{errors.date.message}</p>}
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  {t('fields.start_time')} <span className="text-[hsl(var(--gov-red))]">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors">
                    <Clock size={16} />
                  </div>
                  <input
                    type="time"
                    {...register("heureDebut")}
                    className="gov-input pl-12 h-12 text-sm font-bold"
                  />
                </div>
                {errors.heureDebut && <p className="text-[10px] font-bold text-[hsl(var(--gov-red))] ml-1">{errors.heureDebut.message}</p>}
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  {t('fields.end_time')} <span className="text-[hsl(var(--gov-red))]">*</span>
                </label>
                <div className="relative group">
                   <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors">
                    <Clock size={16} />
                  </div>
                  <input
                    type="time"
                    {...register("heureFin")}
                    className="gov-input pl-12 h-12 text-sm font-bold"
                  />
                </div>
                {errors.heureFin && <p className="text-[10px] font-bold text-[hsl(var(--gov-red))] ml-1">{errors.heureFin.message}</p>}
              </div>
            </div>
          </div>

          {/* Section 3: Détails Logistiques */}
          <div className="p-8 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[hsl(var(--gov-blue))/0.1] flex items-center justify-center border border-[hsl(var(--gov-blue))/0.2]">
                <MapPin className="text-[hsl(var(--gov-blue))] w-4 h-4" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-widest text-foreground">{t('sections.logistics')}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('fields.location')}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors">
                    <MapPin size={16} />
                  </div>
                  <input
                    {...register("lieu")}
                    className="gov-input pl-12 h-12 text-sm font-medium"
                    placeholder="Ex: Salle de conférence, Terrain de sport..."
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('fields.manager')}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors">
                    <User size={16} />
                  </div>
                  <input
                    {...register("responsableNom")}
                    className="gov-input pl-12 h-12 text-sm font-medium"
                  />
                </div>
              </div>

               <div className="space-y-2.5">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('fields.participants')}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors">
                    <Users size={16} />
                  </div>
                  <input
                    type="number"
                    {...register("participantsAttendus")}
                    className="gov-input pl-12 h-12 text-sm font-bold"
                  />
                </div>
                {errors.participantsAttendus && <p className="text-[10px] font-bold text-[hsl(var(--gov-red))] ml-1">{errors.participantsAttendus.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
              <label className="relative flex items-center gap-4 p-5 rounded-2xl border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-all hover:scale-[1.01] group">
                <input
                  type="checkbox"
                  {...register("isOrganiseParProvince")}
                  className="w-5 h-5 rounded-lg border-border text-[hsl(var(--gov-blue))] focus:ring-[hsl(var(--gov-blue))] transition-all"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors uppercase tracking-widest">
                    منظمة من طرف العمالة
                  </span>
                  <p className="text-[10px] font-bold text-muted-foreground mt-0.5 opacity-60">Lier l'activité à la province de Médiouna</p>
                </div>
                {form.watch("isOrganiseParProvince") && (
                  <CheckCircle2 size={16} className="absolute right-5 text-[hsl(var(--gov-green))]" />
                )}
              </label>

              <label className="relative flex items-center gap-4 p-5 rounded-2xl border border-border bg-muted/20 hover:bg-muted/40 cursor-pointer transition-all hover:scale-[1.01] group">
                <input
                  type="checkbox"
                  {...register("sousCouvertProvince")}
                  className="w-5 h-5 rounded-lg border-border text-[hsl(var(--gov-blue))] focus:ring-[hsl(var(--gov-blue))] transition-all"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors uppercase tracking-widest">
                    تحت غطاء العمالة
                  </span>
                  <p className="text-[10px] font-bold text-muted-foreground mt-0.5 opacity-60">"Sous le couvert de Monsieur le Gouverneur"</p>
                </div>
                {form.watch("sousCouvertProvince") && (
                  <CheckCircle2 size={16} className="absolute right-5 text-[hsl(var(--gov-green))]" />
                )}
              </label>
            </div>
          </div>

          <div className="p-8 bg-muted/10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-all border border-transparent hover:border-border"
            >
              {t('buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="gov-btn-primary h-12 px-10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-[hsl(var(--gov-blue))/0.2]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {t('buttons.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

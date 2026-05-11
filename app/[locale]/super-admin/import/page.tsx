'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  ArrowLeft,
  Database,
  FileText,
  Calendar,
  Building2,
  ClipboardList,
  Megaphone,
  MapPin,
  Grid
} from 'lucide-react';
import { motion } from 'framer-motion';

const ENTITIES = [
  { id: 'etablissement', label: 'Établissements', icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { id: 'commune', label: 'Communes', icon: MapPin, color: 'text-teal-600', bg: 'bg-teal-100' },
  { id: 'annexe', label: 'Annexes', icon: Grid, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  { id: 'evenement', label: 'Événements', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
  { id: 'campagne', label: 'Campagnes', icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-100' },
  { id: 'activite', label: 'Activités', icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 'article', label: 'Articles', icon: FileText, color: 'text-pink-600', bg: 'bg-pink-100' },
];

export default function BulkImportPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations();
  
  const [selectedEntity, setSelectedEntity] = useState(ENTITIES[0]);
  const [selectedSector, setSelectedSector] = useState('EDUCATION');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const handleDownloadTemplate = async () => {
    try {
      const url = `/api/admin/import/template?entity=${selectedEntity.id}${selectedEntity.id === 'etablissement' ? `&sector=${selectedSector}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Erreur téléchargement');
      
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const fileName = `template_${selectedEntity.id}${selectedEntity.id === 'etablissement' ? `_${selectedSector}` : ''}.xlsx`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Modèle téléchargé');
    } catch (err) {
      toast.error('Impossible de télécharger le modèle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setReport(null);
    
    try {
      let res;
      // Handle GeoJSON for Communes/Annexes
      if (file.name.toLowerCase().endsWith('.json') || file.name.toLowerCase().endsWith('.geojson')) {
         if (['commune', 'annexe'].includes(selectedEntity.id)) {
             const text = await file.text();
             // Important: Pass the entity type so the backend knows to look for Communes or Annexes
             res = await fetch(`/api/admin/import/geo?entity=${selectedEntity.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: text,
             });
         } else {
             toast.error('Le format JSON est réservé pour les Communes et Annexes (GeoJSON)');
             setUploading(false);
             return;
         }
      } else {
        // Standard CSV/Excel Import
        const formData = new FormData();
        formData.append('file', file);
        formData.append('entity', selectedEntity.id);

        res = await fetch('/api/admin/import', {
            method: 'POST',
            body: formData,
        });
      }

      const data = await res.json();

      if (res.ok) {
        setReport({
          success: true,
          count: data.count || 0,
          errors: data.errors || []
        });
        toast.success(data.message || `${data.count} entrées importées avec succès`);
      } else {
        setReport({
          success: false,
          error: data.error || 'Erreur lors de l\'import'
        });
        toast.error(data.error || 'Erreur lors de l\'import');
      }
    } catch (err) {
      toast.error('Erreur réseau');
      setReport({ success: false, error: 'Erreur réseau' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link 
            href="/super-admin"
            className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('import_page.title')}</h1>
            <p className="text-gray-500">{t('import_page.subtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Entity Selection */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">1. {t('import_page.data_types.title')}</h3>
            <div className="space-y-2">
              {ENTITIES.map((ent) => (
                <button
                  key={ent.id}
                  onClick={() => {
                    setSelectedEntity(ent);
                    setFile(null);
                    setReport(null);
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    selectedEntity.id === ent.id
                      ? 'bg-white border-blue-500 shadow-md ring-1 ring-blue-500'
                      : 'bg-white border-gray-100 hover:border-blue-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${ent.bg} ${ent.color}`}>
                    <ent.icon size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">{ent.label}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">{t('import_page.data_types.format_csv')}</p>
                  </div>
                  {selectedEntity.id === ent.id && (
                    <div className="ml-auto text-blue-500">
                      <CheckCircle size={20} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Template Download */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-bold">2</span>
                {t('import_page.download_template.title')}
              </h3>
              <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="text-blue-500" size={24} />
                  <div>
                    <p className="font-bold text-gray-800">{t('import_page.download_template.model')} {selectedEntity.label}</p>
                    <p className="text-sm text-gray-500">{t('import_page.download_template.format')}</p>
                  </div>
                </div>
                <button 
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <Download size={18} />
                  {t('import_page.download_template.button')}
                </button>
              </div>

              {selectedEntity.id === 'etablissement' && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Sélectionner le secteur pour le modèle :</p>
                  <div className="flex flex-wrap gap-2">
                    {['EDUCATION', 'SANTE', 'SPORT', 'SOCIAL', 'CULTUREL', 'AUTRE'].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setSelectedSector(sec)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          selectedSector === sec
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 italic">
                    * Le modèle inclura les colonnes spécifiques au secteur choisi.
                  </p>
                </div>
              )}
            </div>

            {/* Upload Area */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
               <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-bold">3</span>
                {t('import_page.upload.title')}
              </h3>
              
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/10 transition-colors">
                <input
                  type="file"
                  accept=".csv,.xlsx,.json,.geojson"
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                
                {!file ? (
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-lg font-medium text-gray-700">{t('import_page.upload.click_to_select')}</p>
                    <p className="text-sm text-gray-400 mt-1">
                        {['commune', 'annexe'].includes(selectedEntity.id) 
                            ? 'Excel, CSV ou JSON/GeoJSON' 
                            : t('import_page.upload.supported_formats')
                        }
                    </p>
                  </label>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                      <FileSpreadsheet />
                    </div>
                    <p className="font-bold text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500 mb-4">{(file.size / 1024).toFixed(1)} KB</p>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => setFile(null)}
                        className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium"
                       >
                         Annuler
                       </button>
                       <button 
                        onClick={handleUpload}
                        disabled={uploading}
                        className="px-6 py-2 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all font-bold flex items-center gap-2 disabled:opacity-50"
                       >
                         {uploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                         Lancer l'Import
                       </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Import Report */}
              {report && (
                <div className={`mt-6 p-4 rounded-xl border ${report.success ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                  {report.success ? (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="text-emerald-500 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-bold text-emerald-800">Import terminé</h4>
                        <p className="text-emerald-700 text-sm">{report.count} éléments ont été ajoutés à la base de données.</p>
                        
                        {report.errors && Array.isArray(report.errors) && report.errors.length > 0 && (
                            <div className="mt-3 p-3 bg-red-50 rounded-lg text-xs text-red-700 border border-red-100 max-h-48 overflow-y-auto">
                                <p className="font-semibold mb-1">Attention ({report.errors.length} problèmes) :</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    {report.errors.map((err: string, idx: number) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                      </div>
                    </div>
                  ) : (
                     <div className="flex items-start gap-3">
                      <AlertTriangle className="text-red-500 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-red-800">Échec de l'import</h4>
                        <p className="text-red-700 text-sm">{report.error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle, 
  Image as ImageIcon, 
  Upload, 
  X, 
  FileText, 
  Users,
  AlertCircle,
  Star,
  ThumbsUp,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import Link from 'next/link';

export default function ClotureActivitePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activite, setActivite] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Form State
  const [presenceEffective, setPresenceEffective] = useState('');
  const [noteQualite, setNoteQualite] = useState<number>(0);
  const [commentaireDeroulement, setCommentaireDeroulement] = useState('');
  const [difficultes, setDifficultes] = useState('');
  const [pointsPositifs, setPointsPositifs] = useState('');
  const [recommandations, setRecommandations] = useState('');
  const [photosRapport, setPhotosRapport] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Charger infos activité
    fetch(`/api/programmes-activites/${params.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
            setActivite(data.data);
            // Pre-fill if editing existing report (optional logic)
            if (data.data.presenceEffective) setPresenceEffective(data.data.presenceEffective.toString());
            if (data.data.noteQualite) setNoteQualite(data.data.noteQualite);
            if (data.data.commentaireDeroulement) setCommentaireDeroulement(data.data.commentaireDeroulement);
        }
      })
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, [params.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    formData.append('type', 'ACTIVITY_REPORT');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      if (res.ok && data.url) {
        setPhotosRapport(prev => [...prev, data.url]);
      } else {
        alert('Erreur upload image');
      }
    } catch (error) {
      console.error(error);
      alert('Erreur upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presenceEffective || !commentaireDeroulement || noteQualite === 0) {
        alert("Veuillez remplir les champs obligatoires (Participation, Note, Commentaire)");
        return;
    }

    setLoading(true);
    try {
      // On utilise PUT vers une route spécifique de clôture ou PATCH vers l'activité
      const res = await fetch(`/api/programmes-activites/${params.id}/cloture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presenceEffective: parseInt(presenceEffective),
          noteQualite,
          commentaireDeroulement,
          difficultes,
          pointsPositifs,
          recommandations,
          photosRapport,
          rapportComplete: true,
          statut: 'RAPPORT_COMPLETE' 
        }),
      });

      if (res.ok) {
        router.push('/coordinateur/calendrier');
        router.refresh();
      } else {
        const errorData = await res.json();
        alert(`Erreur: ${errorData.error || 'Erreur lors de la soumission du rapport'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!activite) return <div className="p-8 text-center text-red-500">Activité introuvable</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12 px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/coordinateur/calendrier" className="hover:underline">Activités</Link>
            <span>/</span>
            <span>Rapport</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle className="text-emerald-600" />
            Rapport de Clôture d'Activité
        </h1>
        <div className="mt-2 bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <p className="text-gray-900 font-semibold text-lg">{activite.titre}</p>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
             <span className="flex items-center gap-1"><Users size={14} /> {activite.etablissement?.nom}</span>
             <span>{new Date(activite.date).toLocaleDateString()}</span>
             <span>{activite.heureDebut} - {activite.heureFin}</span>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Lightbulb className="text-emerald-600 shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-emerald-800">
            <p className="font-semibold">Pourquoi ce rapport ?</p>
            <p>Ce rapport permet de capitaliser sur l'expérience, d'améliorer les futures activités et de justifier les actions menées auprès de l'administration provinciale.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Quantitative */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Participation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-[hsl(213,80%,28%)]" />
              Participation
            </h2>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre réel de participants*</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={presenceEffective}
                    onChange={(e) => setPresenceEffective(e.target.value)}
                    placeholder="Ex: 25"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[hsl(213,80%,28%)] outline-none"
                    required
                    min="0"
                  />
                  {activite.participantsAttendus && (
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      sur {activite.participantsAttendus} attendus
                    </span>
                  )}
                </div>
            </div>
          </div>

          {/* Qualité Globale */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Note de Qualité*
            </h2>
            <div className="flex items-center justify-between px-4 py-2">
               {[1, 2, 3, 4, 5].map((star) => (
                 <button
                   key={star}
                   type="button"
                   onClick={() => setNoteQualite(star)}
                   className={`p-2 rounded-full transition-all ${noteQualite >= star ? 'scale-110' : 'opacity-50 hover:opacity-75'}`}
                 >
                   <Star 
                     size={32} 
                     className={noteQualite >= star ? "fill-amber-400 text-amber-400" : "text-gray-300"} 
                   />
                   <span className="block text-xs text-center text-gray-400 mt-1">{star}</span>
                 </button>
               ))}
            </div>
          </div>
        </div>

        {/* Section 2: Qualitative */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[hsl(213,80%,28%)]" />
            Déroulement et Analyse
          </h2>
          
          <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire général sur le déroulement*</label>
                <textarea
                  rows={4}
                  value={commentaireDeroulement}
                  onChange={(e) => setCommentaireDeroulement(e.target.value)}
                  placeholder="Décrivez brièvement comment s'est passée l'activité..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[hsl(213,80%,28%)] outline-none"
                  required
                />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <ThumbsUp size={14} className="text-green-600" /> Points Positifs
                  </label>
                  <textarea
                    rows={3}
                    value={pointsPositifs}
                    onChange={(e) => setPointsPositifs(e.target.value)}
                    placeholder="Ce qui a bien fonctionné..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                  />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <AlertTriangle size={14} className="text-orange-500" /> Difficultés rencontrées
                  </label>
                  <textarea
                    rows={3}
                    value={difficultes}
                    onChange={(e) => setDifficultes(e.target.value)}
                    placeholder="Problèmes, obstacles..."
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  />
               </div>
            </div>

             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recommandations pour la prochaine fois</label>
                <textarea
                  rows={2}
                  value={recommandations}
                  onChange={(e) => setRecommandations(e.target.value)}
                  placeholder="Suggestions d'amélioration..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[hsl(213,80%,28%)] outline-none"
                />
            </div>
          </div>
        </div>

        {/* Galerie Photos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
           <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[hsl(213,80%,28%)]" />
            Photos de l'activité
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {photosRapport.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                      <img src={img} alt="Activité" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setPhotosRapport(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                          <X size={12} />
                      </button>
                  </div>
              ))}
              
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                  {uploading ? (
                      <span className="text-xs text-gray-500">Upload...</span>
                  ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500">Ajouter photo</span>
                      </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
          </div>
          <p className="text-xs text-gray-400">Ajoutez des photos montrant la participation et le déroulement (Max 5 recommandées).</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
            <Link
                href="/coordinateur/calendrier"
                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
                Annuler
            </Link>
            <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:shadow-lg transition-all font-medium flex items-center gap-2"
            >
                {loading ? 'Enregistrement...' : (
                    <>
                        <CheckCircle size={18} />
                        Enregistrer le rapport
                    </>
                )}
            </button>
        </div>

      </form>
    </div>
  );
}

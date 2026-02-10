'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { FileSpreadsheet, Star } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function RapportsPage() {
  const [loading, setLoading] = useState(true);
  const [reclamationsData, setReclamationsData] = useState<any>(null);
  const [evenementsData, setEvenementsData] = useState<any>(null);
  const [satisfactionData, setSatisfactionData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(dateRange);
      const [recRes, evtRes, satRes] = await Promise.all([
        fetch(`/api/rapports/reclamations?${params}`),
        fetch(`/api/rapports/evenements?${params}`),
        fetch(`/api/rapports/satisfaction?${params}`)
      ]);

      setReclamationsData(await recRes.json());
      setEvenementsData(await evtRes.json());
      setSatisfactionData(await satRes.json());
    } catch (error) {
      console.error('Erreur chargement rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const handleExport = async (format: 'excel' | 'pdf', type: 'reclamations' | 'evenements' | 'global') => {
    try {
      if (format === 'excel') {
        const res = await fetch('/api/export/excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, ...dateRange })
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-${type}.csv`;
        a.click();
      } else {
        // PDF Export - Simulation ou ouverture d'une vue imprimable
        alert("L'export PDF sera généré et téléchargé.");
        // Ici on pourrait appeler l'API PDF et générer un PDF client-side avec les données reçues
      }
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export');
    }
  };

  if (loading && !reclamationsData) {
    return <div className="p-8 text-center">Chargement des rapports...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rapports et Statistiques</h1>
          <p className="text-gray-500">Analysez l'activité de la plateforme</p>
        </div>
        
        <div className="flex gap-4 items-center bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <input 
            type="date" 
            value={dateRange.startDate}
            onChange={e => setDateRange({...dateRange, startDate: e.target.value})}
            className="border-gray-300 rounded-md text-sm"
          />
          <span className="text-gray-400">à</span>
          <input 
            type="date" 
            value={dateRange.endDate}
            onChange={e => setDateRange({...dateRange, endDate: e.target.value})}
            className="border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Actions Export */}
      <div className="flex gap-4">
        <button 
            onClick={() => handleExport('excel', 'reclamations')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel Réclamations
        </button>
        <button 
            onClick={() => handleExport('excel', 'evenements')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel Événements
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Réclamations</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{reclamationsData?.total || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Total Événements</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{evenementsData?.total || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Note Moyenne</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {satisfactionData?.global?.average?.toFixed(1) || 'N/A'} <Star className="w-4 h-4 text-yellow-500 inline" />
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium">Participation Événements</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{evenementsData?.participation?.totalInscrits || 0}</p>
        </div>
      </div>

      {/* Charts Section 1: Réclamations */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Réclamations par Statut</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reclamationsData?.byStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="statut"
                >
                  {reclamationsData?.byStatus?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Évolution des Réclamations</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reclamationsData?.evolution || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Section 2: Communes & Satisfaction */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Réclamations par Commune</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reclamationsData?.byCommune || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="commune" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top 5 Établissements (Satisfaction)</h3>
          <div className="space-y-4">
            {satisfactionData?.topEtablissements?.map((etab: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700 truncate max-w-[200px]">{etab.nom}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-500 font-bold">{etab.noteMoyenne.toFixed(1)} ★</span>
                        <span className="text-xs text-gray-400">({etab.nombreEvaluations} avis)</span>
                    </div>
                </div>
            ))}
            {(!satisfactionData?.topEtablissements || satisfactionData.topEtablissements.length === 0) && (
                <p className="text-gray-500 text-center py-4">Aucune donnée disponible</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

export const dynamic = 'force-dynamic';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const dataReclamations = [
  { name: 'Jan', traitees: 40, enCours: 24 },
  { name: 'Fév', traitees: 30, enCours: 13 },
  { name: 'Mar', traitees: 20, enCours: 58 },
  { name: 'Avr', traitees: 27, enCours: 39 },
  { name: 'Mai', traitees: 18, enCours: 48 },
  { name: 'Juin', traitees: 23, enCours: 38 },
];

const dataSecteurs = [
  { name: 'Éducation', value: 400 },
  { name: 'Santé', value: 300 },
  { name: 'Transport', value: 300 },
  { name: 'Environnement', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function StatistiquesPubliquesPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="bg-gradient-to-br from-[hsl(213,80%,20%)] to-[hsl(213,80%,30%)] py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Statistiques Publiques
          </h1>
          <p className="text-xl text-[hsl(45,93%,70%)] max-w-2xl mx-auto">
            Transparence et données ouvertes sur l'activité de la plateforme.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Réclamations Traitées', value: '85%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Temps Moyen Réponse', value: '48h', color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Citoyens Inscrits', value: '1,234', color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Établissements', value: '256', color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-sm font-medium mb-2">{stat.label}</p>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Réclamations Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Évolution des Réclamations</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataReclamations}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="traitees" name="Traitées" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="enCours" name="En cours" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secteurs Chart */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Répartition par Secteur</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataSecteurs}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dataSecteurs.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

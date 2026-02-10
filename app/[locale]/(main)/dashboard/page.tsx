'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Building2,
  Users,
  Star,
  MessageSquare,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  ChevronRight,
  Filter,
  Loader2,
  RefreshCw,
  MapPin,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface KPIData {
  etablissements: number;
  utilisateurs: number;
  evaluations: number;
  noteMoyenneGlobale: string;
}

interface ReclamationsData {
  total: number;
  enAttente: number;
  acceptees: number;
  rejetees: number;
  recentes: number;
}

interface EvenementsData {
  total: number;
  publies: number;
  aVenir: number;
}

interface Commune {
  id: number;
  nom: string;
}

interface Annexe {
  id: number;
  nom: string;
}

// Couleurs secteurs
const SECTEUR_COLORS: Record<string, string> = {
  EDUCATION: '#3B82F6',
  SANTE: '#EF4444',
  SPORT: '#22C55E',
  SOCIAL: '#A855F7',
  CULTUREL: '#F97316',
  AUTRE: '#6B7280',
};

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// KPI Card Component
function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color,
  delay,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      transition={{ duration: 0.5, delay }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: delay + 0.2 }}
            className="text-3xl font-bold text-gray-900 dark:text-white"
          >
            {value}
          </motion.p>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-emerald-600' : 
              trend === 'down' ? 'text-red-500' : 'text-gray-500'
            }`}>
              {trend === 'up' ? <TrendingUp size={14} /> : 
               trend === 'down' ? <TrendingDown size={14} /> : null}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// Événement Card
function EvenementCard({ event, index }: { event: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}
        style={{ backgroundColor: SECTEUR_COLORS[event.secteur] + '20' }}
      >
        <Calendar size={20} style={{ color: SECTEUR_COLORS[event.secteur] }} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white truncate">{event.titre}</h4>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {new Date(event.dateDebut).toLocaleDateString('fr-FR')}
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} />
            {event.inscrits || 0} inscrits
          </span>
        </div>
      </div>
      <Link
        href={`/evenements/${event.id}`}
        className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
      >
        <ChevronRight size={20} />
      </Link>
    </motion.div>
  );
}

// Réclamation Card
function ReclamationCard({ reclamation, index }: { reclamation: any; index: number }) {
  const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
    null: { color: 'text-yellow-500 bg-yellow-50', icon: Clock },
    ACCEPTEE: { color: 'text-emerald-500 bg-emerald-50', icon: CheckCircle },
    REJETEE: { color: 'text-red-500 bg-red-50', icon: XCircle },
  };
  const config = statusConfig[reclamation.statut] || statusConfig['null'];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
        <StatusIcon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white truncate">{reclamation.titre}</h4>
        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {reclamation.communeNom || 'Non spécifié'}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {new Date(reclamation.createdAt).toLocaleDateString('fr-FR')}
          </span>
        </div>
      </div>
      <Link
        href={`/admin/reclamations/${reclamation.id}`}
        className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
      >
        <ChevronRight size={20} />
      </Link>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtres
  const [periode, setPeriode] = useState('30');
  const [communeId, setCommuneId] = useState<string>('');
  const [annexeId, setAnnexeId] = useState<string>('');
  
  // Data
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [annexes, setAnnexes] = useState<Annexe[]>([]);
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [reclamationsData, setReclamationsData] = useState<ReclamationsData | null>(null);
  const [evenementsData, setEvenementsData] = useState<EvenementsData | null>(null);
  const [parSecteur, setParSecteur] = useState<any[]>([]);
  const [evolution, setEvolution] = useState<any[]>([]);
  const [satisfactionDistribution, setSatisfactionDistribution] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [urgentReclamations, setUrgentReclamations] = useState<any[]>([]);

  // Charger communes et annexes
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [communesRes, annexesRes] = await Promise.all([
          fetch('/api/map/communes'),
          fetch('/api/map/annexes'),
        ]);
        
        if (communesRes.ok) {
          const data = await communesRes.json();
          setCommunes(data.communes || []);
        }
        if (annexesRes.ok) {
          const data = await annexesRes.json();
          setAnnexes(data.annexes || []);
        }
      } catch (error) {
        console.error('Erreur chargement filtres:', error);
      }
    };
    loadFilters();
  }, []);

  // Charger les données
  const loadData = async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (communeId) params.set('communeId', communeId);
      if (periode) params.set('periode', periode);

      const [globalRes, reclamationsRes, evenementsRes, satisfactionRes] = await Promise.all([
        fetch(`/api/stats/global?${params}`),
        fetch(`/api/stats/reclamations?${params}`),
        fetch(`/api/stats/evenements?${params}`),
        fetch(`/api/stats/satisfaction?${params}`),
      ]);

      if (globalRes.ok) {
        const data = await globalRes.json();
        setKpiData(data.global);
        setReclamationsData(data.reclamations);
        setEvenementsData(data.evenements);
        setParSecteur(data.parSecteur || []);
      }

      if (reclamationsRes.ok) {
        const data = await reclamationsRes.json();
        setEvolution(data.evolution || []);
        // Simuler réclamations urgentes
        setUrgentReclamations(data.parCategorie?.slice(0, 3).map((c: any, i: number) => ({
          id: i + 1,
          titre: `Réclamation ${c.categorie}`,
          categorie: c.categorie,
          statut: null,
          communeNom: 'Médiouna',
          createdAt: new Date().toISOString(),
        })) || []);
      }

      if (evenementsRes.ok) {
        const data = await evenementsRes.json();
        setRecentEvents(data.evenementsAVenir || []);
      }

      if (satisfactionRes.ok) {
        const data = await satisfactionRes.json();
        setSatisfactionDistribution(data.distribution || []);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [communeId, periode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-500">Vue d'ensemble de la province de Médiouna</p>
          </div>
          
          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
              <option value="365">Cette année</option>
            </select>
            
            <select
              value={communeId}
              onChange={(e) => setCommuneId(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Toutes les communes</option>
              {communes.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>

            <button
              onClick={loadData}
              disabled={refreshing}
              className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Établissements"
            value={kpiData?.etablissements || 0}
            icon={Building2}
            trend="up"
            trendValue="+12% ce mois"
            color="bg-gradient-to-br from-blue-500 to-indigo-600"
            delay={0}
          />
          <KPICard
            title="Utilisateurs actifs"
            value={kpiData?.utilisateurs || 0}
            icon={Users}
            trend="up"
            trendValue="+8% ce mois"
            color="bg-gradient-to-br from-emerald-500 to-teal-600"
            delay={0.1}
          />
          <KPICard
            title="Évaluations"
            value={kpiData?.evaluations || 0}
            icon={Star}
            trend="up"
            trendValue={`Moyenne: ${kpiData?.noteMoyenneGlobale || '0'}/5`}
            color="bg-gradient-to-br from-amber-500 to-orange-600"
            delay={0.2}
          />
          <KPICard
            title="Réclamations"
            value={reclamationsData?.total || 0}
            icon={MessageSquare}
            trend={reclamationsData?.enAttente ? 'neutral' : 'up'}
            trendValue={`${reclamationsData?.enAttente || 0} en attente`}
            color="bg-gradient-to-br from-purple-500 to-pink-600"
            delay={0.3}
          />
        </div>

        {/* Graphiques Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Évolution réclamations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Évolution des réclamations
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={evolution.slice(-14)}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(v) => new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString('fr-FR')}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#10B981" 
                  fill="url(#colorTotal)"
                  strokeWidth={2}
                  name="Total"
                />
                <Area 
                  type="monotone" 
                  dataKey="resolues" 
                  stroke="#3B82F6" 
                  fill="#3B82F620"
                  strokeWidth={2}
                  name="Résolues"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Distribution par secteur */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Établissements par secteur
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={parSecteur}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="secteur"
                >
                  {parSecteur.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={SECTEUR_COLORS[entry.secteur] || SECTEUR_COLORS.AUTRE}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend 
                  formatter={(value) => <span className="text-gray-600 text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Graphiques Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Satisfaction Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Distribution des notes
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={satisfactionDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="note"
                  tickFormatter={(v) => `${v}★`}
                  stroke="#9CA3AF"
                  fontSize={12}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [value, 'Évaluations']}
                  labelFormatter={(v) => `${v} étoiles`}
                />
                <Bar 
                  dataKey="count" 
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Statut réclamations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Statut des réclamations
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'En attente', value: reclamationsData?.enAttente || 0, color: '#F59E0B' },
                    { name: 'Acceptées', value: reclamationsData?.acceptees || 0, color: '#10B981' },
                    { name: 'Rejetées', value: reclamationsData?.rejetees || 0, color: '#EF4444' },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill="#F59E0B" />
                  <Cell fill="#10B981" />
                  <Cell fill="#EF4444" />
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend 
                  formatter={(value) => <span className="text-gray-600 text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Événements et Réclamations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Événements à venir */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Événements à venir
              </h3>
              <Link 
                href="/evenements"
                className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
              >
                Voir tout <ChevronRight size={14} />
              </Link>
            </div>
            
            {recentEvents.length > 0 ? (
              <div className="space-y-3">
                {recentEvents.slice(0, 3).map((event, index) => (
                  <EvenementCard key={event.id} event={event} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-500">Aucun événement à venir</p>
              </div>
            )}
          </motion.div>

          {/* Réclamations urgentes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={18} />
                Réclamations en attente
              </h3>
              <Link 
                href="/admin/reclamations"
                className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
              >
                Voir tout <ChevronRight size={14} />
              </Link>
            </div>
            
            {urgentReclamations.length > 0 ? (
              <div className="space-y-3">
                {urgentReclamations.slice(0, 3).map((reclamation, index) => (
                  <ReclamationCard key={reclamation.id} reclamation={reclamation} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-emerald-200 mx-auto mb-2" />
                <p className="text-gray-500">Aucune réclamation urgente</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

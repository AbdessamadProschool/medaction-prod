'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Calendar,
  Newspaper,
  FileText,
  Megaphone,
  TrendingUp,
  Eye,
  Users,
  Target,
  Loader2,
  Share2,
  Presentation
} from 'lucide-react';

interface DetailedStats {
  evenements: {
    total: number;
    publies: number;
    brouillons: number;
    termines: number;
    vues: number;
    inscrits: number;
  };
  actualites: {
    total: number;
    publiees: number;
    brouillons: number;
    vues: number;
  };
  articles: {
    total: number;
    publies: number;
    brouillons: number;
    vues: number;
  };
  campagnes: {
    total: number;
    actives: number;
    inactives: number;
    participations: number;
    objectifTotal: number;
  };
  evolution: {
    mois: string;
    evenements: number;
    actualites: number;
    articles: number;
    campagnes: number;
  }[];
}

const SECTEUR_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  SANTE: { label: 'الصحة', icon: '🏥', color: 'hsl(348,83%,47%)' },
  EDUCATION: { label: 'التعليم', icon: '🎓', color: 'hsl(213,80%,28%)' },
  SPORT: { label: 'الرياضة', icon: '⚽', color: 'hsl(145,63%,32%)' },
  CULTURE: { label: 'الثقافة', icon: '🎭', color: 'hsl(280,60%,50%)' },
  JEUNESSE: { label: 'الشباب', icon: '👥', color: 'hsl(45,93%,47%)' },
  SOCIAL: { label: 'الشؤون الاجتماعية', icon: '🤝', color: 'hsl(180,60%,40%)' },
  ADMINISTRATION: { label: 'الإدارة', icon: '🏛️', color: 'hsl(220,20%,40%)' },
};

export default function StatistiquesPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);

  const userSecteur = session?.user?.secteurResponsable || 'ADMINISTRATION';
  const secteurConfig = SECTEUR_CONFIG[userSecteur] || SECTEUR_CONFIG['ADMINISTRATION'];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/delegation/stats/detailed');
        if (res.ok) {
          const json = await res.json();
          setStats(json.data);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[hsl(213,80%,28%)] animate-spin" />
      </div>
    );
  }

  const contentTypes = [
    {
      title: 'الفعاليات',
      icon: Calendar,
      color: 'hsl(280,60%,50%)',
      bgColor: 'bg-purple-50',
      total: stats?.evenements.total || 0,
      published: stats?.evenements.publies || 0,
      drafts: stats?.evenements.brouillons || 0,
      metric: {
        label: 'المسجلون',
        value: stats?.evenements.inscrits || 0,
        icon: Users,
      },
      viewsLabel: 'المشاهدات',
      views: stats?.evenements.vues || 0,
    },
    {
      title: 'المستجدات',
      icon: Newspaper,
      color: 'hsl(25,95%,53%)',
      bgColor: 'bg-orange-50',
      total: stats?.actualites.total || 0,
      published: stats?.actualites.publiees || 0,
      drafts: stats?.actualites.brouillons || 0,
      metric: null,
      viewsLabel: 'المشاهدات',
      views: stats?.actualites.vues || 0,
    },
    {
      title: 'المقالات',
      icon: FileText,
      color: 'hsl(213,80%,28%)',
      bgColor: 'bg-blue-50',
      total: stats?.articles.total || 0,
      published: stats?.articles.publies || 0,
      drafts: stats?.articles.brouillons || 0,
      metric: null,
      viewsLabel: 'المشاهدات',
      views: stats?.articles.vues || 0,
    },
    {
      title: 'الحملات',
      icon: Megaphone,
      color: 'hsl(145,63%,32%)',
      bgColor: 'bg-green-50',
      total: stats?.campagnes.total || 0,
      published: stats?.campagnes.actives || 0,
      drafts: stats?.campagnes.inactives || 0,
      metric: {
        label: 'المشاركات',
        value: stats?.campagnes.participations || 0,
        icon: Target,
      },
      viewsLabel: 'الهدف',
      views: stats?.campagnes.objectifTotal || 0,
    },
  ];

  const totalContent = (stats?.evenements.total || 0) + (stats?.actualites.total || 0) + 
    (stats?.articles.total || 0) + (stats?.campagnes.total || 0);
  
  const totalViews = (stats?.evenements.vues || 0) + (stats?.actualites.vues || 0) + 
    (stats?.articles.vues || 0);

  const totalParticipations = (stats?.evenements.inscrits || 0) + (stats?.campagnes.participations || 0);

  return (
    <div className="space-y-10 font-sans text-right" dir="rtl">
      {/* Premium Header Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-indigo-500/20 px-8 py-10 md:px-12 md:py-14">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 p-12 opacity-10">
            <BarChart3 className="w-64 h-64 transform rotate-12" />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-indigo-100 font-medium bg-black/10 w-fit px-4 py-1.5 rounded-full backdrop-blur-sm border border-white/10 text-sm">
                    <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                    <span>الإحصائيات العامة</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                   تحليل الأداء الرقمي
                </h1>
                <p className="text-indigo-100/90 text-lg max-w-xl leading-relaxed">
                    تابع تطور محتواك وتفاعل المواطنين مع مبادرات قطاع {secteurConfig.label}.
                </p>
            </div>
            
             <div className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white shadow-lg">
                <span className="text-3xl">{secteurConfig.icon}</span>
                <div className="text-right">
                    <p className="text-xs text-indigo-200">القطاع</p>
                    <p className="font-bold text-lg">{secteurConfig.label}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 mb-2">إجمالي المحتوى</p>
              <p className="text-4xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{totalContent}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <Presentation className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 mb-2">إجمالي المشاهدات</p>
              <p className="text-4xl font-black text-gray-900 group-hover:text-orange-600 transition-colors">{totalViews.toLocaleString()}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <Eye className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500 mb-2">المشاركات</p>
              <p className="text-4xl font-black text-gray-900 group-hover:text-green-600 transition-colors">{totalParticipations.toLocaleString()}</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content Type Stats */}
      <div className="grid md:grid-cols-2 gap-8">
        {contentTypes.map((type, index) => {
          const Icon = type.icon;
          const publishedPercentage = type.total > 0 
            ? Math.round((type.published / type.total) * 100) 
            : 0;

          return (
            <motion.div
              key={type.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div 
                      className={`w-14 h-14 rounded-2xl ${type.bgColor} flex items-center justify-center`}
                    >
                      <Icon className="w-7 h-7" style={{ color: type.color }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{type.title}</h3>
                      <p className="text-sm font-medium text-gray-500">{type.total} عنصر</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-3xl font-black" style={{ color: type.color }}>
                      {publishedPercentage}%
                    </p>
                    <p className="text-xs font-bold text-gray-400">نسبة النشر</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-3 bg-gray-50 rounded-full overflow-hidden mb-8 shadow-inner">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      width: `${publishedPercentage}%`,
                      backgroundColor: type.color,
                    }}
                  />
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                    <p className="text-xl font-black text-gray-900">{type.published}</p>
                    <p className="text-xs font-bold text-gray-500 mt-1">منشور</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                    <p className="text-xl font-black text-gray-900">{type.drafts}</p>
                    <p className="text-xs font-bold text-gray-500 mt-1">مسودة</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                    <p className="text-xl font-black text-gray-900">
                      {type.metric ? type.metric.value : type.views}
                    </p>
                    <p className="text-xs font-bold text-gray-500 mt-1">
                      {type.metric ? type.metric.label : type.viewsLabel}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-[2rem] p-8 border border-yellow-100"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
             <TrendingUp size={24} />
          </div>
          نصائح لتحسين ظهورك
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-yellow-100/50 hover:shadow-md transition-all">
            <p className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-500" />
                انشر بانتظام
            </p>
            <p className="text-sm font-medium text-gray-600 leading-relaxed">
              الخوارزميات تفضل المحتوى المتجدد. حاول نشر خبر واحد على الأقل أسبوعياً.
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-yellow-100/50 hover:shadow-md transition-all">
            <p className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-yellow-500" />
                تفاعل مع المواطنين
            </p>
            <p className="text-sm font-medium text-gray-600 leading-relaxed">
              أنشئ حملات وفعاليات تشجع على المشاركة والتسجيل لزيادة التفاعل.
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-yellow-100/50 hover:shadow-md transition-all">
            <p className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-yellow-500" />
                حسن عناوينك
            </p>
            <p className="text-sm font-medium text-gray-600 leading-relaxed">
              استخدم عناوين جذابة وقصيرة. أضف صوراً عالية الجودة لكل منشور.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

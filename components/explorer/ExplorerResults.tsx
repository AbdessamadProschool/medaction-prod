'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import UnifiedCard from './UnifiedCard';

interface ExplorerResultsProps {
  initialData?: any[];
}

export default function ExplorerResults() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        const res = await fetch(`/api/explorer?${params.toString()}`);
        const json = await res.json();
        setData(json.data);
        setPagination(json.pagination);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl h-96 animate-pulse border border-gray-100">
            <div className="h-48 bg-gray-200 rounded-t-xl" />
            <div className="p-5 space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat trouvé</h3>
        <p className="text-gray-500">Essayez de modifier vos filtres ou votre recherche.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{pagination.total}</span> résultats trouvés
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {data.map((item) => (
          <UnifiedCard key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {[...Array(pagination.totalPages)].map((_, i) => {
            const page = i + 1;
            const isCurrent = page === pagination.page;
            return (
              <a
                key={page}
                href={`/explorer?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: page.toString() }).toString()}`}
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

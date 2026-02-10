import { Suspense } from 'react';
import ExplorerSidebar from '@/components/explorer/ExplorerSidebar';
import ExplorerResults from '@/components/explorer/ExplorerResults';
import Breadcrumb from '@/components/ui/Breadcrumb';
import SearchBar from '@/components/explorer/SearchBar';

export const metadata = {
  title: 'Explorer - MedAction',
  description: 'Découvrez les événements, actualités et campagnes de la Province de Médiouna.',
};

export default function ExplorerPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Explorer' }]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Explorer la Province</h1>
          <p className="text-gray-600 max-w-2xl">
            Retrouvez tous les contenus de la plateforme : événements à venir, actualités des établissements, 
            articles d'information et campagnes citoyennes.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            <Suspense fallback={<div className="h-96 bg-white rounded-xl animate-pulse" />}>
              <ExplorerSidebar />
            </Suspense>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {/* Search Bar Area */}
            <div className="mb-6">
              <Suspense>
                <SearchBar />
              </Suspense>
            </div>

            {/* Results Grid */}
            <Suspense fallback={<div className="text-center py-20">Chargement...</div>}>
              <ExplorerResults />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}

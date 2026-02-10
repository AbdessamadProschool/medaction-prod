'use client';

export default function EventSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      {/* Image Placeholder */}
      <div className="h-48 bg-gray-200" />
      
      {/* Content */}
      <div className="p-5">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-4" />
        
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
        
        <div className="h-10 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}

export function EventSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <EventSkeleton key={i} />
      ))}
    </div>
  );
}

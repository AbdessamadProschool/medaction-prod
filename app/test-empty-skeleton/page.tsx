"use client";

import { useState } from "react";
import CardSkeleton from "@/components/ui/CardSkeleton";
import EmptyState from "@/components/ui/EmptyState";

export default function TestEmptySkeletonPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const simulateSkeleton = () => {
    setData([]);
    setLoading(true);
    setTimeout(() => setLoading(false), 2000); // مدة التحميل 2 ثواني
  };

  const simulateEmpty = () => {
    setLoading(false);
    setData([]); // لا يوجد أي data
  };

  const simulateData = () => {
    setLoading(false);
    setData([
      { id: 1, title: "Événement 1" },
      { id: 2, title: "Actualité 2" },
    ]);
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4">

      <h1 className="text-2xl font-bold mb-6">Test Empty & Skeleton</h1>

      <div className="flex gap-3 mb-6">
        <button
          onClick={simulateSkeleton}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Test Skeleton
        </button>

        <button
          onClick={simulateEmpty}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg"
        >
          Test Empty State
        </button>

        <button
          onClick={simulateData}
          className="px-4 py-2 bg-green-500 text-white rounded-lg"
        >
          Test Data Loaded
        </button>
      </div>

      {/* الحالة ديال التحميل */}
      {loading && (
        <div className="grid grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {/* الحالة ديال empty state */}
      {!loading && data.length === 0 && (
        <EmptyState
          icon="📭"
          title="ما كاين حتى داتا"
          description="جرب تضغط على واحد من الأزرار باش تشوف."
        />
      )}

      {/* ملي تكون data */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {data.map((item) => (
            <div
              key={item.id}
              className="border p-4 rounded-lg shadow-sm bg-white"
            >
              {item.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

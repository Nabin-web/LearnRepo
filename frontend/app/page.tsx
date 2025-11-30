"use client";

import { useEffect, useState } from "react";
import { api, Store } from "@/lib/api";
import Link from "next/link";

export default function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log({ stores });
  useEffect(() => {
    api
      .getStores()
      .then(setStores)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading stores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-4 text-center">
          3D Store Visualization
        </h1>
        <p className="text-gray-300 text-center mb-12 text-lg">
          Select a store to enter and interact with 3D models
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store, index) => (
            <Link
              key={index}
              href={`/store/${store._id}`}
              className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-purple-400 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
            >
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={store.backgroundImage}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {store.name}
                </h2>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">
                    {store.models.length} models
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      store.activeUsers >= 2
                        ? "bg-red-500/20 text-red-300"
                        : "bg-green-500/20 text-green-300"
                    }`}
                  >
                    {store.activeUsers}/2 users
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

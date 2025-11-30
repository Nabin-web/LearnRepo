"use client";

import { useEffect, useState } from "react";
import { api, Store } from "@/lib/api";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getStores()
      .then(setStores)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-xl text-white">Loading stores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-xl text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-5xl font-bold text-white mb-4">
            3D Store Visualization
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Select a store to enter and interact with 3D models. Collaborate
            with others in real-time!
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Link key={store._id} href={`/store/${store._id}`}>
              <Card className="group text-center overflow-hidden bg-white/10 backdrop-blur-sm border-white/20 hover:border-purple-400 transition-all duration-300  hover:shadow-2xl hover:shadow-purple-500/50 cursor-pointer h-full">
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={store.backgroundImage}
                    alt={store.name}
                    className="w-full h-[500px] object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-white">
                    {store.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300 ">
                    {store.models.length}{" "}
                    {store.models.length === 1 ? "model" : "models"} available
                  </CardDescription>
                </CardContent>
                <CardFooter className="flex items-center justify-between px-4 py-4">
                  <div
                    className={
                      store.activeUsers >= 2
                        ? "bg-red-500/20 text-red-300 "
                        : "bg-green-500/20 text-green-300 "
                    }
                  >
                    {store.activeUsers}/2 users
                  </div>
                  <button
                    type="button"
                    className="text-white hover:text-purple-300 cursor-pointer bg-transparent  px-4 py-2 h-auto rounded-md transition-colors outline-none focus:outline-none"
                    style={{ backgroundColor: "transparent", border: "none" }}
                  >
                    Enter →
                  </button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

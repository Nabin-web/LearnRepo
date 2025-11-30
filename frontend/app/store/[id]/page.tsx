"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, Store } from "@/lib/api";
import { socket } from "@/lib/socket";
import Scene3D from "@/components/Scene3D";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

export default function StorePage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;

  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [activeUserCount, setActiveUserCount] = useState<number>(0);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    // Fetch store data
    api
      .getStore(storeId)
      .then((storeData) => {
        setStore(storeData);
        setActiveUserCount(storeData.activeUsers || 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    // Connect to socket
    socket.connect();

    // If socket is already connected, join immediately
    if (socket.connected) {
      console.log("Socket already connected, joining store");
      setConnected(true);
      socket.emit("join_store", { storeId });
    }

    socket.on("connect", () => {
      console.log("Connected to socket");
      setConnected(true);
      socket.emit("join_store", { storeId });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket");
      setConnected(false);
    });

    socket.on("store_full", () => {
      console.log("Store is full - access denied");
      setAccessDenied(true);
      setConnected(false);
    });

    socket.on("model_position_updated", (data: any) => {
      console.log("Model position updated:", data);
      setStore((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          models: prev.models.map((model) =>
            model.id === data.modelId
              ? { ...model, position: data.position }
              : model
          ),
        };
      });
    });

    socket.on("active_user_count", (data) => {
      if (typeof data.count === "number") {
        setActiveUserCount(data.count);
      }
    });

    return () => {
      socket.emit("leave_store", { storeId });
      socket.off("connect");
      socket.off("disconnect");
      socket.off("store_full");
      socket.off("model_position_updated");
      socket.off("active_user_count");
      socket.disconnect();
    };
  }, [storeId]);

  const handleModelMove = (
    modelId: string,
    position: { x: number; y: number }
  ) => {
    if (!connected || accessDenied) return;

    // Optimistic update
    setStore((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        models: prev.models.map((model) =>
          model.id === modelId ? { ...model, position } : model
        ),
      };
    });

    // Emit to socket
    socket.emit("model_moved", { storeId, modelId, position });

    // Update backend
    api.updateModelPosition(storeId, modelId, position).catch((error) => {
      console.error("Failed to update model position:", error);
      // Revert optimistic update on error
      setStore((prev) => {
        if (!prev) return prev;
        const originalModel = prev.models.find((m) => m.id === modelId);
        if (!originalModel) return prev;
        return {
          ...prev,
          models: prev.models.map((model) =>
            model.id === modelId ? originalModel : model
          ),
        };
      });
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-xl text-white">Loading store...</div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="p-8 max-w-md bg-white/10 backdrop-blur-sm border-white/20">
          <div className="text-xl text-red-400 mb-4 text-center">
            Error: {error || "Store not found"}
          </div>
          <Button asChild className="w-full">
            <Link href="/">← Back to stores</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="p-8 max-w-md bg-white/10 backdrop-blur-sm border-white/20">
          <Alert
            variant="destructive"
            className="mb-6 bg-red-500/20 border-red-500/50"
          >
            <AlertTitle className="text-red-300">Access Denied</AlertTitle>
            <AlertDescription className="text-red-200">
              This store is currently full (2 users maximum). Please try again
              later.
            </AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <Link href="/">← Back to stores</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-black/50 backdrop-blur-sm border-b border-white/10 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <Button
            variant="ghost"
            asChild
            className="text-white hover:text-purple-300"
          >
            <Link href="/" className="flex items-center gap-2">
              <span>←</span> Back to Stores
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-white">{store.name}</h1>
          <div className="flex items-center gap-4">
            <Badge
              variant={connected ? "secondary" : "destructive"}
              className={
                connected
                  ? "bg-green-500/20 text-green-300"
                  : "bg-red-500/20 text-red-300 border-red-500/30"
              }
            >
              {connected ? "● Customer count:" : "○ Disconnected"}
            </Badge>
            <Badge
              variant={activeUserCount >= 2 ? "destructive" : "secondary"}
              className={
                activeUserCount >= 2
                  ? "bg-red-500/20 text-red-300 "
                  : "bg-green-500/20 text-green-300"
              }
            >
              {activeUserCount}
            </Badge>
          </div>
        </div>
      </header>

      <Scene3D store={store} onModelMove={handleModelMove} />
    </div>
  );
}

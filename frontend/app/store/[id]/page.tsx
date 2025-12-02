"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { api, Store } from "@/lib/api";
import { socket } from "@/lib/socket";
import Scene3D from "@/components/Scene3D";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

// Declare global widget interface
declare global {
  interface Window {
    VideoBannerWidget?: {
      init: (storeId?: string) => Promise<void>;
      cleanup: () => void;
      destroy: () => void;
    };
  }
}

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
  const [widgetScriptLoaded, setWidgetScriptLoaded] = useState(false);
  const widgetInitializedRef = useRef(false);

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

  // Widget lifecycle management
  useEffect(() => {
    // Only initialize widget if we have a store and not in error states
    if (!store || accessDenied || loading) {
      return;
    }

    // Wait for widget API to be available (either from script load or already cached)
    let pollInterval: NodeJS.Timeout | null = null;
    
    const tryInit = () => {
      if (window.VideoBannerWidget) {
        window.VideoBannerWidget.cleanup(); // Cleanup any existing widget first
        window.VideoBannerWidget.init(storeId).then(() => {
          widgetInitializedRef.current = true;
          console.log(`[Widget] Initialized for store: ${storeId}`);
        }).catch((error) => {
          console.error("[Widget] Failed to initialize:", error);
        });
        return true;
      }
      return false;
    };

    // Try immediately first with a small delay for DOM readiness
    const initTimer = setTimeout(() => {
      if (tryInit()) {
        return; // Success, no need to poll
      }

      // Poll until available or max attempts (script might be cached)
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max wait
      
      pollInterval = setInterval(() => {
        attempts++;
        if (tryInit() || attempts >= maxAttempts) {
          if (pollInterval) clearInterval(pollInterval);
          pollInterval = null;
        }
      }, 100);
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      
      // Cleanup widget when component unmounts or storeId changes
      if (window.VideoBannerWidget) {
        window.VideoBannerWidget.cleanup();
        widgetInitializedRef.current = false;
        console.log(`[Widget] Cleaned up for store: ${storeId}`);
      }
    };
  }, [storeId, store, accessDenied, loading]);

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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-700">Loading store...</div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Card className="p-8 max-w-md bg-white border-gray-200 shadow-lg">
          <div className="text-xl text-red-600 mb-4 text-center">
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Card className="p-8 max-w-md bg-white border-gray-200 shadow-lg">
          <Alert
            variant="destructive"
            className="mb-6 bg-red-50 border-red-200"
          >
            <AlertTitle className="text-red-800">Customer Exceeded</AlertTitle>
            <AlertDescription className="text-red-700">
              This store is currently full (2 users maximum). Please come again
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <Button
            variant="ghost"
            asChild
            className="text-gray-700 hover:text-blue-600"
          >
            <Link href="/" className="flex items-center gap-2">
              <span>←</span> Back to Stores
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
          <div className="flex items-center gap-4">
            <Badge
              variant={connected ? "secondary" : "destructive"}
              className={
                connected
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-red-100 text-red-700 border-red-200"
              }
            >
              {connected ? "● Customer count:" : "○ Disconnected"}
            </Badge>
            <Badge
              variant={activeUserCount >= 2 ? "destructive" : "secondary"}
              className={
                activeUserCount >= 2
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-green-100 text-green-700 border-green-200"
              }
            >
              {activeUserCount}
            </Badge>
          </div>
        </div>
      </header>

      <Scene3D store={store} onModelMove={handleModelMove} />
      
      {/* Store-specific widget - shows different video for each store */}
      <Script
        src="http://localhost:8000/widget/video-banner-widget.js"
        data-api-url="http://localhost:8000"
        data-store-id={storeId}
        strategy="afterInteractive"
        onLoad={() => {
          console.log("[Widget] Script loaded");
          setWidgetScriptLoaded(true);
        }}
        onError={(e) => {
          console.error("[Widget] Script load error:", e);
        }}
      />
    </div>
  );
}

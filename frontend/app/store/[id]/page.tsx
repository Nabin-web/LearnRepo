'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Store } from '@/lib/api';
import { socket } from '@/lib/socket';
import Scene3D from '@/components/Scene3D';
import Link from 'next/link';

export default function StorePage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [activeUserCount, setActiveUserCount] = useState<number>(1);

  useEffect(() => {
    // Fetch store data
    api.getStore(storeId)
      .then(setStore)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    // Connect to socket
    socket.connect();

    socket.on('connect', () => {
      console.log('Connected to socket');
      setConnected(true);
      socket.emit('join_store', { storeId });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket');
      setConnected(false);
    });

    socket.on('store_full', () => {
      alert('This store is full (2 users maximum). Please try again later.');
      router.push('/');
    });

    socket.on('model_position_updated', (data: any) => {
      console.log('Model position updated:', data);
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

    socket.on('active_user_count', (data) => {
      if (typeof data.count === 'number') setActiveUserCount(data.count);
    });

    return () => {
      socket.emit('leave_store', { storeId });
      socket.off('connect');
      socket.off('disconnect');
      socket.off('store_full');
      socket.off('model_position_updated');
      socket.off('active_user_count');
      socket.disconnect();
    };
  }, [storeId, router]);

  const handleModelMove = (modelId: string, position: { x: number; y: number }) => {
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
    socket.emit('model_moved', { storeId, modelId, position });

    // Update backend
    api.updateModelPosition(storeId, modelId, position).catch(console.error);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-xl text-white">Loading store...</div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900">
        <div className="text-xl text-red-400 mb-4">Error: {error || 'Store not found'}</div>
        <Link href="/" className="text-purple-400 hover:text-purple-300">
          ← Back to stores
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-black/50 backdrop-blur-sm border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-purple-400 hover:text-purple-300 flex items-center gap-2">
            <span>←</span> Back to Stores
          </Link>
          <h1 className="text-2xl font-bold text-white">{store.name}</h1>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm ${connected ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {connected ? '● Connected' : '○ Disconnected'}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${activeUserCount >= 2 ? "bg-red-500/20 text-red-300" : "bg-green-500/20 text-green-300"}`}>
              {activeUserCount}/2 users
            </span>
          </div>
        </div>
      </header>

      <Scene3D store={store} onModelMove={handleModelMove} />
    </div>
  );
}

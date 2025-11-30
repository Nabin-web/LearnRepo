"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { Store } from "@/lib/api";
import Model3D from "./Model3D";

interface Scene3DProps {
  store: Store;
  onModelMove: (modelId: string, position: { x: number; y: number }) => void;
}

export default function Scene3D({ store, onModelMove }: Scene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    // Initial update
    updateDimensions();

    // Use ResizeObserver for better dimension tracking
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    // Also listen to window resize as fallback
    window.addEventListener("resize", updateDimensions);

    // Start animation after a short delay
    const timer = setTimeout(() => setAnimationComplete(true), 100);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden"
      style={{ height: "calc(100vh - 73px)", minHeight: "600px" }}
    >
      {/* Background Image - Full visible, centered, no cropping */}
      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={store.backgroundImage}
          alt={store.name}
          className="max-w-full max-h-full w-auto h-auto object-contain"
          style={{
            objectFit: "contain",
            objectPosition: "center center",
          }}
          onLoad={() => {
            // Ensure dimensions update after image loads
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              setDimensions({
                width: rect.width,
                height: rect.height,
              });
            }
          }}
        />
      </div>

      {/* 3D Canvas Overlay - only render when dimensions are available */}
      {dimensions.width > 0 && dimensions.height > 0 && (
        <div
          className="absolute inset-0"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Canvas
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              margin: "0 auto",
            }}
            gl={{
              antialias: true,
              alpha: true,
              preserveDrawingBuffer: true,
            }}
            camera={{ position: [0, 0, 100] }}
          >
            <OrthographicCamera
              makeDefault
              position={[0, 0, 100]}
              zoom={1}
              near={0.1}
              far={1000}
              left={-dimensions.width / 2}
              right={dimensions.width / 2}
              top={dimensions.height / 2}
              bottom={-dimensions.height / 2}
            />
            <ambientLight intensity={0.8} />
            <directionalLight position={[10, 10, 5]} intensity={1} />

            {store.models.map((model, index) => (
              <Model3D
                key={model.id}
                model={model}
                onMove={onModelMove}
                animationDelay={index * 0.2}
                shouldAnimate={animationComplete}
              />
            ))}
          </Canvas>
        </div>
      )}

      {/* Instructions */}
      {/* <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-4 py-3 rounded-lg border border-white/20 max-w-xs">
        <p className="text-sm font-semibold mb-2">Instructions:</p>
        <ul className="text-xs space-y-1 text-gray-300">
          <li>• Drag 3D models to reposition them</li>
          <li>• Changes sync in real-time with other users</li>
          <li>• Maximum 2 users can collaborate</li>
          <li>• Models animate in from the corner</li>
        </ul>
      </div> */}
    </div>
  );
}

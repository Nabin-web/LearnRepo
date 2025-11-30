'use client';

import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Model3D as Model3DType } from '@/lib/api';
import * as THREE from 'three';

interface Model3DProps {
  model: Model3DType;
  onMove: (modelId: string, position: { x: number; y: number }) => void;
  animationDelay: number;
  shouldAnimate: boolean;
}

export default function Model3D({ model, onMove, animationDelay, shouldAnimate }: Model3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Load GLB model
  const { scene } = useGLTF(model.url);

  // Animation: entrance from corner
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Entrance animation
    if (shouldAnimate && !hasAnimated && animationProgress < 1) {
      const newProgress = Math.min(animationProgress + delta / (0.5 + animationDelay), 1);
      setAnimationProgress(newProgress);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - newProgress, 3);

      // Start from top-left corner
      const startX = -window.innerWidth / 2 + 50;
      const startY = window.innerHeight / 2 - 50;
      const targetX = model.position.x;
      const targetY = -model.position.y; // Invert Y for Three.js

      meshRef.current.position.x = startX + (targetX - startX) * eased;
      meshRef.current.position.y = startY + (targetY - startY) * eased;

      // Scale animation
      const scale = 0.1 + (model.scale.width * 0.9) * eased;
      meshRef.current.scale.set(scale, scale, scale);

      if (newProgress >= 1) {
        setHasAnimated(true);
      }
    } else if (hasAnimated && !isDragging) {
      // Set final position after animation
      meshRef.current.position.x = model.position.x;
      meshRef.current.position.y = -model.position.y;
      meshRef.current.scale.set(model.scale.width, model.scale.width, model.scale.width);
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsDragging(true);
    (e.target as any).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !meshRef.current) return;
    e.stopPropagation();

    meshRef.current.position.x = e.point.x;
    meshRef.current.position.y = e.point.y;
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !meshRef.current) return;
    e.stopPropagation();

    setIsDragging(false);
    (e.target as any).releasePointerCapture(e.pointerId);

    // Emit position change
    const newPosition = {
      x: meshRef.current.position.x,
      y: -meshRef.current.position.y, // Invert back for 2D coordinates
    };
    onMove(model.id, newPosition);
  };

  return (
    <group
      ref={meshRef}
      position={[model.position.x, -model.position.y, 0]}
      scale={[model.scale.width, model.scale.width, model.scale.width]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <primitive object={scene.clone()} />
    </group>
  );
}

// Preload models
useGLTF.preload('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb');

"use client";

import { useRef, useState, useEffect } from "react";
import { useFrame, ThreeEvent, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Model3D as Model3DType } from "@/lib/api";
import * as THREE from "three";

interface Model3DProps {
  model: Model3DType;
  onMove: (modelId: string, position: { x: number; y: number }) => void;
  animationDelay: number;
  shouldAnimate: boolean;
}

export default function Model3D({
  model,
  onMove,
  animationDelay,
  shouldAnimate,
}: Model3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationY, setRotationY] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [dragOffset, setDragOffset] = useState<THREE.Vector3>(
    new THREE.Vector3()
  );
  const [lastMouseX, setLastMouseX] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { size, gl } = useThree();

  // Load GLB model
  const { scene } = useGLTF(model.url);

  // Convert normalized coordinates (0-1) to 3D world coordinates
  // Normalized: (0,0) = top-left, (1,1) = bottom-right
  // World: center at (0,0), X: -width/2 to width/2, Y: -height/2 to height/2
  const normalizedToWorld = (
    normalizedX: number,
    normalizedY: number
  ): THREE.Vector3 => {
    if (size.width === 0 || size.height === 0) {
      return new THREE.Vector3(0, 0, 0);
    }
    const x = (normalizedX - 0.5) * size.width;
    const y = (0.5 - normalizedY) * size.height; // Invert Y axis
    return new THREE.Vector3(x, y, 0);
  };

  // Convert 3D world coordinates to normalized coordinates (0-1)
  const worldToNormalized = (
    worldPos: THREE.Vector3
  ): { x: number; y: number } => {
    if (size.width === 0 || size.height === 0) {
      return { x: 0.5, y: 0.5 };
    }
    const x = worldPos.x / size.width + 0.5;
    const y = 0.5 - worldPos.y / size.height; // Invert Y axis
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  // Convert stored position (normalized 0-1) to 3D world position
  const getWorldPosition = (pos: { x: number; y: number }): THREE.Vector3 => {
    return normalizedToWorld(pos.x, pos.y);
  };

  // Entrance animation
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Entrance animation: starts small, moves from corner to final position, grows
    if (shouldAnimate && !hasAnimated && animationProgress < 1) {
      const duration = 1.0; // 1 second animation
      const newProgress = Math.min(
        animationProgress + delta / (duration + animationDelay),
        1
      );
      setAnimationProgress(newProgress);

      // Ease-out cubic for smooth animation
      const eased = 1 - Math.pow(1 - newProgress, 3);

      // Start from top-left corner (small size) - normalized (0,0) = top-left
      const startWorldPos = normalizedToWorld(0.1, 0.1); // Slightly inset from corner
      const targetWorldPos = getWorldPosition(model.position);

      // Interpolate position
      meshRef.current.position.lerpVectors(
        startWorldPos,
        targetWorldPos,
        eased
      );

      // Scale animation: start very small (0.1), grow to full size
      const minScale = 0.1;
      const maxScale = model.scale.width;
      const currentScale = minScale + (maxScale - minScale) * eased;
      meshRef.current.scale.set(currentScale, currentScale, currentScale);

      if (newProgress >= 1) {
        setHasAnimated(true);
        // Ensure final position is exactly right
        const finalPos = getWorldPosition(model.position);
        meshRef.current.position.copy(finalPos);
        meshRef.current.scale.set(maxScale, maxScale, maxScale);
      }
    } else if (hasAnimated && !isDragging) {
      // Sync position when model position changes externally (from other users)
      const targetPos = getWorldPosition(model.position);
      if (meshRef.current.position.distanceTo(targetPos) > 0.1) {
        meshRef.current.position.lerp(targetPos, 0.1); // Smooth transition
      }
      meshRef.current.scale.set(
        model.scale.width,
        model.scale.width,
        model.scale.width
      );
    }

    // Apply rotation
    if (meshRef.current) {
      meshRef.current.rotation.y = rotationY;
    }
  });

  // Update position when model changes externally
  useEffect(() => {
    if (!meshRef.current || isDragging) return;
    const targetPos = getWorldPosition(model.position);
    meshRef.current.position.copy(targetPos);
  }, [model.position, isDragging]);

  // Handle mouse wheel for rotation when hovering over the model
  useEffect(() => {
    if (!isHovered) return;

    const handleWheel = (e: WheelEvent) => {
      if (!isHovered) return;
      e.preventDefault();
      e.stopPropagation();
      const rotationSpeed = 0.02;
      setRotationY(
        (prev) => prev + (e.deltaY > 0 ? rotationSpeed : -rotationSpeed)
      );
    };

    const canvas = gl.domElement;
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [isHovered, gl.domElement]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();

    // Right click, middle mouse button, or Shift+click for rotation
    if (e.button === 2 || e.button === 1 || e.shiftKey) {
      setIsRotating(true);
      setLastMouseX(e.clientX);
    } else {
      setIsDragging(true);
      if (meshRef.current) {
        // Calculate offset between mouse and model center
        const modelCenter = meshRef.current.position.clone();
        const mouseWorld = e.point.clone();
        setDragOffset(mouseWorld.sub(modelCenter));
      }
    }

    (e.target as any).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    // Check if Shift key is pressed during move (for rotation)
    if (e.shiftKey && isDragging) {
      setIsDragging(false);
      setIsRotating(true);
      setLastMouseX(e.clientX);
    }

    if (isRotating) {
      e.stopPropagation();
      // Rotate based on horizontal mouse movement
      const deltaX = e.clientX - lastMouseX;
      const rotationSpeed = 0.01;
      setRotationY((prev) => prev + deltaX * rotationSpeed);
      setLastMouseX(e.clientX);
      return;
    }

    if (!isDragging || !meshRef.current) return;
    e.stopPropagation();

    // Update position based on mouse position minus offset
    const newPosition = e.point.clone().sub(dragOffset);

    // Clamp to bounds (optional - keep models within view)
    const halfWidth = size.width / 2;
    const halfHeight = size.height / 2;
    newPosition.x = Math.max(-halfWidth, Math.min(halfWidth, newPosition.x));
    newPosition.y = Math.max(-halfHeight, Math.min(halfHeight, newPosition.y));

    meshRef.current.position.copy(newPosition);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (isRotating) {
      e.stopPropagation();
      setIsRotating(false);
      (e.target as any).releasePointerCapture(e.pointerId);
      return;
    }

    if (!isDragging || !meshRef.current) return;
    e.stopPropagation();

    setIsDragging(false);
    (e.target as any).releasePointerCapture(e.pointerId);

    // Convert 3D position back to normalized coordinates (0-1) for API
    const normalizedPos = worldToNormalized(meshRef.current.position);
    onMove(model.id, normalizedPos);
  };

  // Initial position
  const initialWorldPos = getWorldPosition(model.position);
  const initialScale = hasAnimated ? model.scale.width : 0.1;

  return (
    <group
      ref={meshRef}
      position={[initialWorldPos.x, initialWorldPos.y, 0]}
      scale={[initialScale, initialScale, initialScale]}
      rotation={[0, rotationY, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onContextMenu={(e) => e.preventDefault()} // Prevent context menu on right click
    >
      <primitive object={scene.clone()} />
    </group>
  );
}

// Preload models
useGLTF.preload(
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb"
);

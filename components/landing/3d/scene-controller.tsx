"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function AbstractShape() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.8} position={[3, 0, -2]}>
        <MeshDistortMaterial
          color="#003cbb"
          attach="material"
          distort={0.4}
          speed={1.5}
          roughness={0.1}
          metalness={0.8}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </Sphere>
    </Float>
  );
}

function SecondaryShape() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.15;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * -0.2;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1.5}>
      <Sphere ref={meshRef} args={[1, 32, 32]} scale={1.2} position={[-4, 2, -5]}>
        <MeshDistortMaterial
          color="#4d82ff"
          attach="material"
          distort={0.3}
          speed={2}
          roughness={0.2}
          metalness={0.6}
          transmission={0.5}
          thickness={0.5}
        />
      </Sphere>
    </Float>
  );
}

export function SceneController() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      dpr={[1, 2]} // Limit pixel ratio for performance
      gl={{ antialias: true, alpha: true }}
      className="w-full h-full pointer-events-none opacity-60 dark:opacity-40"
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#4d82ff" />
      
      <AbstractShape />
      <SecondaryShape />
      
      {/* Provides realistic reflections */}
      <Environment preset="city" />
    </Canvas>
  );
}


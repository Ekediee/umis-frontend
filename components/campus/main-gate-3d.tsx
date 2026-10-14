"use client";

/**
 * Babcock University's Main Gate, modelled from the campus photo
 * (Wikimedia Commons, CC0): a round three-storey beige tower with brown rims and
 * square windows, a pergola of dark timber beams at two heights spanning the
 * entrance road on posts, a dark lattice screen under the beams, a small
 * gatehouse at the tower's foot and the university signboard on a post.
 *
 * Local axes: +X runs along the road, Z runs across it (the beams span Z).
 * The scene places and turns the group so the beams cross the real road.
 */

import { useMemo } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";

const BEIGE = "#e6cf9f";
const BEIGE_DARK = "#d4b98a";
const TIMBER = "#5b3523";
const TIMBER_LIGHT = "#6f4430";
const GLASS = "#25313d";
const LATTICE = "#2b2f33";

/** Roof height of the tower: the scene floats the place label above it */
export const MAIN_GATE_TOP = 12.2;

function Box({ size, position, color, rotationY = 0 }: { size: [number, number, number]; position: [number, number, number]; color: string; rotationY?: number }) {
  return (
    <mesh position={position} rotation-y={rotationY} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}

/** Square windows set into the tower wall, facing outwards around the drum */
function TowerWindows({ radius, floors }: { radius: number; floors: number[] }) {
  const items = useMemo(() => {
    const out: { pos: [number, number, number]; rot: number }[] = [];
    for (const y of floors)
      for (const a of [Math.PI - 0.85, Math.PI, Math.PI + 0.85, 0.4]) {
        // Three windows on the road-facing side (local -Z) and one at the back, like the photo
        out.push({ pos: [Math.sin(a) * (radius + 0.02), y, Math.cos(a) * (radius + 0.02)], rot: a });
      }
    return out;
  }, [radius, floors]);
  return (
    <>
      {items.map((w, i) => (
        <group key={i} position={w.pos} rotation-y={w.rot}>
          {/* white frame, then dark glass with a centre bar */}
          <mesh position-z={0.01}>
            <planeGeometry args={[1.25, 1.25]} />
            <meshStandardMaterial color="#f2efe8" roughness={0.6} />
          </mesh>
          <mesh position-z={0.03}>
            <planeGeometry args={[1.0, 1.0]} />
            <meshStandardMaterial color={GLASS} roughness={0.15} metalness={0.3} />
          </mesh>
          <mesh position-z={0.05}>
            <planeGeometry args={[0.08, 1.0]} />
            <meshStandardMaterial color="#f2efe8" />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function MainGate3D({ position, rotationY, selected, onClick }: { position: [number, number, number]; rotationY: number; selected: boolean; onClick?: () => void }) {
  const R = 2.6; // tower radius
  const towerZ = 9; // tower stands beside the road
  const handle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.();
  };
  const slats = useMemo(() => Array.from({ length: 12 }, (_, i) => -11 + i * 2), []);
  const latticeBars = useMemo(() => Array.from({ length: 9 }, (_, i) => i), []);

  return (
    <group position={position} rotation-y={rotationY} onClick={handle}>
      {/* Round tower: three storeys, brown rim at each floor and a capped top */}
      <group position={[0, 0, towerZ]}>
        <mesh position-y={5.4} castShadow receiveShadow>
          <cylinderGeometry args={[R, R, 10.8, 40]} />
          <meshStandardMaterial color={BEIGE} roughness={0.85} />
        </mesh>
        {[3.6, 7.2].map((y) => (
          <mesh key={y} position-y={y}>
            <cylinderGeometry args={[R + 0.06, R + 0.06, 0.22, 40]} />
            <meshStandardMaterial color={BEIGE_DARK} roughness={0.85} />
          </mesh>
        ))}
        <mesh position-y={11.05} castShadow>
          <cylinderGeometry args={[R + 0.35, R + 0.35, 0.5, 40]} />
          <meshStandardMaterial color={TIMBER_LIGHT} roughness={0.7} />
        </mesh>
        <mesh position-y={11.55}>
          <cylinderGeometry args={[R + 0.05, R + 0.25, 0.5, 40]} />
          <meshStandardMaterial color={BEIGE_DARK} roughness={0.85} />
        </mesh>
        <TowerWindows radius={R} floors={[2.0, 5.5, 9.0]} />
        {/* Gatehouse at the tower's foot, towards the road */}
        <Box size={[5.5, 3.2, 4.2]} position={[0, 1.6, -3.4]} color={BEIGE} />
        <Box size={[6.1, 0.4, 4.8]} position={[0, 3.4, -3.4]} color={TIMBER_LIGHT} />
        <mesh position={[0, 1.7, -5.52]}>
          <planeGeometry args={[3.2, 1.3]} />
          <meshStandardMaterial color={GLASS} roughness={0.2} metalness={0.3} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Pergola: two long timber beams at different heights spanning the road, on posts */}
      <Box size={[0.7, 0.9, 30]} position={[-1.6, 7.6, 0]} color={TIMBER} />
      <Box size={[0.7, 0.9, 26]} position={[1.6, 5.8, -1.5]} color={TIMBER} />
      {slats.map((z) => (
        <Box key={`u${z}`} size={[4.6, 0.3, 0.32]} position={[0, 7.95, z]} color={TIMBER_LIGHT} />
      ))}
      {slats.slice(1, -1).map((z) => (
        <Box key={`l${z}`} size={[4.2, 0.28, 0.3]} position={[1.6, 6.2, z - 1]} color={TIMBER_LIGHT} />
      ))}
      {/* Posts at the far end of each beam (the tower carries the near end) */}
      <Box size={[0.8, 7.6, 0.8]} position={[-1.6, 3.8, -14.6]} color={TIMBER} />
      <Box size={[0.8, 5.8, 0.8]} position={[1.6, 2.9, -14.1]} color={TIMBER} />

      {/* Dark lattice screen under the beams on the far side of the road */}
      <group position={[0, 0, -11]}>
        <Box size={[0.25, 4.6, 6.2]} position={[0, 2.3, 0]} color={LATTICE} />
        {latticeBars.map((i) => (
          <Box key={`v${i}`} size={[0.32, 4.6, 0.08]} position={[0, 2.3, -2.8 + i * 0.7]} color="#3d4247" />
        ))}
        {[0.8, 1.9, 3.0, 4.1].map((y) => (
          <Box key={`h${y}`} size={[0.32, 0.08, 6.2]} position={[0, y, 0]} color="#3d4247" />
        ))}
      </group>

      {/* University signboard on a post, beside the entrance */}
      <group position={[4.5, 0, 3.5]}>
        <Box size={[0.25, 3.4, 0.25]} position={[0, 1.7, 0]} color={TIMBER} />
        <Box size={[0.2, 1.4, 2.2]} position={[0, 3.4, 0]} color={TIMBER_LIGHT} />
        <mesh position={[0.11, 3.4, 0]} rotation-y={Math.PI / 2}>
          <planeGeometry args={[1.8, 1.0]} />
          <meshStandardMaterial color="#efe6cf" />
        </mesh>
      </group>

      {/* Low hedge along the front, as in the photo */}
      <Box size={[1.0, 0.9, 10]} position={[5.5, 0.45, 8]} color="#3f7a34" />

      {/* Selected: a blue ring on the ground around the gate */}
      {selected && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.3, 0]} raycast={() => null}>
          <ringGeometry args={[17, 18.5, 64]} />
          <meshBasicMaterial color="#2563eb" transparent opacity={0.65} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

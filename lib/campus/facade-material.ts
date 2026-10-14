/**
 * Building material for the 3D campus. Draws real-looking facades on the GPU,
 * so 460+ buildings stay a single draw call with no textures to download:
 *  - walls: a window per bay on every storey that fits under the eave, with
 *    white frames, floor lines, a darker base course and the odd entrance door
 *  - glass: smooth and slightly reflective; at night some windows glow
 *  - pitched roofs: tile courses with per-tile colour variation
 *  - flat roofs: weathered concrete
 *
 * Needs the `color` (vertex colours) and `aTop` (eave height) attributes that
 * lib/campus/scene3d.ts writes on every building vertex.
 */

import * as THREE from "three";

export const STOREY_M = 3.4;
export const BAY_M = 3.1;

export function createFacadeMaterial(night: boolean) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0, side: THREE.DoubleSide, envMapIntensity: 0.6 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = { value: night ? 1 : 0 };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute float aTop;
varying vec3 vFacadePos;
varying vec3 vFacadeNormal;
varying float vFacadeTop;`,
      )
      .replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
vFacadePos = (modelMatrix * vec4(transformed, 1.0)).xyz;
vFacadeNormal = normalize(mat3(modelMatrix) * objectNormal);
vFacadeTop = aTop;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uNight;
varying vec3 vFacadePos;
varying vec3 vFacadeNormal;
varying float vFacadeTop;
float facadeHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float box(float a, float lo, float hi) { return step(lo, a) * step(a, hi); }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float facadeGlass = 0.0;
float facadeGlow = 0.0;
{
  vec3 n = normalize(vFacadeNormal);
  vec3 c = diffuseColor.rgb;
  if (abs(n.y) < 0.3) {
    // Wall: storeys up, bays along the wall
    vec2 t = normalize(vec2(-n.z, n.x));
    float u = dot(vFacadePos.xz, t);
    float v = vFacadePos.y;
    float storey = ${STOREY_M.toFixed(2)};
    float bay = ${BAY_M.toFixed(2)};
    float fl = floor(v / storey);
    float fv = fract(v / storey);
    float bi = floor(u / bay);
    float fu = fract(u / bay);
    // Only storeys that fit under the eave get windows (no half windows at the roofline)
    float room = step((fl + 0.9) * storey, vFacadeTop + 0.05);
    float win = room * box(fv, 0.30, 0.80) * box(fu, 0.20, 0.80);
    float frame = room * box(fv, 0.26, 0.84) * box(fu, 0.16, 0.84) * (1.0 - win);
    float sill = room * box(fv, 0.22, 0.26) * box(fu, 0.12, 0.88);
    float slab = (1.0 - step(0.045, fv)) * step(1.0, v);
    float plinth = 1.0 - step(0.55, v);
    float r = facadeHash(vec2(bi, fl) + floor(vFacadeTop * 13.0));
    // Ground floor: about one bay in eight is an entrance door (dark timber under a light lintel)
    float entrance = step(fl, 0.5) * step(facadeHash(vec2(bi, floor(vFacadeTop * 13.0)) + 7.3), 0.12);
    float door = entrance * box(fv, 0.0, 0.72) * box(fu, 0.28, 0.72);
    float lintel = entrance * box(fv, 0.72, 0.78) * box(fu, 0.24, 0.76);
    win *= 1.0 - entrance;
    frame *= 1.0 - entrance;
    sill *= 1.0 - entrance;
    // Glazing bars: one vertical mullion per window
    float mullion = win * box(fu, 0.485, 0.515);
    c *= 1.0 - 0.10 * slab - 0.22 * plinth;
    c = mix(c, c * 0.82, sill);
    c = mix(c, vec3(0.93, 0.93, 0.91), frame * 0.9);
    vec3 glass = mix(vec3(0.13, 0.18, 0.24), vec3(0.27, 0.34, 0.42), r);
    // Some windows have curtains drawn
    glass = mix(glass, vec3(0.55, 0.47, 0.38), step(0.86, r) * 0.6);
    c = mix(c, glass, win * (1.0 - mullion));
    c = mix(c, vec3(0.9), mullion);
    c = mix(c, vec3(0.30, 0.20, 0.13), door);
    c = mix(c, vec3(0.92, 0.91, 0.88), lintel);
    facadeGlass = win * (1.0 - mullion);
    facadeGlow = facadeGlass * step(0.5, r) * uNight;
  } else if (n.y < 0.97 && n.y > 0.0) {
    // Pitched roof: tile courses and per-tile shading
    float course = fract(vFacadePos.y / 0.3);
    vec2 tile = floor(vec2(dot(vFacadePos.xz, vec2(n.z, -n.x)) / 0.45, vFacadePos.y / 0.3));
    c *= 0.86 + 0.14 * smoothstep(0.0, 0.25, course);
    c *= 0.93 + 0.12 * facadeHash(tile);
  } else if (n.y >= 0.97) {
    // Flat roof: weathered concrete
    c *= 0.9 + 0.1 * facadeHash(floor(vFacadePos.xz * 0.6));
  }
  diffuseColor.rgb = c;
}`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.08, facadeGlass);`,
      )
      .replace(
        "#include <metalnessmap_fragment>",
        `#include <metalnessmap_fragment>
metalnessFactor = mix(metalnessFactor, 0.35, facadeGlass);`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
totalEmissiveRadiance += vec3(1.0, 0.72, 0.36) * facadeGlow * 0.85;`,
      );
  };
  mat.customProgramCacheKey = () => `campus-facade-${night ? "night" : "day"}`;
  return mat;
}

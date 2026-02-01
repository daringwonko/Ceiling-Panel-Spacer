/**
 * Three.js Material Generator
 * Converts BIM materials to Three.js materials for rendering
 */

import * as THREE from 'three';
import {
  Material,
  MaterialProperties,
  isTransparent,
  isEmissive
} from '../models/Material';

/** Material cache to avoid recreating materials */
const materialCache = new Map<string, THREE.Material>();

/** Cache statistics for debugging */
export function getCacheStats(): { size: number; hits: number; misses: number } {
  return {
    size: materialCache.size,
    hits: cacheHits,
    misses: cacheMisses
  };
}

let cacheHits = 0;
let cacheMisses = 0;

/** Clear the material cache */
export function clearMaterialCache(): void {
  materialCache.forEach(material => material.dispose());
  materialCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}

/** Generate cache key for material */
function generateCacheKey(material: Material): string {
  const props = material.properties;
  return `${material.id}:${props.color}:${props.roughness}:${props.metalness}:${props.opacity}:${props.emissive}:${props.emissiveIntensity}`;
}

/** Convert hex color to Three.js Color */
function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

/** Create Three.js material properties from BIM material */
export function createThreeMaterialProperties(
  material: Material
): THREE.MeshStandardMaterialParameters {
  const props = material.properties;

  const parameters: THREE.MeshStandardMaterialParameters = {
    color: hexToThreeColor(props.color),
    roughness: props.roughness,
    metalness: props.metalness,
    transparent: props.opacity < 1.0,
    opacity: props.opacity,
    side: props.opacity < 1.0 ? THREE.DoubleSide : THREE.FrontSide
  };

  // Add emissive properties if material is emissive
  if (isEmissive(material)) {
    parameters.emissive = hexToThreeColor(props.emissive);
    parameters.emissiveIntensity = props.emissiveIntensity;
  }

  return parameters;
}

/** Generate Three.js material from BIM material */
export function generateThreeMaterial(material: Material): THREE.MeshStandardMaterial {
  const cacheKey = generateCacheKey(material);

  // Check cache first
  const cached = materialCache.get(cacheKey);
  if (cached && cached instanceof THREE.MeshStandardMaterial) {
    cacheHits++;
    return cached.clone();
  }

  cacheMisses++;

  // Create new material
  const parameters = createThreeMaterialProperties(material);
  const threeMaterial = new THREE.MeshStandardMaterial(parameters);

  // Configure depth writing for transparent materials
  if (isTransparent(material)) {
    threeMaterial.depthWrite = false;
    threeMaterial.premultipliedAlpha = true;
  }

  // Store in cache
  materialCache.set(cacheKey, threeMaterial.clone());

  return threeMaterial;
}

/** Generate basic material for loading states */
export function generatePlaceholderMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.5,
    metalness: 0.0
  });
}

/** Generate wireframe material for selection/highlighting */
export function generateWireframeMaterial(
  color: string = '#00FF00'
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: hexToThreeColor(color),
    wireframe: true,
    transparent: true,
    opacity: 0.5
  });
}

/** Generate highlight material */
export function generateHighlightMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x00FF00,
    emissive: 0x00FF00,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.3
  });
}

/** Generate ghost material (for drag previews) */
export function generateGhostMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    transparent: true,
    opacity: 0.3,
    depthWrite: false
  });
}

/** Update existing Three.js material with new BIM properties */
export function updateThreeMaterial(
  threeMaterial: THREE.MeshStandardMaterial,
  material: Material
): void {
  const props = material.properties;

  threeMaterial.color.set(props.color);
  threeMaterial.roughness = props.roughness;
  threeMaterial.metalness = props.metalness;
  threeMaterial.opacity = props.opacity;
  threeMaterial.transparent = props.opacity < 1.0;
  threeMaterial.side = props.opacity < 1.0 ? THREE.DoubleSide : THREE.FrontSide;

  if (isEmissive(material)) {
    threeMaterial.emissive.set(props.emissive);
    threeMaterial.emissiveIntensity = props.emissiveIntensity;
  } else {
    threeMaterial.emissive.setHex(0x000000);
    threeMaterial.emissiveIntensity = 0;
  }

  threeMaterial.needsUpdate = true;
}

/** Load texture from URL */
export async function loadTexture(url: string): Promise<THREE.Texture | null> {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        resolve(texture);
      },
      undefined,
      () => {
        console.warn(`Failed to load texture: ${url}`);
        resolve(null);
      }
    );
  });
}

/** Apply texture maps to material */
export async function applyTextureMaps(
  threeMaterial: THREE.MeshStandardMaterial,
  properties: MaterialProperties
): Promise<void> {
  const loadPromises: Promise<void>[] = [];

  if (properties.textureMap) {
    loadPromises.push(
      loadTexture(properties.textureMap).then(texture => {
        if (texture) threeMaterial.map = texture;
      })
    );
  }

  if (properties.normalMap) {
    loadPromises.push(
      loadTexture(properties.normalMap).then(texture => {
        if (texture) threeMaterial.normalMap = texture;
      })
    );
  }

  if (properties.roughnessMap) {
    loadPromises.push(
      loadTexture(properties.roughnessMap).then(texture => {
        if (texture) threeMaterial.roughnessMap = texture;
      })
    );
  }

  if (properties.metalnessMap) {
    loadPromises.push(
      loadTexture(properties.metalnessMap).then(texture => {
        if (texture) threeMaterial.metalnessMap = texture;
      })
    );
  }

  await Promise.all(loadPromises);
  threeMaterial.needsUpdate = true;
}

/** Dispose of material and free GPU resources */
export function disposeMaterial(material: THREE.Material | null | undefined): void {
  if (!material) return;

  // Dispose textures
  if (material instanceof THREE.MeshStandardMaterial) {
    if (material.map) material.map.dispose();
    if (material.normalMap) material.normalMap.dispose();
    if (material.roughnessMap) material.roughnessMap.dispose();
    if (material.metalnessMap) material.metalnessMap.dispose();
    if (material.emissiveMap) material.emissiveMap.dispose();
  }

  material.dispose();
}

/** Get material for preview (lighter weight) */
export function generatePreviewMaterial(material: Material): THREE.MeshStandardMaterial {
  // For preview, we always use a simpler material without texture maps
  // to improve performance in material panel
  const props = material.properties;

  return new THREE.MeshStandardMaterial({
    color: hexToThreeColor(props.color),
    roughness: props.roughness,
    metalness: props.metalness,
    transparent: props.opacity < 1.0,
    opacity: props.opacity,
    emissive: isEmissive(material) ? hexToThreeColor(props.emissive) : new THREE.Color(0x000000),
    emissiveIntensity: isEmissive(material) ? props.emissiveIntensity : 0
  });
}

// Three.js rendering optimization utilities
import * as THREE from 'three'
import { materialCache, geometryCache } from './memoization'

// Reuse common geometries
const sharedGeometries = new Map<string, THREE.BufferGeometry>()

export function getSharedGeometry(
  type: 'box' | 'plane' | 'cylinder',
  params: Record<string, number>
): THREE.BufferGeometry {
  const key = `${type}:${JSON.stringify(params)}`
  
  if (sharedGeometries.has(key)) {
    return sharedGeometries.get(key)!
  }
  
  let geometry: THREE.BufferGeometry
  
  switch (type) {
    case 'box':
      geometry = new THREE.BoxGeometry(
        params.width || 1,
        params.height || 1,
        params.depth || 1
      )
      break
    case 'plane':
      geometry = new THREE.PlaneGeometry(
        params.width || 1,
        params.height || 1
      )
      break
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(
        params.radiusTop || 1,
        params.radiusBottom || 1,
        params.height || 1,
        params.radialSegments || 8
      )
      break
    default:
      geometry = new THREE.BoxGeometry(1, 1, 1)
  }
  
  // Cache geometry
  sharedGeometries.set(key, geometry)
  
  return geometry
}

// Create optimized material with caching
export function getOptimizedMaterial(
  params: {
    color?: number | string
    roughness?: number
    metalness?: number
    wireframe?: boolean
    transparent?: boolean
    opacity?: number
  } = {}
): THREE.MeshStandardMaterial {
  const cacheKey = JSON.stringify(params)
  
  if (materialCache.has(cacheKey)) {
    return materialCache.get(cacheKey)!
  }
  
  const material = new THREE.MeshStandardMaterial({
    color: params.color || 0xffffff,
    roughness: params.roughness ?? 0.5,
    metalness: params.metalness ?? 0.0,
    wireframe: params.wireframe ?? false,
    transparent: params.transparent ?? false,
    opacity: params.opacity ?? 1.0
  })
  
  materialCache.set(cacheKey, material)
  
  return material
}

// Instanced mesh for rendering many similar objects
export function createInstancedMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  count: number
): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, count)
  
  // Initialize with identity matrices
  const matrix = new THREE.Matrix4()
  for (let i = 0; i < count; i++) {
    matrix.identity()
    mesh.setMatrixAt(i, matrix)
  }
  
  mesh.instanceMatrix.needsUpdate = true
  
  return mesh
}

// Update instance at index
export function updateInstance(
  mesh: THREE.InstancedMesh,
  index: number,
  position: THREE.Vector3,
  rotation: THREE.Euler = new THREE.Euler(0, 0, 0),
  scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1)
): void {
  const matrix = new THREE.Matrix4()
  matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
  mesh.setMatrixAt(index, matrix)
  mesh.instanceMatrix.needsUpdate = true
}

// Frustum culling optimization
export function setupFrustumCulling(
  object: THREE.Object3D,
  camera: THREE.Camera
): void {
  object.frustumCulled = true
  
  // Add to camera frustum
  if (!camera.userData.cullList) {
    camera.userData.cullList = []
  }
  camera.userData.cullList.push(object)
}

// LOD (Level of Detail) management
export function createLODObject(
  highDetail: THREE.Object3D,
  mediumDetail: THREE.Object3D,
  lowDetail: THREE.Object3D,
  distances: [number, number] = [100, 300]
): THREE.LOD {
  const lod = new THREE.LOD()
  
  lod.addLevel(highDetail, 0)
  lod.addLevel(mediumDetail, distances[0])
  lod.addLevel(lowDetail, distances[1])
  
  return lod
}

// Update LOD based on camera distance
export function updateLOD(lod: THREE.LOD, camera: THREE.Camera): void {
  lod.update(camera)
}

// Memory management
export function disposeGeometry(geometry: THREE.BufferGeometry): void {
  geometry.dispose()
}

export function disposeMaterial(material: THREE.Material): void {
  material.dispose()
}

export function disposeTexture(texture: THREE.Texture): void {
  texture.dispose()
}

export function disposeObject(object: THREE.Object3D): void {
  if (object instanceof THREE.Mesh) {
    if (object.geometry) {
      disposeGeometry(object.geometry)
    }
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach(disposeMaterial)
      } else {
        disposeMaterial(object.material)
      }
    }
  }
  
  object.children.forEach(disposeObject)
}

// Cleanup scene
export function cleanupScene(scene: THREE.Scene): void {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      disposeObject(object)
    }
  })
  scene.children = []
}

// Render loop optimization
export function createOptimizedRenderLoop(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: {
    autoClear?: boolean
    pixelRatio?: number
    antialias?: boolean
    shadows?: boolean
  } = {}
): () => void {
  const {
    autoClear = false,
    pixelRatio = Math.min(window.devicePixelRatio, 2),
    antialias = true,
    shadows = false
  } = options
  
  renderer.autoClear = autoClear
  renderer.setPixelRatio(pixelRatio)
  renderer.antialias = antialias
  renderer.shadowMap.enabled = shadows
  
  const frameData = {
    lastTime: 0,
    frameCount: 0,
    fps: 0
  }
  
  const render = (time: number = 0) => {
    requestAnimationFrame(render)
    
    // Calculate FPS
    frameData.frameCount++
    if (time - frameData.lastTime >= 1000) {
      frameData.fps = frameData.frameCount
      frameData.frameCount = 0
      frameData.lastTime = time
    }
    
    renderer.render(scene, camera)
  }
  
  render()
  
  // Return cleanup function
  return () => {
    renderer.dispose()
    cleanupScene(scene)
  }
}

// Batched rendering for many objects
export class BatchedRenderer {
  private batchedMesh: THREE.InstancedMesh | null = null
  private geometries: THREE.BufferGeometry[] = []
  private materials: THREE.Material[] = []
  private instanceCount = 0
  private scene: THREE.Scene
  private materialCache = new Map<string, THREE.Material>()
  
  constructor(scene: THREE.Scene) {
    this.scene = scene
  }
  
  // Add object to batch
  addObject(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: THREE.Vector3,
    scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1),
    rotation: THREE.Euler = new THREE.Euler(0, 0, 0)
  ): void {
    // Use instanced mesh for same geometry/material
    if (this.batchedMesh && 
        this.batchedMesh.geometry === geometry && 
        this.batchedMesh.material === material) {
      
      updateInstance(this.batchedMesh, this.instanceCount, position, rotation, scale)
      this.instanceCount++
    } else {
      // Different geometry/material, create new batch
      this.createBatchedMesh(geometry, material)
      updateInstance(this.batchedMesh!, 0, position, rotation, scale)
      this.instanceCount = 1
    }
  }
  
  private createBatchedMesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    initialCapacity: number = 100
  ): void {
    if (this.batchedMesh) {
      this.scene.remove(this.batchedMesh)
      this.batchedMesh.geometry.dispose()
    }
    
    this.batchedMesh = createInstancedMesh(geometry, material, initialCapacity)
    this.scene.add(this.batchedMesh)
    this.instanceCount = 0
  }
  
  // Finalize batch
  finalize(): void {
    if (this.batchedMesh) {
      this.batchedMesh.count = this.instanceCount
      this.batchedMesh.instanceMatrix.needsUpdate = true
    }
  }
  
  // Clear all batches
  clear(): void {
    if (this.batchedMesh) {
      this.scene.remove(this.batchedMesh)
      this.batchedMesh.geometry.dispose()
      this.batchedMesh = null
    }
    this.instanceCount = 0
  }
}

// Export utilities
export default {
  getSharedGeometry,
  getOptimizedMaterial,
  createInstancedMesh,
  updateInstance,
  setupFrustumCulling,
  createLODObject,
  updateLOD,
  disposeGeometry,
  disposeMaterial,
  disposeTexture,
  disposeObject,
  cleanupScene,
  createOptimizedRenderLoop,
  BatchedRenderer
}

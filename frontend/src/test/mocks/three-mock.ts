// Mock Three.js for testing environment
import { vi } from 'vitest'

// Create comprehensive Three.js mock
const mockThree = {
  // Core classes
  Object3D: class Object3D {
    constructor() {
      this.id = Math.random().toString(36).substring(7)
      this.uuid = this.id
      this.position = { x: 0, y: 0, z: 0, set: vi.fn(), setX: vi.fn(), setY: vi.fn(), setZ: vi.fn(), copy: vi.fn(), clone: vi.fn() }
      this.rotation = { x: 0, y: 0, z: 0, set: vi.fn(), setX: vi.fn(), setY: vi.fn(), setZ: vi.fn(), copy: vi.fn(), clone: vi.fn() }
      this.scale = { x: 1, y: 1, z: 1, set: vi.fn(), setX: vi.fn(), setY: vi.fn(), setZ: vi.fn(), copy: vi.fn(), clone: vi.fn() }
      this.userData = {}
      this.children = []
      this.parent = null
    }
    add = vi.fn()
    remove = vi.fn()
    traverse = vi.fn()
    lookAt = vi.fn()
    updateMatrix = vi.fn()
    updateMatrixWorld = vi.fn()
    applyMatrix4 = vi.fn()
  },
  
  Vector3: class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x
      this.y = y
      this.z = z
    }
    set = vi.fn().mockReturnThis()
    copy = vi.fn().mockReturnThis()
    clone = vi.fn().mockReturnThis(() => new mockThree.Vector3(this.x, this.y, this.z))
    add = vi.fn().mockReturnThis()
    sub = vi.fn().mockReturnThis()
    multiplyScalar = vi.fn().mockReturnThis()
    dot = vi.fn().mockReturnValue(0)
    cross = vi.fn().mockReturnThis()
    normalize = vi.fn().mockReturnThis()
    length = vi.fn().mockReturnValue(1)
    distanceTo = vi.fn().mockReturnValue(1)
  },
  
  Vector2: class Vector2 {
    constructor(x = 0, y = 0) {
      this.x = x
      this.y = y
    }
    set = vi.fn().mockReturnThis()
    copy = vi.fn().mockReturnThis()
    clone = vi.fn().mockReturnThis()
    add = vi.fn().mockReturnThis()
    sub = vi.fn().mockReturnThis()
    multiplyScalar = vi.fn().mockReturnThis()
    length = vi.fn().mockReturnValue(1)
  },
  
  Color: class Color {
    constructor(hex = 0xffffff) {
      this.hex = hex
    }
    set = vi.fn().mockReturnThis()
    copy = vi.fn().mockReturnThis()
    toHex = vi.fn().mockReturnValue('0xffffff')
  },
  
  Matrix4: class Matrix4 {
    constructor() {
      this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    }
    identity = vi.fn().mockReturnThis()
    copy = vi.fn().mockReturnThis()
    multiply = vi.fn().mockReturnThis()
    multiplyMatrices = vi.fn().mockReturnThis()
    invert = vi.fn().mockReturnThis()
    transpose = vi.fn().mockReturnThis()
  },
  
  Quaternion: class Quaternion {
    constructor() {
      this.x = 0
      this.y = 0
      this.z = 0
      this.w = 1
    }
    set = vi.fn().mockReturnThis()
    copy = vi.fn().mockReturnThis()
    setFromAxisAngle = vi.fn().mockReturnThis()
  },
  
  // Geometry classes
  BoxGeometry: class BoxGeometry {
    constructor(width = 1, height = 1, depth = 1) {
      this.parameters = { width, height, depth }
      this.attributes = {}
    }
  },
  
  PlaneGeometry: class PlaneGeometry {
    constructor(width = 1, height = 1) {
      this.parameters = { width, height }
      this.attributes = {}
    }
  },
  
  // Material classes
  MeshStandardMaterial: class MeshStandardMaterial {
    constructor(parameters = {}) {
      this.color = parameters.color || 0xffffff
      this.roughness = parameters.roughness || 0.5
      this.metalness = parameters.metalness || 0.0
      this.map = null
      this.needsUpdate = false
    }
    copy = vi.fn().mockReturnThis()
    dispose = vi.fn()
  },
  
  MeshBasicMaterial: class MeshBasicMaterial {
    constructor(parameters = {}) {
      this.color = parameters.color || 0xffffff
      this.wireframe = parameters.wireframe || false
    }
    dispose = vi.fn()
  },
  
  LineBasicMaterial: class LineBasicMaterial {
    constructor(parameters = {}) {
      this.color = parameters.color || 0xffffff
      this.linewidth = parameters.linewidth || 1
    }
  },
  
  // Scene and renderer
  Scene: class Scene {
    constructor() {
      this.children = []
      this.background = null
      this.fog = null
    }
    add = vi.fn()
    remove = vi.fn()
    traverse = vi.fn()
  },
  
  WebGLRenderer: class WebGLRenderer {
    constructor(parameters = {}) {
      this.domElement = document.createElement('canvas')
      this.shadowMap = { enabled: false }
      this.setSize = vi.fn()
      this.setPixelRatio = vi.fn()
      this.render = vi.fn()
      this.dispose = vi.fn()
      this.getContext = vi.fn().mockReturnValue({
        getExtension: vi.fn(),
        getParameter: vi.fn()
      })
    }
  },
  
  // Raycaster for mouse picking
  Raycaster: class Raycaster {
    constructor() {
      this.ray = { origin: new mockThree.Vector3(), direction: new mockThree.Vector3() }
      this.intersectObjects = vi.fn().mockReturnValue([])
      this.setFromCamera = vi.fn()
    }
  },
  
  // Clock for animation timing
  Clock: class Clock {
    constructor() {
      this.getElapsedTime = vi.fn().mockReturnValue(0)
      this.getDelta = vi.fn().mockReturnValue(0.016)
      this.start = vi.fn()
      this.stop = vi.fn()
    }
  }
}

export default mockThree

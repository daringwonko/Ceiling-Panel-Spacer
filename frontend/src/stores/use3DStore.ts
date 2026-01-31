import { create } from 'zustand';

interface Vector3 { x: number; y: number; z: number; }

interface GeometryObject {
  id: string;
  type: 'cube';
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  color: string;
}

interface Camera {
  position: Vector3;
  target: Vector3;
  zoom: number;
}

interface ThreeDState {
  geometry: GeometryObject[];
  selectedObject: string | null;
  camera: Camera;
  cameraReset: boolean;
  addGeometry: (type: 'cube', position?: Vector3) => void;
  selectObject: (id: string | null) => void;
  moveCamera: (position: Vector3, target: Vector3) => void;
  resetCamera: () => void;
}

const DEFAULT_CAMERA = {
  position: { x: 5, y: 5, z: 5 },
  target: { x: 0, y: 0, z: 0 },
  zoom: 1
};

export const use3DStore = create<ThreeDState>((set, get) => ({
  geometry: [],
  selectedObject: null,
  camera: DEFAULT_CAMERA,
  cameraReset: false,
  addGeometry: (type, position = { x: 0, y: 0, z: 0 }) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newGeom: GeometryObject = {
      id,
      type,
      position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#ff0000'
    };
    set(state => ({ geometry: [...state.geometry, newGeom] }));
  },
  selectObject: (id) => set({ selectedObject: id }),
  moveCamera: (position, target) => set({ camera: { position, target, zoom: 1 } }),
  resetCamera: () => set({ cameraReset: true })
}));

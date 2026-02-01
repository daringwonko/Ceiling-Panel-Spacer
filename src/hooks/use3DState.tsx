import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as THREE from 'three';

interface MeshData {
  id: string;
  type: 'cube' | 'sphere';
  position: [number, number, number];
  rotation: [number, number, number];
  mesh?: THREE.Mesh;
}

interface 3DStateContextType {
  meshes: MeshData[];
  addMesh: (type: 'cube' | 'sphere', position?: [number, number, number]) => void;
  removeMesh: (id: string) => void;
  rotateMesh: (id: string) => void;
  clearMeshes: () => void;
  selectedMeshId: string | null;
  setSelectedMeshId: (id: string | null) => void;
}

const 3DStateContext = createContext<3DStateContextType | null>(null);

export const use3DState = () => {
  const context = useContext(3DStateContext);
  if (!context) {
    throw new Error('use3DState must be used within a 3DStateProvider');
  }
  return context;
};

interface 3DStateProviderProps {
  children: React.ReactNode;
}

export const 3DStateProvider: React.FC<3DStateProviderProps> = ({ children }) => {
  const [meshes, setMeshes] = useState<MeshData[]>([]);
  const [selectedMeshId, setSelectedMeshId] = useState<string | null>(null);

  const addMesh = useCallback((type: 'cube' | 'sphere', position: [number, number, number] = [0, 0.5, 0]) => {
    const id = `mesh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMesh: MeshData = {
      id,
      type,
      position,
      rotation: [0, 0, 0],
    };
    setMeshes((prev) => [...prev, newMesh]);
    return id;
  }, []);

  const removeMesh = useCallback((id: string) => {
    setMeshes((prev) => prev.filter((mesh) => mesh.id !== id));
    if (selectedMeshId === id) {
      setSelectedMeshId(null);
    }
  }, [selectedMeshId]);

  const rotateMesh = useCallback((id: string) => {
    setMeshes((prev) =>
      prev.map((mesh) =>
        mesh.id === id
          ? {
              ...mesh,
              rotation: [
                mesh.rotation[0] + Math.PI / 4,
                mesh.rotation[1] + Math.PI / 4,
                mesh.rotation[2],
              ],
            }
          : mesh
      )
    );
  }, []);

  const clearMeshes = useCallback(() => {
    setMeshes([]);
    setSelectedMeshId(null);
  }, []);

  return (
    <3DStateContext.Provider
      value={{
        meshes,
        addMesh,
        removeMesh,
        rotateMesh,
        clearMeshes,
        selectedMeshId,
        setSelectedMeshId,
      }}
    >
      {children}
    </3DStateContext.Provider>
  );
};

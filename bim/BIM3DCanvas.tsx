/**
 * BIM3DCanvas - 3D Canvas Component
 * 
 * React component for rendering 3D BIM objects using React Three Fiber.
 * Provides orbit controls, grid, lighting, and object selection.
 */

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Grid, 
  PerspectiveCamera,
  Plane
} from '@react-three/drei';
import * as THREE from 'three';

export interface BIM3DObject extends THREE.Group {
  id: string;
  isSelected: () => boolean;
  select: () => void;
  deselect: () => void;
}

export interface BIM3DCanvasProps {
  objects: BIM3DObject[];
  selectedIds: string[];
  workingPlane?: 'XY' | 'XZ' | 'YZ';
  gridSize?: number;
  gridDivisions?: number;
  backgroundColor?: string;
  showGrid?: boolean;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  onObjectSelect?: (id: string, multi: boolean) => void;
  onObjectDeselect?: (id: string) => void;
  onCanvasClick?: (point: THREE.Vector3) => void;
  onObjectHover?: (id: string | null) => void;
}

interface CanvasSceneProps {
  objects: BIM3DObject[];
  selectedIds: string[];
  gridSize: number;
  gridDivisions: number;
  showGrid: boolean;
  onObjectSelect?: (id: string, multi: boolean) => void;
  onObjectDeselect?: (id: string) => void;
  onCanvasClick?: (point: THREE.Vector3) => void;
  onObjectHover?: (id: string | null) => void;
}

const BIMObjectWrapper: React.FC<{ 
  object: BIM3DObject; 
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onHover: (id: string | null) => void;
}> = ({ object, isSelected, onSelect, onHover }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  useEffect(() => {
    if (isSelected && !object.isSelected()) {
      object.select();
    } else if (!isSelected && object.isSelected()) {
      object.deselect();
    }
  }, [isSelected, object]);

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    const multi = e.ctrlKey || e.metaKey;
    onSelect(object.id, multi);
  }, [object.id, onSelect]);

  return (
    <primitive 
      object={object} 
      ref={meshRef}
      onClick={handleClick}
      onPointerOver={(e: any) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHover(object.id);
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
        onHover(null);
      }}
    />
  );
};

const Scene: React.FC<CanvasSceneProps> = ({
  objects,
  selectedIds,
  gridSize,
  gridDivisions,
  showGrid,
  onObjectSelect,
  onObjectDeselect,
  onCanvasClick,
  onObjectHover,
}) => {
  const { camera, raycaster, scene, gl } = useThree();
  const controlsRef = useRef<any>(null);

  const handleCanvasClick = useCallback((e: any) => {
    if (e.button !== 0) return;
    
    const intersects = e.intersections;
    if (intersects.length === 0) {
      const mouse = new THREE.Vector2(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      
      raycaster.setFromCamera(mouse, camera);
      const target = new THREE.Vector3();
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = raycaster.ray.intersectPlane(plane, target);
      
      if (intersection && onCanvasClick) {
        onCanvasClick(target);
      }
      
      if (!e.ctrlKey && !e.metaKey) {
        selectedIds.forEach(id => onObjectDeselect?.(id));
      }
    }
  }, [camera, raycaster, onCanvasClick, onObjectDeselect, selectedIds]);

  const handleObjectSelect = useCallback((id: string, multi: boolean) => {
    if (onObjectSelect) {
      onObjectSelect(id, multi);
    }
  }, [onObjectSelect]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight 
        position={[-10, 10, -5]} 
        intensity={0.5}
      />
      
      {showGrid && (
        <Grid
          position={[0, -0.01, 0]}
          args={[gridSize, gridSize]}
          divisions={gridDivisions}
          colorCenterLine="#444444"
          colorGrid="#333333"
          fadeDistance={gridSize}
          fadeStrength={1}
          infiniteGrid={false}
        />
      )}
      
      {objects.map((obj) => (
        <BIMObjectWrapper
          key={obj.id}
          object={obj}
          isSelected={selectedIds.includes(obj.id)}
          onSelect={handleObjectSelect}
          onHover={onObjectHover || (() => {})}
        />
      ))}
      
      <PerspectiveCamera
        makeDefault
        position={[5000, 5000, 5000]}
        fov={45}
        near={1}
        far={100000}
      />
      
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={100}
        maxDistance={50000}
        target={[0, 0, 0]}
        onClick={handleCanvasClick}
      />
      
      <Plane
        args={[100000, 100000]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        onClick={handleCanvasClick}
      />
    </>
  );
};

export const BIM3DCanvas: React.FC<BIM3DCanvasProps> = ({
  objects,
  selectedIds,
  workingPlane = 'XY',
  gridSize = 10000,
  gridDivisions = 100,
  backgroundColor = '#1a1a1a',
  showGrid = true,
  cameraPosition = [5000, 5000, 5000],
  cameraTarget = [0, 0, 0],
  onObjectSelect,
  onObjectDeselect,
  onCanvasClick,
  onObjectHover,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextLostRef = useRef<boolean>(false);
  const disposedObjectsRef = useRef<Set<string>>(new Set());

  const onContextLost = useCallback((e: Event) => {
    e.preventDefault();
    console.warn('WebGL context lost');
    contextLostRef.current = true;
  }, []);

  const onContextRestored = useCallback(() => {
    console.info('WebGL context restored');
    contextLostRef.current = false;
    disposedObjectsRef.current.clear();
  }, []);

  const disposeObject = useCallback((obj: BIM3DObject) => {
    if (disposedObjectsRef.current.has(obj.id)) return;
    disposedObjectsRef.current.add(obj.id);
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn('WebGL context lost');
      contextLostRef.current = true;
    };

    const handleContextRestored = () => {
      console.info('WebGL context restored');
      contextLostRef.current = false;
      disposedObjectsRef.current.clear();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      objects.forEach(disposeObject);
      disposedObjectsRef.current.clear();
    };
  }, [objects, disposeObject]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      backgroundColor,
      position: 'relative'
    }}>
      <Canvas
        ref={canvasRef}
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
          onContextLost,
          onContextRestored,
        }}
        shadows
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <Scene
          objects={objects}
          selectedIds={selectedIds}
          gridSize={gridSize}
          gridDivisions={gridDivisions}
          showGrid={showGrid}
          onObjectSelect={onObjectSelect}
          onObjectDeselect={onObjectDeselect}
          onCanvasClick={onCanvasClick}
          onObjectHover={onObjectHover}
        />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        color: '#888',
        fontSize: '12px',
        fontFamily: 'monospace',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        <div>3D View | {objects.length} objects</div>
        <div>{selectedIds.length} selected</div>
      </div>
    </div>
  );
};

export function useBIM3DCanvas() {
  const [objects, setObjects] = useState<BIM3DObject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const addObject = useCallback((obj: BIM3DObject) => {
    setObjects(prev => [...prev, obj]);
  }, []);

  const removeObject = useCallback((id: string) => {
    setObjects(prev => prev.filter(obj => obj.id !== id));
    setSelectedIds(prev => prev.filter(sid => sid !== id));
  }, []);

  const selectObject = useCallback((id: string, multi: boolean = false) => {
    if (multi) {
      setSelectedIds(prev => 
        prev.includes(id) ? prev : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  }, []);

  const deselectObject = useCallback((id: string) => {
    setSelectedIds(prev => prev.filter(sid => sid !== id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    objects,
    selectedIds,
    addObject,
    removeObject,
    selectObject,
    deselectObject,
    clearSelection,
  };
}

export default BIM3DCanvas;

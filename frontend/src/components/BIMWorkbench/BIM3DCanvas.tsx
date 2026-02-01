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
  Plane,
  Box
} from '@react-three/drei';
import * as THREE from 'three';
import { BIM3DObject } from './BIM3DObject';
import { BIM3DCanvasProps } from './types/3d';

/**
 * Props for the canvas scene component
 */
interface CanvasSceneProps {
  objects: BIM3DObject[];
  selectedIds: string[];
  gridSize: number;
  gridDivisions: number;
  showGrid: boolean;
  onObjectSelect?: (id: string, multi: boolean) => void;
  onObjectDeselect?: (id: string) => void;
  onCanvasClick?: (point: THREE.Vector3) => void;
}

/**
 * Object wrapper component that manages BIM3DObject in the scene
 */
const BIMObjectWrapper: React.FC<{ 
  object: BIM3DObject; 
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
}> = ({ object, isSelected, onSelect }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  // Update selection state when it changes
  useEffect(() => {
    if (isSelected && !object.isSelected()) {
      object.select();
    } else if (!isSelected && object.isSelected()) {
      object.deselect();
    }
  }, [isSelected, object]);

  // Handle click
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
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    />
  );
};

/**
 * Scene component that handles rendering and interaction
 */
const Scene: React.FC<CanvasSceneProps> = ({
  objects,
  selectedIds,
  gridSize,
  gridDivisions,
  showGrid,
  onObjectSelect,
  onObjectDeselect,
  onCanvasClick,
}) => {
  const { camera, raycaster, scene, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Handle canvas click for empty space
  const handleCanvasClick = useCallback((e: any) => {
    // Only handle left clicks
    if (e.button !== 0) return;
    
    // Check if we clicked on an object
    const intersects = e.intersections;
    if (intersects.length === 0) {
      // Clicked on empty space
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
      
      // Deselect all if not multi-selecting
      if (!e.ctrlKey && !e.metaKey) {
        selectedIds.forEach(id => onObjectDeselect?.(id));
      }
    }
  }, [camera, raycaster, onCanvasClick, onObjectDeselect, selectedIds]);

  // Handle object selection
  const handleObjectSelect = useCallback((id: string, multi: boolean) => {
    if (onObjectSelect) {
      onObjectSelect(id, multi);
    }
  }, [onObjectSelect]);

  // Update controls target if needed
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <>
      {/* Lighting */}
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
      
      {/* Grid */}
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
      
      {/* BIM Objects */}
      {objects.map((obj) => (
        <BIMObjectWrapper
          key={obj.id}
          object={obj}
          isSelected={selectedIds.includes(obj.id)}
          onSelect={handleObjectSelect}
        />
      ))}
      
      {/* Camera and Controls */}
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
      
      {/* Background plane for click detection */}
      <Plane
        args={[100000, 100000]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        onClick={handleCanvasClick}
      />
    </>
  );
};

/**
 * BIM3DCanvas - Main 3D Canvas Component
 * 
 * Provides a complete 3D viewport for BIM objects with:
 * - Orbit controls for navigation
 * - Grid for spatial reference
 * - Object selection via raycasting
 * - Proper lighting setup
 */
export const BIM3DCanvas: React.FC<BIM3DCanvasProps> = ({
  objects,
  selectedIds,
  workingPlane,
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
        />
      </Canvas>
      
      {/* Overlay UI for camera info */}
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

/**
 * Hook to interact with the 3D canvas
 */
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

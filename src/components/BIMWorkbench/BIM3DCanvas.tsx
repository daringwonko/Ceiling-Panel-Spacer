import React, { Suspense, useRef, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { BIM3DObject } from './BIM3DObject';
import { WorkingPlane } from './types/3d';

/**
 * BIM3DCanvas Props
 */
export interface BIM3DCanvasProps {
  /** Array of BIM objects to display */
  objects: BIM3DObject[];
  
  /** Currently selected object IDs */
  selectedIds: string[];
  
  /** Current working plane configuration */
  workingPlane: WorkingPlane;
  
  /** Grid size in units */
  gridSize?: number;
  
  /** Grid divisions */
  gridDivisions?: number;
  
  /** Object selection callback */
  onObjectSelect?: (id: string, multi: boolean) => void;
  
  /** Object deselection callback */
  onObjectDeselect?: (id: string) => void;
  
  /** Canvas click callback (for placing objects) */
  onCanvasClick?: (point: THREE.Vector3) => void;
  
  /** Canvas style overrides */
  style?: React.CSSProperties;
  
  /** Camera position */
  cameraPosition?: [number, number, number];
  
  /** Camera target */
  cameraTarget?: [number, number, number];
}

/**
 * Scene Component
 * Handles the actual 3D scene content
 */
const Scene: React.FC<{
  objects: BIM3DObject[];
  selectedIds: string[];
  workingPlane: WorkingPlane;
  gridSize: number;
  gridDivisions: number;
  onObjectSelect?: (id: string, multi: boolean) => void;
  onObjectDeselect?: (id: string) => void;
  onCanvasClick?: (point: THREE.Vector3) => void;
}> = ({
  objects,
  selectedIds,
  workingPlane,
  gridSize,
  gridDivisions,
  onObjectSelect,
  onObjectDeselect,
  onCanvasClick
}) => {
  const { camera, scene, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const mouse = useMemo(() => new THREE.Vector2(), []);
  
  // Update object selection states
  React.useEffect(() => {
    objects.forEach(obj => {
      const isSelected = selectedIds.includes(obj.metadata.id);
      if (isSelected && !obj.isSelected()) {
        obj.select();
      } else if (!isSelected && obj.isSelected()) {
        obj.deselect();
      }
    });
  }, [objects, selectedIds]);
  
  // Handle canvas click for object selection and placement
  const handleClick = useCallback((event: any) => {
    // Calculate mouse position in normalized device coordinates
    const rect = gl.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Set up raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Check for object intersections
    const intersects = raycaster.intersectObjects(objects, true);
    
    if (intersects.length > 0) {
      // Find the BIM3DObject parent
      let target: THREE.Object3D | null = intersects[0].object;
      while (target && !(target instanceof BIM3DObject)) {
        target = target.parent;
      }
      
      if (target instanceof BIM3DObject) {
        const id = target.metadata.id;
        const isMultiSelect = event.ctrlKey || event.metaKey;
        
        if (selectedIds.includes(id) && isMultiSelect) {
          // Deselect if already selected and multi-selecting
          onObjectDeselect?.(id);
        } else {
          // Select the object
          onObjectSelect?.(id, isMultiSelect);
        }
        return;
      }
    }
    
    // If no object hit and canvas click handler provided
    if (onCanvasClick) {
      // Intersect with working plane
      const plane = new THREE.Plane(
        workingPlane.normal,
        workingPlane.constant
      );
      const intersectionPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectionPoint);
      
      if (intersectionPoint) {
        onCanvasClick(intersectionPoint);
      }
    }
  }, [camera, gl, objects, raycaster, mouse, selectedIds, onObjectSelect, onObjectDeselect, onCanvasClick, workingPlane]);
  
  // Add click listener
  React.useEffect(() => {
    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [gl, handleClick]);
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight
        position={[-10, 10, -5]}
        intensity={0.3}
      />
      
      {/* Grid */}
      <Grid
        position={workingPlane.origin.toArray()}
        args={[gridSize, gridSize]}
        cellSize={gridSize / gridDivisions}
        cellThickness={0.5}
        cellColor="#444444"
        sectionSize={gridSize / (gridDivisions / 5)}
        sectionThickness={1}
        sectionColor="#666666"
        fadeDistance={50}
        fadeStrength={1}
        infiniteGrid={false}
        followCamera={false}
      />
      
      {/* BIM Objects */}
      {objects.map(obj => (
        <primitive key={obj.metadata.id} object={obj} />
      ))}
      
      {/* Orbit Controls */}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={100}
        target={workingPlane.origin.toArray()}
        makeDefault
      />
    </>
  );
};

/**
 * BIM3DCanvas Component
 * 
 * Main 3D canvas component for BIM workbench.
 * Renders Three.js scene with orbit controls, grid, and object selection.
 */
export const BIM3DCanvas: React.FC<BIM3DCanvasProps> = ({
  objects,
  selectedIds,
  workingPlane,
  gridSize = 50,
  gridDivisions = 50,
  onObjectSelect,
  onObjectDeselect,
  onCanvasClick,
  style,
  cameraPosition = [20, 20, 20],
  cameraTarget = [0, 0, 0]
}) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        ...style
      }}
    >
      <Canvas
        camera={{
          position: cameraPosition,
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense fallback={null}>
          <Scene
            objects={objects}
            selectedIds={selectedIds}
            workingPlane={workingPlane}
            gridSize={gridSize}
            gridDivisions={gridDivisions}
            onObjectSelect={onObjectSelect}
            onObjectDeselect={onObjectDeselect}
            onCanvasClick={onCanvasClick}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default BIM3DCanvas;

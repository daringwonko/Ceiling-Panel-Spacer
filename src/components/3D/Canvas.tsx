import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { use3DState } from '../hooks/use3DState';
import { ToolAction } from '../components/ui/ToolPanel';

interface CanvasProps {
  onAction?: (action: ToolAction) => void;
  className?: string;
}

export const Canvas: React.FC<CanvasProps> = ({ onAction, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const { meshes, addMesh, removeMesh, rotateMesh } = use3DState();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040, 2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Add grid helper
    const gridHelper = new THREE.GridHelper(20, 20);
    scene.add(gridHelper);

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      // Rotate meshes
      meshesRef.current.forEach((mesh) => {
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
      });

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    setIsInitialized(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Sync meshes with Three.js scene
  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;

    // Remove deleted meshes
    const meshIds = new Set(meshes.map((m) => m.id));
    meshesRef.current.forEach((mesh, id) => {
      if (!meshIds.has(id)) {
        scene.remove(mesh);
        meshesRef.current.delete(id);
      }
    });

    // Add/update meshes
    meshes.forEach((meshData) => {
      let mesh = meshesRef.current.get(meshData.id);

      if (!mesh) {
        // Create new mesh
        if (meshData.type === 'cube') {
          mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x007bff })
          );
        } else if (meshData.type === 'sphere') {
          mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshStandardMaterial({ color: 0x28a745 })
          );
        }

        if (mesh) {
          scene.add(mesh);
          meshesRef.current.set(meshData.id, mesh);
        }
      }

      if (mesh) {
        // Update mesh properties
        mesh.position.set(meshData.position[0], meshData.position[1], meshData.position[2]);
        mesh.rotation.set(meshData.rotation[0], meshData.rotation[1], meshData.rotation[2]);
      }
    });
  }, [meshes]);

  // Handle external actions
  const handleAction = (action: ToolAction) => {
    if (action.type === 'add_cube') {
      addMesh('cube');
    } else if (action.type === 'add_sphere') {
      addMesh('sphere');
    } else if (action.type === 'delete') {
      // Delete selected mesh
      // In a real app, we'd track selection state
    } else if (action.type === 'rotate') {
      // Rotate selected mesh
      // In a real app, we'd track selection state
    }

    if (onAction) {
      onAction(action);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Canvas Controls Overlay */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => {
            if (cameraRef.current) {
              cameraRef.current.position.set(5, 5, 5);
              cameraRef.current.lookAt(0, 0, 0);
            }
          }}
          className="bg-white shadow-md rounded px-3 py-1 text-sm hover:bg-gray-100"
        >
          Reset View
        </button>
      </div>

      {/* Mesh Count Indicator */}
      <div className="absolute bottom-4 left-4 bg-white shadow-md rounded px-3 py-1 text-sm">
        Meshes: {meshes.length}
      </div>

      {/* Status Indicator */}
      <div className="absolute top-4 left-4">
        {isInitialized ? (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            ✓ 3D Ready
          </span>
        ) : (
          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
            ⏳ Initializing...
          </span>
        )}
      </div>
    </div>
  );
};

export default Canvas;

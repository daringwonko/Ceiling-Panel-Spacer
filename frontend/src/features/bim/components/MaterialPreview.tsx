import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Material } from '../models/Material';
import { generatePreviewMaterial } from '../utils/threeMaterialGenerator';

interface MaterialPreviewProps {
  /** Material to preview */
  material: Material;
  /** Preview size in pixels */
  size?: number;
  /** Auto-rotate the preview */
  autoRotate?: boolean;
  /** Show grid helper */
  showGrid?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * MaterialPreview Component
 * Renders a 3D preview of a material using Three.js
 */
export const MaterialPreview: React.FC<MaterialPreviewProps> = ({
  material,
  size = 100,
  autoRotate = true,
  showGrid = false,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a2a2a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 3);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create preview sphere
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const threeMaterial = generatePreviewMaterial(material);
    const mesh = new THREE.Mesh(geometry, threeMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshRef.current = mesh;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 5, 5);
    mainLight.castShadow = true;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    // Optional grid
    if (showGrid) {
      const gridHelper = new THREE.GridHelper(5, 10, 0x444444, 0x333333);
      gridHelper.position.y = -1.2;
      scene.add(gridHelper);
    }

    setIsLoading(false);

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      if (autoRotate && meshRef.current) {
        meshRef.current.rotation.y += 0.01;
        meshRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      geometry.dispose();
      threeMaterial.dispose();
      renderer.dispose();
    };
  }, [size, autoRotate, showGrid]);

  // Update material when it changes
  useEffect(() => {
    if (meshRef.current) {
      const newMaterial = generatePreviewMaterial(material);
      meshRef.current.material = newMaterial;
    }
  }, [material]);

  return (
    <div
      ref={containerRef}
      className={`material-preview ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#2a2a2a',
            color: '#666'
          }}
        >
          Loading...
        </div>
      )}
    </div>
  );
};

export default MaterialPreview;

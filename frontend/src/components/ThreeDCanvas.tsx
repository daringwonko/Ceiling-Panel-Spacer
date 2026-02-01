import React, { useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { use3DStore } from '../stores/use3DStore';
import * as THREE from 'three';

const ThreeDCanvas: React.FC = () => {
  const geometry = use3DStore(state => state.geometry);
  const cameraReset = use3DStore(state => state.cameraReset);
  const controlsRef = useRef<any>(null);
  const geometriesRef = useRef<THREE.BufferGeometry[]>([]);
  const materialsRef = useRef<THREE.Material[]>([]);

  const onContextLost = useCallback((e: Event) => {
    e.preventDefault();
    console.warn('WebGL context lost');
  }, []);

  const onContextRestored = useCallback(() => {
    console.info('WebGL context restored');
  }, []);

  useEffect(() => {
    if (cameraReset && controlsRef.current) {
      controlsRef.current.reset();
      use3DStore.setState({ cameraReset: false });
    }
  }, [cameraReset]);

  useEffect(() => {
    return () => {
      geometriesRef.current.forEach(geom => geom.dispose());
      materialsRef.current.forEach(mat => mat.dispose());
      geometriesRef.current = [];
      materialsRef.current = [];
    };
  }, []);

  const DEFAULT_CAMERA = {
    position: [5, 5, 5] as [number, number, number],
    fov: 75
  };

  return (
    <Canvas
      gl={{
        onContextLost,
        onContextRestored,
        preserveDrawingBuffer: true,
      }}
      style={{ height: '500px', width: '100%' }}
      camera={DEFAULT_CAMERA}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      {geometry.map(obj => (
        <mesh key={obj.id} position={[obj.position.x, obj.position.y, obj.position.z]}>
          <boxGeometry args={[obj.scale.x, obj.scale.y, obj.scale.z]} />
          <meshStandardMaterial color={obj.color} />
        </mesh>
      ))}
      <OrbitControls ref={controlsRef} />
    </Canvas>
  );
};

export default ThreeDCanvas;
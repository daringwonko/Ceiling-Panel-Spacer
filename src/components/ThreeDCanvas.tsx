import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';

interface ThreeDCanvasProps {
  width?: number;
  height?: number;
}

const Scene: React.FC = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Grid
        position={[0, -0.01, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#666666"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#999999"
        fadeDistance={25}
        fadeStrength={1}
      />
      {/* TODO: Add ceiling panel components here */}
    </>
  );
};

const ThreeDCanvas: React.FC<ThreeDCanvasProps> = ({
  width = 800,
  height = 600
}) => {
  return (
    <div style={{ width, height, border: '1px solid #ccc' }}>
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Scene />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ThreeDCanvas;
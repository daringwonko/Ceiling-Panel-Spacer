import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { Box } from '@mui/material';

const Arch3DEditor = () => {
  return (
    <div className="w-full h-full bg-slate-900">
      <div className="grid grid-cols-1 lg:grid-cols-4 h-full">
        {/* 3D Canvas takes 3 columns */}
        <div className="lg:col-span-3 h-full bg-slate-800">
          <Canvas camera={{ position: [5, 5, 5], fov: 75 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={0.8} />
            <Grid
              position={[0, -0.01, 0]}
              args={[20, 20]}
              cellSize={1}
              cellThickness={0.5}
              cellColor="#6b7280"
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#374151"
            />
            <mesh position={[0, 2, 0]}>
              <boxGeometry args={[2, 2, 2]} />
              <meshStandardMaterial color="#10b981" />
            </mesh>
            <OrbitControls
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
            />
          </Canvas>
        </div>

        {/* Control Panel takes 1 column */}
        <div className="lg:col-span-1 p-4 bg-slate-700 text-white overflow-y-auto scrollbar-thin">
          <h3 className="text-lg font-bold mb-4 text-blue-400">3D BIM Editor</h3>

          {/* BIM Professional Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Object Type</label>
              <select className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2">
                <option>Wall</option>
                <option>Ceiling Panel</option>
                <option>Column</option>
                <option>Beam</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Dimensions</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input type="number" placeholder="X" className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm" />
                </div>
                <div>
                  <input type="number" placeholder="Y" className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm" />
                </div>
                <div>
                  <input type="number" placeholder="Z" className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Material</label>
              <select className="w-full bg-slate-600 border border-slate-500 rounded px-3 py-2">
                <option>Concrete</option>
                <option>Steel</option>
                <option>Glass</option>
                <option>Wood</option>
              </select>
            </div>

            <button className="w-full btn btn-primary">
              Add Object
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Arch3DEditor;
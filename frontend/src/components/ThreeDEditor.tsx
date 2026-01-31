import React from 'react';
import { AddShapeButton } from '../components/ui/AddShapeButton';
import { CameraResetButton } from '../components/ui/CameraResetButton';
import { ThreeDCanvas } from '../components/ThreeDCanvas';

export const ThreeDEditor: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <AddShapeButton />
        <CameraResetButton />
      </div>
      <ThreeDCanvas />
    </div>
  );
};

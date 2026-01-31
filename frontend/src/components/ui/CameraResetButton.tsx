import React from 'react';
import Button from '@mui/material/Button';
import { use3DStore } from '../../stores/use3DStore';

export const CameraResetButton: React.FC = () => {
  const resetCamera = use3DStore(state => state.resetCamera);

  return (
    <Button variant="outlined" onClick={resetCamera}>
      Reset Camera
    </Button>
  );
};

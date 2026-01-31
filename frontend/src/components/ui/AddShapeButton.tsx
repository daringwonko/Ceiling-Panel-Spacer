import React from 'react';
import Button from '@mui/material/Button';
import { use3DStore } from '../../stores/use3DStore';

export const AddShapeButton: React.FC = () => {
  const addGeometry = use3DStore(state => state.addGeometry);

  return (
    <Button variant="contained" color="primary" onClick={() => addGeometry('cube')}>
      Add Shape
    </Button>
  );
};

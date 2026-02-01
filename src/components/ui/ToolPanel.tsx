import React, { useState, useCallback } from 'react';
import { Button } from './Button';

export type ToolAction = 
  | { type: 'add_cube' }
  | { type: 'add_sphere' }
  | { type: 'rotate' }
  | { type: 'delete' }
  | { type: 'select'; id: string };

interface ToolPanelProps {
  onAction: (action: ToolAction) => void;
  className?: string;
}

// Custom hook for managing tool state
export const useToolState = () => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);

  const selectTool = useCallback((tool: string) => {
    setActiveTool((prev) => (prev === tool ? null : tool));
  }, []);

  const selectObject = useCallback((id: string | null) => {
    setSelectedObject(id);
  }, []);

  return {
    activeTool,
    selectedObject,
    selectTool,
    selectObject,
  };
};

export const ToolPanel: React.FC<ToolPanelProps> = ({ onAction, className = '' }) => {
  const { activeTool, selectTool } = useToolState();

  const handleAddCube = () => {
    onAction({ type: 'add_cube' });
  };

  const handleAddSphere = () => {
    onAction({ type: 'add_sphere' });
  };

  const handleRotate = () => {
    if (activeTool === 'rotate') {
      selectTool(null);
    } else {
      selectTool('rotate');
      onAction({ type: 'rotate' });
    }
  };

  const handleDelete = () => {
    onAction({ type: 'delete' });
  };

  return (
    <div className={`bg-gray-100 p-4 rounded-lg shadow-md ${className}`}>
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Tools</h3>
      
      <div className="space-y-3">
        <Button
          onClick={handleAddCube}
          variant="primary"
          size="medium"
          className="w-full"
        >
          🧊 Add Cube
        </Button>
        
        <Button
          onClick={handleAddSphere}
          variant="secondary"
          size="medium"
          className="w-full"
        >
          ⚪ Add Sphere
        </Button>
        
        <Button
          onClick={handleRotate}
          variant={activeTool === 'rotate' ? 'success' : 'secondary'}
          size="medium"
          className="w-full"
        >
          🔄 Rotate Mode
        </Button>
        
        <Button
          onClick={handleDelete}
          variant="danger"
          size="medium"
          className="w-full"
        >
          🗑️ Delete
        </Button>
      </div>
    </div>
  );
};

export default ToolPanel;

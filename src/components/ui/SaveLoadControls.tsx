// src/components/ui/SaveLoadControls.tsx
import React, { useState } from 'react';
import { use3DState } from '../../hooks/use3DState';

interface SaveLoadControlsProps {
  className?: string;
}

export const SaveLoadControls: React.FC<SaveLoadControlsProps> = ({ className = '' }) => {
  const { saveProject, loadProject, projectName, setProjectName } = use3DState();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState(projectName);

  const handleSave = () => {
    setProjectName(newProjectName);
    saveProject();
    setShowSaveDialog(false);
  };

  const handleLoad = () => {
    loadProject();
    setShowLoadDialog(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Save Button */}
      <button
        onClick={() => setShowSaveDialog(true)}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
      >
        💾 Save Project
      </button>

      {/* Load Button */}
      <button
        onClick={() => setShowLoadDialog(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        📁 Load Project
      </button>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg">
            <h3 className="text-lg font-bold mb-4">Save Project</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Project name"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg">
            <h3 className="text-lg font-bold mb-4">Load Project</h3>
            <p className="mb-4">Load the previously saved project?</p>
            <div className="flex space-x-2">
              <button
                onClick={handleLoad}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Load
              </button>
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
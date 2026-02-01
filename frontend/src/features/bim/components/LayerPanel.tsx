/**
 * LayerPanel Component
 * 
 * Main panel for layer management with tree view, visibility/lock controls,
 * and layer editing capabilities.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useLayers } from '../hooks/useLayers';
import { LayerTree } from './LayerTree';
import { Layer } from '../models/Layer';

interface LayerPanelProps {
  /** Object counts per layer (for badges) */
  objectCounts?: Map<string, number>;
  /** Additional className */
  className?: string;
}

export const LayerPanel: React.FC<LayerPanelProps> = ({
  objectCounts = new Map(),
  className = ''
}) => {
  const {
    layers,
    layerTree,
    activeLayer,
    activeLayerId,
    rootLayers,
    visibleLayers,
    lockedLayers,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    createLayer,
    createChildLayer,
    updateLayer,
    renameLayer,
    deleteLayer,
    duplicateLayer,
    toggleVisibility,
    toggleLock,
    setActiveLayer,
    showAllLayers,
    isolateLayer,
    lockAllLayers,
    unlockAllLayers,
    clearError,
    stats
  } = useLayers();

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');
  const [isAddingChild, setIsAddingChild] = useState(false);

  const selectedLayer = useMemo(() => 
    layers.find(l => l.id === selectedLayerId),
    [layers, selectedLayerId]
  );

  const handleSelect = useCallback((layerId: string) => {
    setSelectedLayerId(layerId);
  }, []);

  const handleToggleExpand = useCallback((layerId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(layerId)) {
        newSet.delete(layerId);
      } else {
        newSet.add(layerId);
      }
      return newSet;
    });
  }, []);

  const handleAddLayer = useCallback(() => {
    setIsAddingChild(false);
    setNewLayerName('');
    setShowAddDialog(true);
  }, []);

  const handleAddChildLayer = useCallback(() => {
    if (selectedLayerId) {
      setIsAddingChild(true);
      setNewLayerName('');
      setShowAddDialog(true);
    }
  }, [selectedLayerId]);

  const handleAddSubmit = useCallback(() => {
    if (newLayerName.trim()) {
      try {
        if (isAddingChild && selectedLayerId) {
          createChildLayer(selectedLayerId, newLayerName.trim());
        } else {
          createLayer(newLayerName.trim());
        }
        setShowAddDialog(false);
        setNewLayerName('');
      } catch (err) {
        // Error handled by hook
      }
    }
  }, [newLayerName, isAddingChild, selectedLayerId, createLayer, createChildLayer]);

  const handleAddKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSubmit();
    } else if (e.key === 'Escape') {
      setShowAddDialog(false);
      setNewLayerName('');
    }
  }, [handleAddSubmit]);

  const handleSetActive = useCallback(() => {
    if (selectedLayerId) {
      try {
        setActiveLayer(selectedLayerId);
      } catch (err) {
        // Error handled by hook
      }
    }
  }, [selectedLayerId, setActiveLayer]);

  const handleDelete = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    const objectCount = objectCounts.get(layerId) || 0;
    const confirmMessage = objectCount > 0
      ? `"${layer.name}" contains ${objectCount} object(s). Delete anyway?`
      : `Delete "${layer.name}"?`;

    if (confirm(confirmMessage)) {
      try {
        deleteLayer(layerId, true);
        if (selectedLayerId === layerId) {
          setSelectedLayerId(null);
        }
      } catch (err) {
        // Error handled by hook
      }
    }
  }, [layers, objectCounts, selectedLayerId, deleteLayer]);

  if (loading) {
    return (
      <div className={`layer-panel ${className}`} style={{ padding: '16px' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>Loading layers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`layer-panel ${className}`} style={{ padding: '16px' }}>
        <div style={{ 
          color: '#dc2626', 
          padding: '12px', 
          backgroundColor: '#fef2f2', 
          borderRadius: '4px',
          marginBottom: '12px'
        }}>
          Error: {error}
        </div>
        <button onClick={clearError} style={{ padding: '6px 12px' }}>
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className={`layer-panel ${className}`} style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '12px' 
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Layers</h3>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {stats.visible} visible, {stats.locked} locked
          </span>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Search layers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '13px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={showAllLayers}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            Show All
          </button>
          <button
            onClick={() => selectedLayerId && isolateLayer(selectedLayerId)}
            disabled={!selectedLayerId}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: selectedLayerId ? 'white' : '#f3f4f6',
              cursor: selectedLayerId ? 'pointer' : 'not-allowed',
              opacity: selectedLayerId ? 1 : 0.5
            }}
          >
            Isolate
          </button>
          <button
            onClick={unlockAllLayers}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            Unlock All
          </button>
          <button
            onClick={lockAllLayers}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            Lock All
          </button>
        </div>
      </div>

      {/* Layer Tree */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {layers.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '32px', 
            color: '#6b7280' 
          }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>No layers found</div>
            <div style={{ fontSize: '12px' }}>Create a layer to get started</div>
          </div>
        ) : (
          <LayerTree
            nodes={layerTree}
            selectedLayerId={selectedLayerId}
            expandedIds={expandedIds}
            objectCounts={objectCounts}
            onSelect={handleSelect}
            onToggleVisibility={toggleVisibility}
            onToggleLock={toggleLock}
            onToggleExpand={handleToggleExpand}
            onRename={renameLayer}
            onDelete={handleDelete}
            onAddChild={handleAddChildLayer}
          />
        )}
      </div>

      {/* Selected Layer Properties */}
      {selectedLayer && (
        <div style={{ 
          padding: '12px 16px', 
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#374151' }}>
            Layer Properties
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Name:</span>
              <span style={{ fontSize: '12px', fontWeight: 500 }}>{selectedLayer.name}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Color:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: selectedLayer.color,
                    borderRadius: '3px',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }}
                />
                <span style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                  {selectedLayer.color}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Status:</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                {!selectedLayer.visible && (
                  <span style={{ fontSize: '10px', color: '#dc2626' }}>Hidden</span>
                )}
                {selectedLayer.locked && (
                  <span style={{ fontSize: '10px', color: '#dc2626' }}>Locked</span>
                )}
                {activeLayerId === selectedLayer.id && (
                  <span style={{ fontSize: '10px', color: '#16a34a' }}>Active</span>
                )}
                {selectedLayer.isDefault && (
                  <span style={{ fontSize: '10px', color: '#3b82f6' }}>Default</span>
                )}
              </div>
            </div>

            {activeLayerId !== selectedLayer.id && !selectedLayer.locked && (
              <button
                onClick={handleSetActive}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  border: '1px solid #3b82f6',
                  borderRadius: '4px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                Set as Active Layer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        padding: '12px 16px', 
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '8px',
        backgroundColor: '#f9fafb'
      }}>
        <button
          onClick={handleAddLayer}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #3b82f6',
            borderRadius: '4px',
            backgroundColor: '#3b82f6',
            color: 'white',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500
          }}
        >
          + Add Layer
        </button>
        <button
          onClick={handleAddChildLayer}
          disabled={!selectedLayerId}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            backgroundColor: selectedLayerId ? 'white' : '#f3f4f6',
            color: selectedLayerId ? '#374151' : '#9ca3af',
            cursor: selectedLayerId ? 'pointer' : 'not-allowed',
            fontSize: '13px'
          }}
        >
          + Add Child
        </button>
      </div>

      {/* Add Layer Dialog */}
      {showAddDialog && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 1000
            }}
            onClick={() => setShowAddDialog(false)}
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              zIndex: 1001,
              minWidth: '300px'
            }}
          >
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>
              {isAddingChild ? 'Add Child Layer' : 'Add New Layer'}
            </h4>
            <input
              type="text"
              placeholder="Layer name"
              value={newLayerName}
              onChange={e => setNewLayerName(e.target.value)}
              onKeyDown={handleAddKeyDown}
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: '16px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddDialog(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubmit}
                disabled={!newLayerName.trim()}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #3b82f6',
                  borderRadius: '4px',
                  backgroundColor: newLayerName.trim() ? '#3b82f6' : '#93c5fd',
                  color: 'white',
                  cursor: newLayerName.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Add Layer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LayerPanel;

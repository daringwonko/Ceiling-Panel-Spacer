import React, { useState, useCallback } from 'react';
import { Material, MaterialCategory } from '../models/Material';
import { useMaterials } from '../hooks/useMaterials';
import { MaterialPreview } from './MaterialPreview';
import { MaterialPropertyEditor } from './MaterialPropertyEditor';
import { getMaterialLibrary } from '../services/MaterialLibrary';

interface MaterialPanelProps {
  /** Called when a material is selected for assignment */
  onMaterialSelect?: (material: Material) => void;
  /** Currently assigned material ID */
  assignedMaterialId?: string | null;
  /** Additional className */
  className?: string;
}

/**
 * MaterialPanel Component
 * Main panel for material selection and management
 */
export const MaterialPanel: React.FC<MaterialPanelProps> = ({
  onMaterialSelect,
  assignedMaterialId,
  className = ''
}) => {
  const {
    materials,
    selectedMaterial,
    loading,
    error,
    filterCategory,
    searchQuery,
    setFilterCategory,
    setSearchQuery,
    selectMaterial,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    duplicateMaterial,
    stats
  } = useMaterials();

  const [isEditing, setIsEditing] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    material: Material;
  } | null>(null);

  const categories = Object.values(MaterialCategory);

  const handleMaterialClick = useCallback(
    (material: Material) => {
      selectMaterial(material.id);
      onMaterialSelect?.(material);
    },
    [selectMaterial, onMaterialSelect]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, material: Material) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, material });
    },
    []
  );

  const handleEdit = useCallback(() => {
    if (contextMenu?.material) {
      selectMaterial(contextMenu.material.id);
      setIsEditing(true);
      setShowEditor(true);
      setContextMenu(null);
    }
  }, [contextMenu, selectMaterial]);

  const handleDuplicate = useCallback(() => {
    if (contextMenu?.material) {
      duplicateMaterial(contextMenu.material.id);
      setContextMenu(null);
    }
  }, [contextMenu, duplicateMaterial]);

  const handleDelete = useCallback(() => {
    if (contextMenu?.material && !contextMenu.material.isPredefined) {
      if (confirm(`Delete "${contextMenu.material.name}"?`)) {
        deleteMaterial(contextMenu.material.id);
      }
      setContextMenu(null);
    }
  }, [contextMenu, deleteMaterial]);

  const handleEditorSave = useCallback(
    (material: Material) => {
      if (isEditing) {
        const library = getMaterialLibrary();
        library.updateMaterial(material.id, {
          name: material.name,
          category: material.category,
          properties: material.properties,
          description: material.description
        });
      } else {
        createMaterial({
          name: material.name,
          category: material.category,
          properties: material.properties,
          description: material.description
        });
      }
      setShowEditor(false);
      setIsEditing(false);
    },
    [isEditing, createMaterial]
  );

  const handleEditorCancel = useCallback(() => {
    setShowEditor(false);
    setIsEditing(false);
  }, []);

  const handleAddMaterial = useCallback(() => {
    setIsEditing(false);
    setShowEditor(true);
  }, []);

  if (loading) {
    return (
      <div className={`material-panel ${className}`} style={{ padding: '16px' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>Loading materials...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`material-panel ${className}`} style={{ padding: '16px' }}>
        <div style={{ color: '#dc2626', padding: '12px', backgroundColor: '#fef2f2', borderRadius: '4px' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  if (showEditor) {
    return (
      <div className={`material-panel ${className}`}>
        <MaterialPropertyEditor
          material={isEditing ? selectedMaterial : null}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      </div>
    );
  }

  return (
    <div className={`material-panel ${className}`} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Materials</h3>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {stats.custom} custom
          </span>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '13px'
            }}
          />
        </div>

        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterCategory(null)}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: filterCategory === null ? '#3b82f6' : 'white',
              color: filterCategory === null ? 'white' : '#374151',
              cursor: 'pointer'
            }}
          >
            All
          </button>
          {categories.map(cat => {
            const count = stats.byCategory[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  backgroundColor: filterCategory === cat ? '#3b82f6' : 'white',
                  color: filterCategory === cat ? 'white' : '#374151',
                  cursor: 'pointer',
                  opacity: count === 0 ? 0.5 : 1
                }}
                disabled={count === 0}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Material Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {materials.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
            <div style={{ fontSize: '14px', marginBottom: '8px' }}>No materials found</div>
            <div style={{ fontSize: '12px' }}>Try adjusting your search or filters</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
            {materials.map(material => {
              const isSelected = selectedMaterial?.id === material.id;
              const isAssigned = assignedMaterialId === material.id;

              return (
                <div
                  key={material.id}
                  onClick={() => handleMaterialClick(material)}
                  onContextMenu={e => handleContextMenu(e, material)}
                  style={{
                    padding: '8px',
                    border: `2px solid ${isSelected ? '#3b82f6' : isAssigned ? '#10b981' : 'transparent'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#eff6ff' : isAssigned ? '#ecfdf5' : '#f9fafb',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  {/* Preview */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: '6px',
                      backgroundColor: material.properties.color,
                      opacity: material.properties.opacity,
                      marginBottom: '6px',
                      boxShadow: `
                        inset 0 0 10px rgba(0,0,0,${material.properties.roughness * 0.3}),
                        ${material.properties.metalness > 0.5 ? '0 0 5px rgba(255,255,255,0.3)' : 'none'}
                      `,
                      border: `1px solid ${material.properties.metalness > 0.5 ? '#silver' : '#e5e7eb'}`
                    }}
                  />

                  {/* Name */}
                  <div
                    style={{
                      fontSize: '10px',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: '#374151'
                    }}
                    title={material.name}
                  >
                    {material.name}
                  </div>

                  {/* Category Badge */}
                  <div
                    style={{
                      fontSize: '8px',
                      textAlign: 'center',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      marginTop: '2px'
                    }}
                  >
                    {material.category}
                  </div>

                  {/* Predefined Indicator */}
                  {material.isPredefined && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#3b82f6'
                      }}
                      title="Predefined material"
                    />
                  )}

                  {/* Assigned Indicator */}
                  {isAssigned && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '4px',
                        left: '4px',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981'
                      }}
                      title="Currently assigned"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
        <button
          onClick={handleAddMaterial}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #3b82f6',
            borderRadius: '4px',
            backgroundColor: '#3b82f6',
            color: 'white',
            cursor: 'pointer',
            fontSize: '13px'
          }}
        >
          + Add Material
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 50
            }}
            onClick={() => setContextMenu(null)}
          />
          <div
            style={{
              position: 'fixed',
              left: contextMenu.x,
              top: contextMenu.y,
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              zIndex: 51,
              minWidth: '120px'
            }}
          >
            <div
              onClick={handleEdit}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                borderBottom: '1px solid #f3f4f6',
                ':hover': { backgroundColor: '#f9fafb' }
              }}
            >
              Edit
            </div>
            <div
              onClick={handleDuplicate}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                borderBottom: '1px solid #f3f4f6'
              }}
            >
              Duplicate
            </div>
            {!contextMenu.material.isPredefined && (
              <div
                onClick={handleDelete}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#dc2626'
                }}
              >
                Delete
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MaterialPanel;

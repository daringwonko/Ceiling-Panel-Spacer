/**
 * LayerTree Component
 * 
 * Recursive tree component for displaying hierarchical layer structure.
 * Supports visibility toggle, lock toggle, and inline editing.
 */

import React, { useState, useCallback } from 'react';
import { Layer, LayerNode } from '../models/Layer';

interface LayerTreeProps {
  /** Layer nodes to render */
  nodes: LayerNode[];
  /** Currently selected layer ID */
  selectedLayerId?: string | null;
  /** Expanded layer IDs */
  expandedIds: Set<string>;
  /** Object counts per layer */
  objectCounts?: Map<string, number>;
  /** Callback when layer is selected */
  onSelect: (layerId: string) => void;
  /** Callback when visibility is toggled */
  onToggleVisibility: (layerId: string) => void;
  /** Callback when lock is toggled */
  onToggleLock: (layerId: string) => void;
  /** Callback when expand/collapse is toggled */
  onToggleExpand: (layerId: string) => void;
  /** Callback when layer is renamed */
  onRename: (layerId: string, newName: string) => void;
  /** Callback when delete is requested */
  onDelete: (layerId: string) => void;
  /** Callback when add child is requested */
  onAddChild?: (parentId: string) => void;
}

/**
 * Single layer row component
 */
const LayerRow: React.FC<{
  node: LayerNode;
  isSelected: boolean;
  isExpanded: boolean;
  objectCount: number;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onToggleExpand: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onAddChild?: () => void;
}> = ({
  node,
  isSelected,
  isExpanded,
  objectCount,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onToggleExpand,
  onRename,
  onDelete,
  onAddChild
}) => {
  const layer = node.layer;
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(layer.name);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });

  const hasChildren = node.children.length > 0;

  const handleDoubleClick = useCallback(() => {
    if (!layer.isDefault) {
      setIsEditing(true);
      setEditName(layer.name);
    }
  }, [layer.name, layer.isDefault]);

  const handleRenameSubmit = useCallback(() => {
    if (editName.trim() && editName !== layer.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  }, [editName, layer.name, onRename]);

  const handleRenameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setEditName(layer.name);
      setIsEditing(false);
    }
  }, [handleRenameSubmit, layer.name]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, []);

  // Close context menu on click outside
  React.useEffect(() => {
    if (showContextMenu) {
      const handleClick = () => setShowContextMenu(false);
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showContextMenu]);

  return (
    <>
      <div
        onClick={onSelect}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '6px 8px',
          paddingLeft: `${8 + node.depth * 20}px`,
          backgroundColor: isSelected ? '#dbeafe' : 'transparent',
          cursor: 'pointer',
          borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
          transition: 'background-color 0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = isSelected ? '#dbeafe' : '#f3f4f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = isSelected ? '#dbeafe' : 'transparent';
        }}
      >
        {/* Expand/Collapse Arrow */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          style={{
            width: '16px',
            height: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '4px',
            cursor: hasChildren ? 'pointer' : 'default',
            opacity: hasChildren ? 1 : 0,
            fontSize: '10px',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        >
          {hasChildren && '▶'}
        </div>

        {/* Visibility Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          style={{
            width: '20px',
            height: '20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: layer.visible ? '#374151' : '#9ca3af',
            padding: 0
          }}
          title={layer.visible ? 'Hide layer' : 'Show layer'}
        >
          {layer.visible ? '👁️' : '🚫'}
        </button>

        {/* Lock Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          style={{
            width: '20px',
            height: '20px',
            border: 'none',
            background: 'none',
            cursor: layer.isDefault ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: layer.locked ? '#dc2626' : '#9ca3af',
            padding: 0,
            opacity: layer.isDefault ? 0.3 : 1
          }}
          title={layer.locked ? 'Unlock layer' : 'Lock layer'}
          disabled={layer.isDefault}
        >
          {layer.locked ? '🔒' : '🔓'}
        </button>

        {/* Color Indicator */}
        <div
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: layer.color,
            borderRadius: '2px',
            marginRight: '8px',
            border: '1px solid rgba(0,0,0,0.1)'
          }}
        />

        {/* Layer Name */}
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            autoFocus
            style={{
              flex: 1,
              padding: '2px 4px',
              fontSize: '13px',
              border: '1px solid #3b82f6',
              borderRadius: '2px',
              outline: 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            style={{
              flex: 1,
              fontSize: '13px',
              color: layer.visible ? '#111827' : '#9ca3af',
              textDecoration: layer.visible ? 'none' : 'line-through',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontWeight: layer.isDefault ? 600 : 400
            }}
          >
            {layer.name}
          </span>
        )}

        {/* Object Count */}
        {objectCount > 0 && (
          <span
            style={{
              fontSize: '10px',
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
              padding: '2px 6px',
              borderRadius: '10px',
              marginLeft: '8px'
            }}
          >
            {objectCount}
          </span>
        )}

        {/* Default Indicator */}
        {layer.isDefault && (
          <span
            style={{
              fontSize: '9px',
              color: '#6b7280',
              marginLeft: '8px',
              fontStyle: 'italic'
            }}
          >
            default
          </span>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000
            }}
            onClick={() => setShowContextMenu(false)}
          />
          <div
            style={{
              position: 'fixed',
              left: contextMenuPos.x,
              top: contextMenuPos.y,
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              zIndex: 1001,
              minWidth: '140px',
              padding: '4px 0'
            }}
          >
            <div
              onClick={() => {
                setIsEditing(true);
                setEditName(layer.name);
                setShowContextMenu(false);
              }}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                cursor: 'pointer',
                ':hover': { backgroundColor: '#f3f4f6' }
              }}
            >
              Rename
            </div>
            {!layer.isDefault && (
              <div
                onClick={() => {
                  onDelete();
                  setShowContextMenu(false);
                }}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: '#dc2626',
                  ':hover': { backgroundColor: '#fef2f2' }
                }}
              >
                Delete
              </div>
            )}
            {onAddChild && (
              <>
                <div style={{ borderTop: '1px solid #e5e7eb', margin: '4px 0' }} />
                <div
                  onClick={() => {
                    onAddChild();
                    setShowContextMenu(false);
                  }}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    ':hover': { backgroundColor: '#f3f4f6' }
                  }}
                >
                  Add Child Layer
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
};

export const LayerTree: React.FC<LayerTreeProps> = ({
  nodes,
  selectedLayerId,
  expandedIds,
  objectCounts = new Map(),
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onToggleExpand,
  onRename,
  onDelete,
  onAddChild
}) => {
  const renderNode = useCallback((node: LayerNode): React.ReactNode => {
    const isSelected = selectedLayerId === node.layer.id;
    const isExpanded = expandedIds.has(node.layer.id);
    const objectCount = objectCounts.get(node.layer.id) || 0;

    return (
      <React.Fragment key={node.layer.id}>
        <LayerRow
          node={node}
          isSelected={isSelected}
          isExpanded={isExpanded}
          objectCount={objectCount}
          onSelect={() => onSelect(node.layer.id)}
          onToggleVisibility={() => onToggleVisibility(node.layer.id)}
          onToggleLock={() => onToggleLock(node.layer.id)}
          onToggleExpand={() => onToggleExpand(node.layer.id)}
          onRename={(newName) => onRename(node.layer.id, newName)}
          onDelete={() => onDelete(node.layer.id)}
          onAddChild={onAddChild ? () => onAddChild(node.layer.id) : undefined}
        />
        {isExpanded && node.children.length > 0 && (
          <div>{node.children.map(child => renderNode(child))}</div>
        )}
      </React.Fragment>
    );
  }, [selectedLayerId, expandedIds, objectCounts, onSelect, onToggleVisibility, onToggleLock, onToggleExpand, onRename, onDelete, onAddChild]);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      {nodes.map(node => renderNode(node))}
    </div>
  );
};

export default LayerTree;

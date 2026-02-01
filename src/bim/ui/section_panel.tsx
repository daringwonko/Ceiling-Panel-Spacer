/**
 * Section Panel
 * 
 * React component for managing section planes with list view,
 * create/delete/flip/edit controls, and activation controls.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SectionPlaneClass } from '../section_plane';
import { SectionManager, getSectionManager } from './section_manager';
import { SectionType } from '../types';

/**
 * Section item props for list items
 */
interface SectionItemProps {
  section: SectionPlaneClass;
  isActive: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onActivate: () => void;
  onFlip: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Get type icon for section
 */
function getTypeIcon(type: SectionType): string {
  switch (type) {
    case SectionType.PLAN:
      return '⬇';
    case SectionType.ELEVATION:
      return '↔';
    case SectionType.SECTION:
      return '◢';
    default:
      return '▣';
  }
}

/**
 * Get type label for section
 */
function getTypeLabel(type: SectionType): string {
  switch (type) {
    case SectionType.PLAN:
      return 'Plan';
    case SectionType.ELEVATION:
      return 'Elevation';
    case SectionType.SECTION:
      return 'Section';
    default:
      return 'Unknown';
  }
}

/**
 * Single section list item component
 */
function SectionItem({
  section,
  isActive,
  isSelected,
  onSelect,
  onActivate,
  onFlip,
  onEdit,
  onDelete,
}: SectionItemProps): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);

  const handleNameSubmit = () => {
    if (editName.trim() && editName !== section.name) {
      const manager = getSectionManager();
      manager.renameSection(section.id, editName.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`section-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      onDoubleClick={() => {
        onActivate();
        setIsEditing(false);
      }}
    >
      {/* Active indicator */}
      <div className={`active-indicator ${isActive ? 'active' : ''}`} />
      
      {/* Checkbox for activation */}
      <input
        type="checkbox"
        checked={isActive}
        onChange={(e) => {
          e.stopPropagation();
          onActivate();
        }}
        className="section-checkbox"
        title="Activate/deactivate section"
      />
      
      {/* Type icon */}
      <span className="type-icon" title={getTypeLabel(section.type)}>
        {getTypeIcon(section.type)}
      </span>
      
      {/* Name (editable) */}
      <div className="section-name-container">
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNameSubmit();
              if (e.key === 'Escape') {
                setEditName(section.name);
                setIsEditing(false);
              }
            }}
            className="section-name-input"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="section-name"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Double-click to edit name"
          >
            {section.name}
          </span>
        )}
      </div>
      
      {/* Section type label */}
      <span className="section-type" title={`${getTypeLabel(section.type)} type`}>
        {section.type === SectionType.PLAN ? 'P' : section.type === SectionType.ELEVATION ? 'E' : 'S'}
      </span>
      
      {/* Actions */}
      <div className="section-actions">
        <button
          className="action-btn flip-btn"
          onClick={(e) => {
            e.stopPropagation();
            onFlip();
          }}
          title="Flip direction"
        >
          ↔
        </button>
        <button
          className="action-btn edit-btn"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title="Edit properties"
        >
          ✎
        </button>
        <button
          className="action-btn delete-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete section"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/**
 * Section panel props
 */
interface SectionPanelProps {
  manager?: SectionManager;
  className?: string;
}

/**
 * Main SectionPanel component
 */
export function SectionPanel({ manager: propManager, className = '' }: SectionPanelProps): React.JSX.Element {
  const [manager] = useState<SectionManager>(propManager || getSectionManager());
  const [sections, setSections] = useState<SectionPlaneClass[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createType, setCreateType] = useState<SectionType>(SectionType.SECTION);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'created'>('name');

  // Initialize and subscribe to section manager
  useEffect(() => {
    // Get initial state
    setSections(manager.getAllSections());
    const active = manager.getActiveSection();
    setActiveId(active?.id || null);

    // Subscribe to changes
    const unsubscribeList = manager.onListChange((newSections) => {
      setSections(newSections);
    });

    const unsubscribeChange = manager.onSectionChange((event) => {
      if (event.type === 'activated') {
        setActiveId(event.section.id);
      } else if (event.type === 'deactivated') {
        setActiveId(null);
      }
    });

    return () => {
      unsubscribeList();
      unsubscribeChange();
    };
  }, [manager]);

  // Filter and sort sections
  const filteredSections = React.useMemo(() => {
    let result = [...sections];

    // Apply filter
    if (filter.trim()) {
      const lowerFilter = filter.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerFilter) ||
          s.type.toLowerCase().includes(lowerFilter)
      );
    }

    // Apply sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'created':
          return a.id.localeCompare(b.id);
        default:
          return 0;
      }
    });

    return result;
  }, [sections, filter, sortBy]);

  // Handlers
  const handleCreate = useCallback(() => {
    setIsCreating(true);
    // The actual creation should be triggered from the 3D view using SectionPlaneTool
    // This just sets up the UI state for creation mode
  }, []);

  const handleDelete = useCallback(
    (section: SectionPlaneClass) => {
      if (confirm(`Delete section "${section.name}"?`)) {
        manager.deleteSection(section.id);
        if (selectedId === section.id) {
          setSelectedId(null);
        }
      }
    },
    [manager, selectedId]
  );

  const handleFlip = useCallback(
    (section: SectionPlaneClass) => {
      manager.flipSectionDirection(section.id);
    },
    [manager]
  );

  const handleEdit = useCallback(
    (section: SectionPlaneClass) => {
      // Open property dialog or switch to edit mode
      // For now, just select and show properties
      setSelectedId(section.id);
    },
    [manager]
  );

  const handleActivate = useCallback(
    (section: SectionPlaneClass) => {
      manager.activateSection(section.id);
    },
    [manager]
  );

  const handleSelect = useCallback((sectionId: string) => {
    setSelectedId(sectionId);
  }, []);

  const handleCancelCreate = useCallback(() => {
    setIsCreating(false);
  }, []);

  // Get selected section for property display
  const selectedSection = selectedId
    ? sections.find((s) => s.id === selectedId)
    : null;

  return (
    <div className={`section-panel ${className}`}>
      {/* Header */}
      <div className="section-panel-header">
        <h3>Section Planes</h3>
        <span className="section-count">{sections.length}</span>
      </div>

      {/* Create controls */}
      <div className="create-controls">
        {isCreating ? (
          <>
            <select
              value={createType}
              onChange={(e) => setCreateType(e.target.value as SectionType)}
              className="type-select"
            >
              <option value={SectionType.SECTION}>Section</option>
              <option value={SectionType.PLAN}>Plan</option>
              <option value={SectionType.ELEVATION}>Elevation</option>
            </select>
            <button className="create-btn active" onClick={handleCancelCreate}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button className="create-btn" onClick={handleCreate}>
              + Create
            </button>
            {activeId && (
              <button
                className="deactivate-btn"
                onClick={() => manager.deactivateSection()}
                title="Deactivate current section"
              >
                Deactivate
              </button>
            )}
          </>
        )}
      </div>

      {/* Filter and sort */}
      <div className="filter-sort">
        <input
          type="text"
          placeholder="Filter sections..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-input"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'type' | 'created')}
          className="sort-select"
        >
          <option value="name">Sort by Name</option>
          <option value="type">Sort by Type</option>
          <option value="created">Sort by Created</option>
        </select>
      </div>

      {/* Section list */}
      <div className="section-list">
        {filteredSections.length === 0 ? (
          <div className="empty-state">
            {sections.length === 0 ? (
              <>
                <p>No sections created</p>
                <p className="hint">Click "Create" to add a section plane</p>
              </>
            ) : (
              <p>No matching sections</p>
            )}
          </div>
        ) : (
          filteredSections.map((section) => (
            <SectionItem
              key={section.id}
              section={section}
              isActive={activeId === section.id}
              isSelected={selectedId === section.id}
              onSelect={() => handleSelect(section.id)}
              onActivate={() => handleActivate(section)}
              onFlip={() => handleFlip(section)}
              onEdit={() => handleEdit(section)}
              onDelete={() => handleDelete(section)}
            />
          ))
        )}
      </div>

      {/* Selected section properties */}
      {selectedSection && (
        <div className="section-properties">
          <h4>Properties</h4>
          <div className="property-grid">
            <div className="property-row">
              <span className="property-label">Name:</span>
              <span className="property-value">{selectedSection.name}</span>
            </div>
            <div className="property-row">
              <span className="property-label">Type:</span>
              <span className="property-value">{getTypeLabel(selectedSection.type)}</span>
            </div>
            <div className="property-row">
              <span className="property-label">Width:</span>
              <span className="property-value">{selectedSection.width.toFixed(0)} mm</span>
            </div>
            <div className="property-row">
              <span className="property-label">Height:</span>
              <span className="property-value">{selectedSection.height.toFixed(0)} mm</span>
            </div>
            <div className="property-row">
              <span className="property-label">Position:</span>
              <span className="property-value">
                ({selectedSection.position.x.toFixed(0)}, {selectedSection.position.y.toFixed(0)},{' '}
                {selectedSection.position.z.toFixed(0)})
              </span>
            </div>
            <div className="property-row">
              <span className="property-label">Normal:</span>
              <span className="property-value">
                ({selectedSection.normal.x.toFixed(2)}, {selectedSection.normal.y.toFixed(2)},{' '}
                {selectedSection.normal.z.toFixed(2)})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts help */}
      <div className="section-help">
        <h4>Keyboard Shortcuts</h4>
        <div className="shortcut-list">
          <div className="shortcut-item">
            <kbd>Enter</kbd>
            <span>Complete creation</span>
          </div>
          <div className="shortcut-item">
            <kbd>Esc</kbd>
            <span>Cancel creation</span>
          </div>
          <div className="shortcut-item">
            <kbd>F</kbd>
            <span>Flip direction</span>
          </div>
          <div className="shortcut-item">
            <kbd>S/P/E</kbd>
            <span>Switch type</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * SectionPanel with styles for styled-components or CSS modules
 * The following styles should be added to your CSS:
 */
export const sectionPanelStyles = `
.section-panel {
  display: flex;
  flex-direction: column;
  width: 280px;
  height: 100%;
  background: #1e1e1e;
  border-left: 1px solid #333;
  color: #e0e0e0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.section-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #333;
}

.section-panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.section-count {
  background: #333;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.create-controls {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #333;
}

.create-btn,
.deactivate-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.create-btn {
  background: #2196f3;
  color: white;
}

.create-btn:hover {
  background: #1976d2;
}

.create-btn.active {
  background: #f44336;
}

.deactivate-btn {
  background: #ff9800;
  color: white;
}

.deactivate-btn:hover {
  background: #f57c00;
}

.type-select {
  flex: 1;
  padding: 8px;
  background: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #e0e0e0;
}

.filter-sort {
  display: flex;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid #333;
}

.filter-input,
.sort-select {
  flex: 1;
  padding: 6px 8px;
  background: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 12px;
}

.section-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  text-align: center;
  padding: 24px;
  color: #888;
}

.empty-state .hint {
  font-size: 12px;
  margin-top: 8px;
}

.section-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.section-item:hover {
  background: #2a2a2a;
}

.section-item.selected {
  background: #2d3a4a;
}

.section-item.active {
  background: #1e3a2a;
}

.active-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #444;
  flex-shrink: 0;
}

.active-indicator.active {
  background: #4caf50;
}

.section-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #4caf50;
}

.type-icon {
  font-size: 16px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
}

.section-name-container {
  flex: 1;
  min-width: 0;
}

.section-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.section-name-input {
  width: 100%;
  padding: 2px 4px;
  background: #1e1e1e;
  border: 1px solid #2196f3;
  border-radius: 2px;
  color: #e0e0e0;
  font-size: 13px;
}

.section-type {
  font-size: 10px;
  padding: 2px 6px;
  background: #333;
  border-radius: 3px;
  color: #aaa;
  flex-shrink: 0;
}

.section-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.section-item:hover .section-actions {
  opacity: 1;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #333;
  color: #ccc;
  transition: all 0.15s;
}

.action-btn:hover {
  background: #444;
}

.flip-btn:hover {
  background: #2196f3;
  color: white;
}

.edit-btn:hover {
  background: #ff9800;
  color: white;
}

.delete-btn:hover {
  background: #f44336;
  color: white;
}

.section-properties {
  border-top: 1px solid #333;
  padding: 12px 16px;
}

.section-properties h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.property-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.property-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.property-label {
  color: #888;
}

.property-value {
  color: #e0e0e0;
  font-family: monospace;
}

.section-help {
  border-top: 1px solid #333;
  padding: 12px 16px;
  font-size: 12px;
}

.section-help h4 {
  margin: 0 0 8px 0;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
}

.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shortcut-item kbd {
  background: #333;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 11px;
  min-width: 60px;
  text-align: center;
}

.shortcut-item span {
  color: #888;
}
`;

/**
 * Default export
 */
export default SectionPanel;

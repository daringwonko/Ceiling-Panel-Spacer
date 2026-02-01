/**
 * Camera Controls Component
 * 
 * Provides camera/view mode controls for the BIM workbench.
 * Supports preset views, smooth transitions, and saved views.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ViewMode,
  ViewPreset,
  getViewPreset,
  getAllViewPresets,
  getViewPresetCategories,
  SavedView,
  getSavedViews,
  saveView,
  deleteView,
  cloneCameraState,
  interpolateCameraState,
  getEasingFunction,
  CameraState
} from '../../utils/cameraModes';
import styles from './CameraControls.module.css';

interface CameraControlsProps {
  // Camera state
  cameraState: CameraState;
  onCameraChange: (state: CameraState) => void;
  onViewModeChange: (mode: ViewMode) => void;
  currentViewMode: ViewMode;
  
  // Canvas references
  renderer?: THREE.WebGLRenderer;
  scene?: THREE.Scene;
  camera?: THREE.Camera;
  controls?: any;
  
  // Callbacks
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
  
  // Options
  enableSmoothTransition?: boolean;
  enableSavedViews?: boolean;
  enableViewRotation?: boolean;
}

// =============================================================================
// View Mode Selector
// =============================================================================

function ViewModeSelector({
  currentMode,
  onModeChange
}: {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('3D Views');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const categories = getViewPresetCategories();
  const currentPreset = getViewPreset(currentMode);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className={styles.viewModeSelector} ref={dropdownRef}>
      <button
        className={styles.selectorButton}
        onClick={() => setIsExpanded(!isExpanded)}
        title={currentPreset?.description || 'Select View Mode'}
      >
        <span className={styles.viewIcon}>
          {currentPreset?.icon ? (
            <span className={`icon-${currentPreset.icon}`}>{getViewIcon(currentPreset.id)}</span>
          ) : (
            '📷'
          )}
        </span>
        <span className={styles.viewName}>{currentPreset?.name || currentMode}</span>
        <span className={`${styles.chevron} ${isExpanded ? styles.expanded : ''}`}>▼</span>
      </button>
      
      {isExpanded && (
        <div className={styles.dropdown}>
          <div className={styles.categoryTabs}>
            {categories.map(category => (
              <button
                key={category.name}
                className={`${styles.categoryTab} ${activeCategory === category.name ? styles.active : ''}`}
                onClick={() => setActiveCategory(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>
          
          <div className={styles.presetGrid}>
            {categories
              .find(c => c.name === activeCategory)
              ?.presets.map(preset => (
                <button
                  key={preset.id}
                  className={`${styles.presetButton} ${currentMode === preset.id ? styles.active : ''}`}
                  onClick={() => {
                    onModeChange(preset.id);
                    setIsExpanded(false);
                  }}
                  title={preset.description}
                >
                  <span className={styles.presetIcon}>{getViewIcon(preset.id)}</span>
                  <span className={styles.presetName}>{preset.name}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getViewIcon(mode: ViewMode): string {
  const icons: Record<ViewMode, string> = {
    perspective: '🏛️',
    orthographic: '📐',
    top: '⬆️',
    bottom: '⬇️',
    front: '👁️',
    back: '🔙',
    left: '⬅️',
    right: '➡️',
    iso: '◆',
    custom: '✏️'
  };
  
  return icons[mode] || '📷';
}

// =============================================================================
// Navigation Controls
// =============================================================================

function NavigationControls({
  onZoomIn,
  onZoomOut,
  onPan,
  onReset,
  canZoomIn,
  canZoomOut
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPan: () => void;
  onReset: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}) {
  return (
    <div className={styles.navControls}>
      <button
        className={styles.navButton}
        onClick={onZoomIn}
        disabled={!canZoomIn}
        title="Zoom In"
      >
        +
      </button>
      <button
        className={styles.navButton}
        onClick={onZoomOut}
        disabled={!canZoomOut}
        title="Zoom Out"
      >
        −
      </button>
      <button
        className={styles.navButton}
        onClick={onPan}
        title="Pan Mode"
      >
        ✋
      </button>
      <button
        className={styles.navButton}
        onClick={onReset}
        title="Reset View"
      >
        ↺
      </button>
    </div>
  );
}

// =============================================================================
// Saved Views Panel
// =============================================================================

function SavedViewsPanel({
  savedViews,
  currentViewMode,
  onLoadView,
  onSaveCurrentView,
  onDeleteView
}: {
  savedViews: SavedView[];
  currentViewMode: ViewMode;
  onLoadView: (view: SavedView) => void;
  onSaveCurrentView: () => void;
  onDeleteView: (viewId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewName, setViewName] = useState('');
  const [viewDescription, setViewDescription] = useState('');
  
  const handleSave = () => {
    if (viewName.trim()) {
      onSaveCurrentView(viewName.trim(), viewDescription.trim());
      setViewName('');
      setViewDescription('');
      setShowSaveDialog(false);
    }
  };
  
  return (
    <div className={styles.savedViewsPanel}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsExpanded(!isExpanded)}
        title="Saved Views"
      >
        <span>⭐</span>
        <span className={styles.badge}>{savedViews.length}</span>
      </button>
      
      {isExpanded && (
        <div className={styles.savedViewsDropdown}>
          <div className={styles.savedViewsHeader}>
            <h4>Saved Views</h4>
            <button
              className={styles.saveButton}
              onClick={() => setShowSaveDialog(true)}
            >
              + Save Current
            </button>
          </div>
          
          {savedViews.length === 0 ? (
            <p className={styles.emptyMessage}>No saved views yet</p>
          ) : (
            <ul className={styles.savedViewsList}>
              {savedViews.map(view => (
                <li key={view.id} className={styles.savedViewItem}>
                  <button
                    className={styles.viewItemButton}
                    onClick={() => onLoadView(view)}
                  >
                    <span className={styles.viewItemName}>{view.name}</span>
                    <span className={styles.viewItemDate}>
                      {formatDate(view.createdAt)}
                    </span>
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => onDeleteView(view.id)}
                    title="Delete View"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {showSaveDialog && (
        <div className={styles.saveDialog}>
          <h4>Save Current View</h4>
          <input
            type="text"
            placeholder="View Name"
            value={viewName}
            onChange={e => setViewName(e.target.value)}
            className={styles.input}
          />
          <textarea
            placeholder="Description (optional)"
            value={viewDescription}
            onChange={e => setViewDescription(e.target.value)}
            className={styles.textarea}
          />
          <div className={styles.dialogActions}>
            <button onClick={() => setShowSaveDialog(false)}>Cancel</button>
            <button onClick={handleSave} className={styles.primaryButton}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return 'Today';
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// =============================================================================
// Smooth Transition Controller
// =============================================================================

function useSmoothTransition(
  cameraState: CameraState,
  onCameraChange: (state: CameraState) => void,
  options: { duration: number; easing: string; onComplete?: () => void }
) {
  const animationRef = useRef<number | null>(null);
  const startStateRef = useRef<CameraState | null>(null);
  const targetStateRef = useRef<CameraState | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const animate = useCallback((timestamp: number) => {
    if (!startStateRef.current || !targetStateRef.current) {
      return;
    }
    
    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / options.duration, 1);
    const easedProgress = getEasingFunction(options.easing as any)(progress);
    
    const newState = interpolateCameraState(
      startStateRef.current,
      targetStateRef.current,
      easedProgress
    );
    
    onCameraChange(newState);
    
    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (options.onComplete) {
        options.onComplete();
      }
    }
  }, [options.duration, options.easing, options.onComplete, onCameraChange]);
  
  const transitionTo = useCallback((targetState: CameraState) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    startStateRef.current = cloneCameraState(cameraState);
    targetStateRef.current = targetState;
    startTimeRef.current = performance.now();
    
    animationRef.current = requestAnimationFrame(animate);
  }, [cameraState, animate]);
  
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  return { transitionTo };
}

// =============================================================================
// Main Component
// =============================================================================

export function CameraControls({
  cameraState,
  onCameraChange,
  onViewModeChange,
  currentViewMode,
  renderer,
  scene,
  camera,
  controls,
  onTransitionStart,
  onTransitionEnd,
  enableSmoothTransition = true,
  enableSavedViews = true,
  enableViewRotation = true
}: CameraControlsProps) {
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { transitionTo } = useSmoothTransition(
    cameraState,
    onCameraChange,
    {
      duration: 500,
      easing: 'easeInOut',
      onComplete: () => {
        setIsTransitioning(false);
        if (onTransitionEnd) onTransitionEnd();
      }
    }
  );
  
  // Load saved views on mount
  useEffect(() => {
    setSavedViews(getSavedViews());
  }, []);
  
  // Handle view mode change with smooth transition
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    const preset = getViewPreset(mode);
    if (!preset) return;
    
    onViewModeChange(mode);
    
    if (enableSmoothTransition && !isTransitioning) {
      setIsTransitioning(true);
      if (onTransitionStart) onTransitionStart();
      transitionTo(preset.cameraState);
    } else {
      onCameraChange(preset.cameraState);
    }
  }, [onViewModeChange, enableSmoothTransition, isTransitioning, onCameraChange, transitionTo, onTransitionStart]);
  
  // Navigation handlers
  const handleZoomIn = useCallback(() => {
    const zoomFactor = 1.2;
    onCameraChange({
      ...cameraState,
      zoom: cameraState.zoom * zoomFactor
    });
  }, [cameraState, onCameraChange]);
  
  const handleZoomOut = useCallback(() => {
    const zoomFactor = 1.2;
    onCameraChange({
      ...cameraState,
      zoom: Math.max(0.1, cameraState.zoom / zoomFactor)
    });
  }, [cameraState, onCameraChange]);
  
  const handleReset = useCallback(() => {
    const preset = getViewPreset(currentViewMode);
    if (preset) {
      handleViewModeChange(currentViewMode);
    }
  }, [currentViewMode, handleViewModeChange]);
  
  // Saved views handlers
  const handleSaveCurrentView = useCallback((name: string, description?: string) => {
    const preset = getViewPreset(currentViewMode);
    const view = saveView({
      name,
      description,
      cameraState,
      isOrthographic: preset?.isOrthographic ?? false
    });
    setSavedViews(prev => [...prev, view]);
  }, [currentViewMode, cameraState]);
  
  const handleLoadView = useCallback((view: SavedView) => {
    onCameraChange(view.cameraState);
    onViewModeChange(view.isOrthographic ? 'orthographic' : 'perspective');
  }, [onCameraChange, onViewModeChange]);
  
  const handleDeleteView = useCallback((viewId: string) => {
    if (deleteView(viewId)) {
      setSavedViews(prev => prev.filter(v => v.id !== viewId));
    }
  }, []);
  
  return (
    <div className={styles.container}>
      <ViewModeSelector
        currentMode={currentViewMode}
        onModeChange={handleViewModeChange}
      />
      
      <NavigationControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onPan={() => {}}
        onReset={handleReset}
        canZoomIn={true}
        canZoomOut={cameraState.zoom > 0.1}
      />
      
      {enableSavedViews && (
        <SavedViewsPanel
          savedViews={savedViews}
          currentViewMode={currentViewMode}
          onLoadView={handleLoadView}
          onSaveCurrentView={handleSaveCurrentView}
          onDeleteView={handleDeleteView}
        />
      )}
      
      {isTransitioning && (
        <div className={styles.transitionIndicator}>
          <span>Transitioning...</span>
        </div>
      )}
    </div>
  );
}

export default CameraControls;

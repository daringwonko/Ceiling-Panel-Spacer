/**
 * Render Progress Component
 * 
 * Displays rendering progress with status, percentage, and time estimates.
 * Supports various render operations: initial render, quality changes,
 * export rendering, and real-time updates.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

// CSS Module import
import styles from './RenderProgress.module.css';

export type RenderPhase = 
  | 'idle'
  | 'initializing'
  | 'building-geometry'
  | 'applying-materials'
  | 'calculating-lighting'
  | 'generating-shadows'
  | 'computing-ao'
  | 'applying-effects'
  | 'final-compositing'
  | 'encoding-output'
  | 'complete'
  | 'error';

export interface RenderProgressState {
  phase: RenderPhase;
  progress: number; // 0-100
  message: string;
  elapsedSeconds: number;
  estimatedRemainingSeconds: number;
  frameCount: number;
  totalFrames: number;
  fps: number;
  error?: string;
}

export interface RenderProgressProps {
  /** Current progress state */
  state: RenderProgressState;
  
  /** Show detailed breakdown */
  showDetails?: boolean;
  
  /** Show FPS counter */
  showFPS?: boolean;
  
  /** Show time estimates */
  showTime?: boolean;
  
  /** Allow cancellation */
  cancellable?: boolean;
  
  /** Callback when cancelled */
  onCancel?: () => void;
  
  /** Callback when retry after error */
  onRetry?: () => void;
  
  /** Custom class name */
  className?: string;
}

// Phase display configurations
const PHASE_CONFIG: Record<RenderPhase, { icon: string; label: string; description: string }> = {
  idle: { icon: '⏸️', label: 'Idle', description: 'Waiting to start' },
  initializing: { icon: '🔧', label: 'Initializing', description: 'Setting up render environment' },
  'building-geometry': { icon: '📐', label: 'Building Geometry', description: 'Processing 3D scene elements' },
  'applying-materials': { icon: '🎨', label: 'Applying Materials', description: 'Loading and applying material textures' },
  'calculating-lighting': { icon: '💡', label: 'Calculating Lighting', description: 'Computing light contributions' },
  'generating-shadows': { icon: '🌑', label: 'Generating Shadows', description: 'Rendering shadow maps' },
  'computing-ao': { icon: '🔲', label: 'Computing Ambient Occlusion', description: 'Calculating occlusion passes' },
  'applying-effects': { icon: '✨', label: 'Applying Effects', description: 'Processing post-processing effects' },
  'final-compositing': { icon: '🖼️', label: 'Final Compositing', description: 'Combining all render passes' },
  'encoding-output': { icon: '💾', label: 'Encoding Output', description: 'Writing final image/video' },
  complete: { icon: '✅', label: 'Complete', description: 'Render finished successfully' },
  error: { icon: '❌', label: 'Error', description: 'Render failed' },
};

/**
 * Format seconds into human-readable time
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Calculate estimated remaining time based on progress
 */
function calculateEstimatedRemaining(
  progress: number,
  elapsedSeconds: number
): number {
  if (progress <= 0) {
    return 0;
  }
  
  const totalEstimated = elapsedSeconds / (progress / 100);
  return totalEstimated - elapsedSeconds;
}

export const RenderProgress: React.FC<RenderProgressProps> = ({
  state,
  showDetails = true,
  showFPS = true,
  showTime = true,
  cancellable = false,
  onCancel,
  onRetry,
  className = '',
}) => {
  const { phase, progress, message, elapsedSeconds, fps, error, frameCount, totalFrames } = state;
  const phaseConfig = PHASE_CONFIG[phase];
  
  // Calculate estimated remaining time
  const estimatedRemaining = showTime
    ? calculateEstimatedRemaining(progress, elapsedSeconds)
    : 0;
  
  // Determine if we should show frame info
  const showFrames = totalFrames > 1;
  
  // Progress bar animation
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Update progress bar width
  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${Math.min(progress, 100)}%`;
    }
  }, [progress]);
  
  // Handle cancel
  const handleCancel = useCallback(() => {
    if (cancellable && onCancel) {
      onCancel();
    }
  }, [cancellable, onCancel]);
  
  // Handle retry
  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    }
  }, [onRetry]);
  
  // Don't render if idle (unless specifically requested)
  if (phase === 'idle') {
    return null;
  }
  
  // Render error state
  if (phase === 'error') {
    return (
      <div className={`${styles.container} ${styles.error} ${className}`}>
        <div className={styles.header}>
          <span className={styles.icon}>{phaseConfig.icon}</span>
          <span className={styles.title}>{phaseConfig.label}</span>
        </div>
        
        <div className={styles.errorContent}>
          <p className={styles.errorMessage}>{error || 'An unknown error occurred'}</p>
          
          {onRetry && (
            <button className={styles.retryButton} onClick={handleRetry}>
              🔄 Retry Render
            </button>
          )}
        </div>
      </div>
    );
  }
  
  // Render complete state
  if (phase === 'complete') {
    return (
      <div className={`${styles.container} ${styles.complete} ${className}`}>
        <div className={styles.header}>
          <span className={styles.icon}>{phaseConfig.icon}</span>
          <span className={styles.title}>{phaseConfig.label}</span>
        </div>
        
        <div className={styles.completeContent}>
          <p className={styles.completeMessage}>
            Render completed in {formatTime(elapsedSeconds)}
          </p>
          
          {showFPS && fps > 0 && (
            <p className={styles.fpsInfo}>
              Average FPS: {fps.toFixed(1)}
            </p>
          )}
        </div>
      </div>
    );
  }
  
  // Render progress state
  return (
    <div className={`${styles.container} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.icon}>{phaseConfig.icon}</span>
        <span className={styles.title}>{phaseConfig.label}</span>
      </div>
      
      {/* Progress bar */}
      <div className={styles.progressBarContainer}>
        <div
          ref={progressBarRef}
          className={styles.progressBar}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Progress percentage */}
      <div className={styles.progressInfo}>
        <span className={styles.progressPercent}>{Math.round(progress)}%</span>
        {showTime && (
          <span className={styles.timeInfo}>
            {formatTime(elapsedSeconds)} / {formatTime(elapsedSeconds + estimatedRemaining)} remaining
          </span>
        )}
      </div>
      
      {/* Current message */}
      <p className={styles.message}>{message || phaseConfig.description}</p>
      
      {/* Detailed breakdown */}
      {showDetails && (
        <div className={styles.details}>
          {/* Phase breakdown indicators */}
          <div className={styles.phaseIndicators}>
            {Object.entries(PHASE_CONFIG)
              .filter(([key]) => 
                !['idle', 'complete', 'error'].includes(key) &&
                key <= phase // Show completed and current phases
              )
              .map(([key, config]) => (
                <div
                  key={key}
                  className={`${styles.phaseIndicator} ${
                    key === phase ? styles.current : styles.completed
                  }`}
                  title={config.description}
                >
                  <span className={styles.phaseIcon}>{config.icon}</span>
                </div>
              ))}
          </div>
          
          {/* FPS and frame info */}
          {(showFPS || showFrames) && (
            <div className={styles.statsRow}>
              {showFPS && fps > 0 && (
                <span className={styles.stat}>
                  <span className={styles.statIcon}>🎬</span>
                  <span className={styles.statValue}>{fps.toFixed(1)} FPS</span>
                </span>
              )}
              
              {showFrames && (
                <span className={styles.stat}>
                  <span className={styles.statIcon}>🖼️</span>
                  <span className={styles.statValue}>
                    Frame {frameCount} of {totalFrames}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Cancel button */}
      {cancellable && (
        <button className={styles.cancelButton} onClick={handleCancel}>
          Cancel
        </button>
      )}
    </div>
  );
};

/**
 * Render Progress with animation effects
 */
export const AnimatedRenderProgress: React.FC<RenderProgressProps> = (props) => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (props.state.phase !== 'idle' && props.state.phase !== 'complete') {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }
  }, [props.state.phase]);
  
  return (
    <div className={`${styles.animated} ${isAnimating ? styles.animating : ''}`}>
      <RenderProgress {...props} />
    </div>
  );
};

/**
 * Compact render progress indicator
 */
export const CompactRenderProgress: React.FC<RenderProgressProps> = ({
  state,
  className = '',
}) => {
  const { phase, progress } = state;
  const phaseConfig = PHASE_CONFIG[phase];
  
  if (phase === 'idle') {
    return null;
  }
  
  return (
    <div className={`${styles.compactContainer} ${className}`}>
      <span className={styles.compactIcon}>{phaseConfig.icon}</span>
      <div className={styles.compactProgressBar}>
        <div
          className={styles.compactProgressFill}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className={styles.compactPercent}>{Math.round(progress)}%</span>
    </div>
  );
};

export default RenderProgress;

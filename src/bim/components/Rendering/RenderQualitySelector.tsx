/**
 * Render Quality Selector Component
 * 
 * UI component for selecting render quality level.
 * Provides a dropdown or segmented control for choosing
 * Low, Medium, High, or Ultra quality presets.
 */

import React, { useCallback, useMemo } from 'react';
import {
  RenderQualityLevel,
  getQualityPreset,
  getAvailableQualityLevels,
  estimateMemoryUsage,
  qualitySupportsFeature,
} from '../../utils/renderQuality';

// CSS Module import
import styles from './RenderQualitySelector.module.css';

interface RenderQualitySelectorProps {
  /** Current quality level */
  value: RenderQualityLevel;
  
  /** Callback when quality changes */
  onChange: (quality: RenderQualityLevel) => void;
  
  /** Show technical details */
  showDetails?: boolean;
  
  /** Show memory estimates */
  showMemory?: boolean;
  
  /** Disable the selector */
  disabled?: boolean;
  
  /** Compact mode (smaller UI) */
  compact?: boolean;
  
  /** Custom class name */
  className?: string;
}

interface QualityInfo {
  level: RenderQualityLevel;
  preset: ReturnType<typeof getQualityPreset>;
  memory: number;
  features: {
    ambientOcclusion: boolean;
    bloom: boolean;
    depthOfField: boolean;
    softShadows: boolean;
  };
}

export const RenderQualitySelector: React.FC<RenderQualitySelectorProps> = ({
  value,
  onChange,
  showDetails = true,
  showMemory = true,
  disabled = false,
  compact = false,
  className = '',
}) => {
  // Get quality info for all levels
  const qualityLevels = useMemo((): QualityInfo[] => {
    return getAvailableQualityLevels().map((level) => {
      const preset = getQualityPreset(level);
      return {
        level,
        preset,
        memory: estimateMemoryUsage(level),
        features: {
          ambientOcclusion: qualitySupportsFeature(level, 'ambientOcclusion'),
          bloom: qualitySupportsFeature(level, 'bloom'),
          depthOfField: qualitySupportsFeature(level, 'depthOfField'),
          softShadows: qualitySupportsFeature(level, 'softShadows'),
        },
      };
    });
  }, []);
  
  // Current quality info
  const currentInfo = useMemo(() => {
    return qualityLevels.find((q) => q.level === value) || qualityLevels[0];
  }, [qualityLevels, value]);
  
  // Handle quality change
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (!disabled) {
        onChange(event.target.value as RenderQualityLevel);
      }
    },
    [onChange, disabled]
  );
  
  // Quality level icons
  const getLevelIcon = (level: RenderQualityLevel): string => {
    switch (level) {
      case 'low':
        return '⚡';
      case 'medium':
        return '⚖️';
      case 'high':
        return '✨';
      case 'ultra':
        return '💎';
      default:
        return '⚙️';
    }
  };
  
  // Quality level colors
  const getLevelColor = (level: RenderQualityLevel): string => {
    switch (level) {
      case 'low':
        return '#4ade80';
      case 'medium':
        return '#60a5fa';
      case 'high':
        return '#a78bfa';
      case 'ultra':
        return '#f472b6';
      default:
        return '#9ca3af';
    }
  };
  
  // Render compact selector
  if (compact) {
    return (
      <div className={`${styles.compact} ${disabled ? styles.disabled : ''} ${className}`}>
        <select
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={styles.compactSelect}
        >
          {qualityLevels.map((info) => (
            <option key={info.level} value={info.level}>
              {getLevelIcon(info.level)} {info.preset.name}
            </option>
          ))}
        </select>
      </div>
    );
  }
  
  // Render full selector with details
  return (
    <div className={`${styles.container} ${className}`}>
      {/* Quality level buttons */}
      <div className={styles.buttonGroup}>
        {qualityLevels.map((info) => (
          <button
            key={info.level}
            className={`${styles.levelButton} ${
              value === info.level ? styles.active : ''
            }`}
            style={{
              '--level-color': getLevelColor(info.level),
            } as React.CSSProperties}
            onClick={() => !disabled && onChange(info.level)}
            disabled={disabled}
            title={info.preset.description}
          >
            <span className={styles.levelIcon}>{getLevelIcon(info.level)}</span>
            <span className={styles.levelName}>{info.preset.name}</span>
          </button>
        ))}
      </div>
      
      {/* Current quality details */}
      {showDetails && (
        <div className={styles.details}>
          <div className={styles.detailHeader}>
            <span
              className={styles.detailDot}
              style={{ backgroundColor: getLevelColor(value) }}
            />
            <span className={styles.detailTitle}>{currentInfo.preset.name} Quality</span>
            {showMemory && (
              <span className={styles.memoryEstimate}>
                ~{currentInfo.memory} MB
              </span>
            )}
          </div>
          
          <p className={styles.description}>{currentInfo.preset.description}</p>
          
          {/* Feature indicators */}
          <div className={styles.features}>
            <span className={styles.featuresLabel}>Features:</span>
            <div className={styles.featureList}>
              <span
                className={`${styles.featureBadge} ${
                  currentInfo.features.ambientOcclusion ? styles.enabled : styles.disabled
                }`}
              >
                AO
              </span>
              <span
                className={`${styles.featureBadge} ${
                  currentInfo.features.bloom ? styles.enabled : styles.disabled
                }`}
              >
                Bloom
              </span>
              <span
                className={`${styles.featureBadge} ${
                  currentInfo.features.depthOfField ? styles.enabled : styles.disabled
                }`}
              >
                DoF
              </span>
              <span
                className={`${styles.featureBadge} ${
                  currentInfo.features.softShadows ? styles.enabled : styles.disabled
                }`}
              >
                Shadows
              </span>
            </div>
          </div>
          
          {/* Performance target */}
          <div className={styles.performance}>
            <span className={styles.performanceLabel}>Target FPS:</span>
            <span className={styles.performanceValue}>
              {getQualityPreset(value).performance.targetFPS}
            </span>
          </div>
        </div>
      )}
      
      {/* Quality comparison tooltip */}
      {showDetails && (
        <div className={styles.comparison}>
          <button
            className={styles.comparisonButton}
            onClick={() => {
              // TODO: Open quality comparison modal
              console.log('Open quality comparison');
            }}
          >
            Compare Quality Levels
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Render Quality Selector with dropdown instead of buttons
 */
export const RenderQualityDropdown: React.FC<RenderQualitySelectorProps> = ({
  value,
  onChange,
  showMemory = true,
  disabled = false,
  className = '',
}) => {
  const qualityLevels = useMemo(() => {
    return getAvailableQualityLevels().map((level) => ({
      level,
      preset: getQualityPreset(level),
      memory: estimateMemoryUsage(level),
    }));
  }, []);
  
  const currentInfo = useMemo(() => {
    return qualityLevels.find((q) => q.level === value) || qualityLevels[0];
  }, [qualityLevels, value]);
  
  return (
    <div className={`${styles.dropdown} ${className}`}>
      <label className={styles.label}>Render Quality</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as RenderQualityLevel)}
        disabled={disabled}
        className={styles.select}
      >
        {qualityLevels.map((info) => (
          <option key={info.level} value={info.level}>
            {info.preset.name}
            {showMemory ? ` (~${info.memory}MB)` : ''}
          </option>
        ))}
      </select>
      {showMemory && (
        <span className={styles.memoryHint}>
          Estimated VRAM: ~{currentInfo.memory} MB
        </span>
      )}
    </div>
  );
};

/**
 * Render Quality Slider - more visual representation
 */
export const RenderQualitySlider: React.FC<RenderQualitySelectorProps> = ({
  value,
  onChange,
  showDetails = true,
  disabled = false,
  className = '',
}) => {
  const levels: RenderQualityLevel[] = ['low', 'medium', 'high', 'ultra'];
  const currentIndex = levels.indexOf(value);
  
  const handleSliderChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const index = parseInt(event.target.value, 10);
      if (!disabled && index >= 0 && index < levels.length) {
        onChange(levels[index]);
      }
    },
    [onChange, disabled]
  );
  
  return (
    <div className={`${styles.sliderContainer} ${className}`}>
      <div className={styles.sliderHeader}>
        <label className={styles.sliderLabel}>Render Quality</label>
        <span className={styles.sliderValue}>{getQualityPreset(value).name}</span>
      </div>
      
      <input
        type="range"
        min="0"
        max="3"
        step="1"
        value={currentIndex}
        onChange={handleSliderChange}
        disabled={disabled}
        className={styles.slider}
        list="quality-marks"
      />
      
      <datalist id="quality-marks" className={styles.sliderMarks}>
        {levels.map((level, index) => (
          <option
            key={level}
            value={index}
            label={getQualityPreset(level).name}
          />
        ))}
      </datalist>
      
      {showDetails && (
        <p className={styles.sliderDescription}>
          {getQualityPreset(value).description}
        </p>
      )}
    </div>
  );
};

export default RenderQualitySelector;

/**
 * Visual Enhancements
 * 
 * Provides visual effect utilities for BIM rendering including:
 * - Ambient occlusion (SSAO, HBAO, GTAO)
 * - Shadow mapping
 * - Anti-aliasing techniques
 * - Screen-space effects
 * - Visualization presets (Realistic, Schematic, X-Ray)
 */

import { RenderQualityLevel, getQualityPreset } from './renderQuality';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type VisualizationPreset = 'realistic' | 'schematic' | 'xray' | 'wireframe' | 'technical';

export interface VisualEnhancementSettings {
  /** Ambient occlusion settings */
  ambientOcclusion: {
    enabled: boolean;
    type: 'ssao' | 'hbao' | 'gtao' | 'none';
    radius: number;
    intensity: number;
    quality: 'low' | 'medium' | 'high';
    samples: number;
    bias: number;
  };
  
  /** Shadow settings */
  shadows: {
    enabled: boolean;
    type: 'basic' | 'pcf' | 'vsm' | 'none';
    mapSize: number;
    blurSamples: number;
    bias: number;
    normalBias: number;
    cascadeCount: number;
    cascadeSplit: number[];
    maxDistance: number;
  };
  
  /** Anti-aliasing settings */
  antiAliasing: {
    enabled: boolean;
    method: 'fxaa' | 'msaa' | 'smaa' | 'temporal' | 'none';
    samples: number;
    edgeThreshold: number;
    edgeThresholdMin: number;
    subPixelQuality: number;
  };
  
  /** Screen-space effects */
  screenSpace: {
    bloom: {
      enabled: boolean;
      threshold: number;
      intensity: number;
      radius: number;
      smoothing: number;
    };
    depthOfField: {
      enabled: boolean;
      focusDistance: number;
      focalLength: number;
      aperture: number;
      maxBlur: number;
    };
    vignette: {
      enabled: boolean;
      offset: number;
      darkness: number;
    };
    colorGrading: {
      enabled: boolean;
      toneMapping: 'none' | 'reinhard' | 'aces' | 'filmic';
      exposure: number;
      contrast: number;
      saturation: number;
      brightness: number;
      temperature: number;
      tint: number;
    };
    grain: {
      enabled: boolean;
      intensity: number;
      size: number;
    };
  };
  
  /** Visualization preset */
  preset: VisualizationPreset;
  
  /** Custom overrides */
  overrides: Record<string, unknown>;
}

/**
 * Create default visual enhancement settings
 */
export function createDefaultVisualSettings(
  quality: RenderQualityLevel = 'medium',
  preset: VisualizationPreset = 'realistic'
): VisualEnhancementSettings {
  const qualityPreset = getQualityPreset(quality);
  
  return {
    ambientOcclusion: {
      enabled: qualityPreset.ambientOcclusion.enabled,
      type: qualityPreset.ambientOcclusion.type === 'none' 
        ? 'none' 
        : qualityPreset.ambientOcclusion.type === 'hbao' 
          ? 'hbao' 
          : 'ssao',
      radius: qualityPreset.ambientOcclusion.radius,
      intensity: qualityPreset.ambientOcclusion.intensity,
      quality: qualityPreset.ambientOcclusion.quality,
      samples: qualityPreset.ambientOcclusion.samples,
      bias: 0.0005,
    },
    
    shadows: {
      enabled: qualityPreset.shadows.enabled,
      type: qualityPreset.shadows.type === 'none' 
        ? 'none' 
        : qualityPreset.shadows.type === 'vsm' 
          ? 'vsm' 
          : 'pcf',
      mapSize: qualityPreset.shadows.mapSize,
      blurSamples: qualityPreset.shadows.blurSamples,
      bias: qualityPreset.shadows.bias,
      normalBias: qualityPreset.shadows.normalBias,
      cascadeCount: qualityPreset.shadows.cascadeCount,
      cascadeSplit: qualityPreset.shadows.cascadeSplit,
      maxDistance: qualityPreset.shadows.maxDistance,
    },
    
    antiAliasing: {
      enabled: qualityPreset.antiAliasing.enabled,
      method: qualityPreset.antiAliasing.method === 'smaa' 
        ? 'smaa' 
        : qualityPreset.antiAliasing.method === 'fxaa' 
          ? 'fxaa' 
          : 'msaa',
      samples: qualityPreset.antiAliasing.samples,
      edgeThreshold: qualityPreset.antiAliasing.edgeThreshold,
      edgeThresholdMin: 0.0833,
      subPixelQuality: 0.25,
    },
    
    screenSpace: {
      bloom: {
        enabled: qualityPreset.postProcessing.bloom.enabled,
        threshold: qualityPreset.postProcessing.bloom.threshold,
        intensity: qualityPreset.postProcessing.bloom.intensity,
        radius: qualityPreset.postProcessing.bloom.radius,
        smoothing: 0.9,
      },
      depthOfField: {
        enabled: qualityPreset.postProcessing.depthOfField.enabled,
        focusDistance: qualityPreset.postProcessing.depthOfField.focusDistance,
        focalLength: qualityPreset.postProcessing.depthOfField.focalLength,
        aperture: qualityPreset.postProcessing.depthOfField.aperture,
        maxBlur: 0.01,
      },
      vignette: {
        enabled: qualityPreset.postProcessing.vignette.enabled,
        offset: qualityPreset.postProcessing.vignette.offset,
        darkness: qualityPreset.postProcessing.vignette.darkness,
      },
      colorGrading: {
        enabled: qualityPreset.postProcessing.colorGrading.enabled,
        toneMapping: qualityPreset.postProcessing.colorGrading.toneMapping === 'ACESFilmic' 
          ? 'aces' 
          : qualityPreset.postProcessing.colorGrading.toneMapping === 'Reinhard' 
            ? 'reinhard' 
            : 'filmic',
        exposure: qualityPreset.postProcessing.colorGrading.exposure,
        contrast: qualityPreset.postProcessing.colorGrading.contrast,
        saturation: qualityPreset.postProcessing.colorGrading.saturation,
        brightness: 0,
        temperature: qualityPreset.postProcessing.colorGrading.temperature,
        tint: qualityPreset.postProcessing.colorGrading.tint,
      },
      grain: {
        enabled: qualityPreset.postProcessing.grain.enabled,
        intensity: qualityPreset.postProcessing.grain.intensity,
        size: 1.0,
      },
    },
    
    preset,
    overrides: {},
  };
}

// ============================================================================
// Visualization Presets
// ============================================================================

export const VISUALIZATION_PRESETS: Record<VisualizationPreset, Partial<VisualEnhancementSettings>> = {
  realistic: {
    ambientOcclusion: {
      enabled: true,
      type: 'hbao',
      radius: 2.5,
      intensity: 2.0,
    },
    shadows: {
      enabled: true,
      type: 'pcf',
      bias: 0.00002,
      normalBias: 0.3,
    },
    antiAliasing: {
      enabled: true,
      method: 'smaa',
    },
    screenSpace: {
      bloom: {
        enabled: true,
        threshold: 0.6,
        intensity: 0.5,
      },
      depthOfField: {
        enabled: false,
      },
      vignette: {
        enabled: true,
        offset: 1.0,
        darkness: 0.6,
      },
      colorGrading: {
        enabled: true,
        toneMapping: 'aces',
        exposure: 1.0,
        contrast: 1.1,
        saturation: 1.0,
      },
      grain: {
        enabled: false,
      },
    },
  },
  
  schematic: {
    ambientOcclusion: {
      enabled: false,
      type: 'none',
    },
    shadows: {
      enabled: false,
      type: 'none',
    },
    antiAliasing: {
      enabled: true,
      method: 'fxaa',
    },
    screenSpace: {
      bloom: {
        enabled: false,
      },
      depthOfField: {
        enabled: false,
      },
      vignette: {
        enabled: false,
      },
      colorGrading: {
        enabled: true,
        toneMapping: 'none',
        exposure: 1.0,
        contrast: 1.2,
        saturation: 0.8,
      },
      grain: {
        enabled: false,
      },
    },
  },
  
  xray: {
    ambientOcclusion: {
      enabled: false,
      type: 'none',
    },
    shadows: {
      enabled: false,
      type: 'none',
    },
    antiAliasing: {
      enabled: true,
      method: 'fxaa',
    },
    screenSpace: {
      bloom: {
        enabled: false,
      },
      depthOfField: {
        enabled: false,
      },
      vignette: {
        enabled: false,
      },
      colorGrading: {
        enabled: true,
        toneMapping: 'none',
        exposure: 1.2,
        contrast: 0.9,
        saturation: 0.5,
      },
      grain: {
        enabled: false,
      },
    },
  },
  
  wireframe: {
    ambientOcclusion: {
      enabled: false,
      type: 'none',
    },
    shadows: {
      enabled: false,
      type: 'none',
    },
    antiAliasing: {
      enabled: true,
      method: 'fxaa',
    },
    screenSpace: {
      bloom: {
        enabled: false,
      },
      depthOfField: {
        enabled: false,
      },
      vignette: {
        enabled: false,
      },
      colorGrading: {
        enabled: true,
        toneMapping: 'none',
        exposure: 1.0,
        contrast: 1.5,
        saturation: 0,
      },
      grain: {
        enabled: false,
      },
    },
  },
  
  technical: {
    ambientOcclusion: {
      enabled: true,
      type: 'ssao',
      radius: 1.5,
      intensity: 1.0,
    },
    shadows: {
      enabled: true,
      type: 'basic',
      bias: 0.0001,
      normalBias: 0.5,
    },
    antiAliasing: {
      enabled: true,
      method: 'fxaa',
    },
    screenSpace: {
      bloom: {
        enabled: false,
      },
      depthOfField: {
        enabled: false,
      },
      vignette: {
        enabled: false,
      },
      colorGrading: {
        enabled: true,
        toneMapping: 'none',
        exposure: 1.0,
        contrast: 1.1,
        saturation: 1.0,
      },
      grain: {
        enabled: false,
      },
    },
  },
};

/**
 * Apply visualization preset to settings
 */
export function applyVisualPreset(
  settings: VisualEnhancementSettings,
  preset: VisualizationPreset
): VisualEnhancementSettings {
  const presetSettings = VISUALIZATION_PRESETS[preset];
  
  if (!presetSettings) {
    console.warn(`Unknown visualization preset: ${preset}`);
    return settings;
  }
  
  return {
    ...settings,
    ...presetSettings,
    ambientOcclusion: {
      ...settings.ambientOcclusion,
      ...presetSettings.ambientOcclusion,
    },
    shadows: {
      ...settings.shadows,
      ...presetSettings.shadows,
    },
    antiAliasing: {
      ...settings.antiAliasing,
      ...presetSettings.antiAliasing,
    },
    screenSpace: {
      ...settings.screenSpace,
      bloom: {
        ...settings.screenSpace.bloom,
        ...presetSettings.screenSpace?.bloom,
      },
      depthOfField: {
        ...settings.screenSpace.depthOfField,
        ...presetSettings.screenSpace?.depthOfField,
      },
      vignette: {
        ...settings.screenSpace.vignette,
        ...presetSettings.screenSpace?.vignette,
      },
      colorGrading: {
        ...settings.screenSpace.colorGrading,
        ...presetSettings.screenSpace?.colorGrading,
      },
      grain: {
        ...settings.screenSpace.grain,
        ...presetSettings.screenSpace?.grain,
      },
    },
    preset,
  };
}

// ============================================================================
// Effect Implementations (WebGL/Three.js helpers)
// ============================================================================

/**
 * Create FXAA shader configuration
 */
export function createFXAAConfig(settings: VisualEnhancementSettings['antiAliasing']) {
  return {
    enabled: settings.enabled,
    edgeThreshold: settings.edgeThreshold,
    edgeThresholdMin: settings.edgeThresholdMin,
    subPixelQuality: settings.subPixelQuality,
  };
}

/**
 * Create SSAO configuration for Three.js
 */
export function createSSAOConfig(settings: VisualEnhancementSettings['ambientOcclusion']) {
  return {
    enabled: settings.enabled && settings.type === 'ssao',
    radius: settings.radius,
    intensity: settings.intensity,
    bias: settings.bias,
    kernelRadius: settings.radius * 2,
    minDistance: 0.005,
    maxDistance: 0.1,
    samples: settings.samples,
    quality: settings.quality === 'high' ? 'high' : settings.quality === 'medium' ? 'medium' : 'low',
  };
}

/**
 * Create HBAO configuration
 */
export function createHBAOConfig(settings: VisualEnhancementSettings['ambientOcclusion']) {
  return {
    enabled: settings.enabled && settings.type === 'hbao',
    radius: settings.radius,
    intensity: settings.intensity,
    bias: settings.bias,
    quality: settings.quality,
  };
}

/**
 * Create GTAO configuration
 */
export function createGTAOConfig(settings: VisualEnhancementSettings['ambientOcclusion']) {
  return {
    enabled: settings.enabled && settings.type === 'gtao',
    radius: settings.radius,
    intensity: settings.intensity,
    distanceFalloff: 2.0,
    quality: settings.quality,
  };
}

/**
 * Create shadow map configuration
 */
export function createShadowConfig(settings: VisualEnhancementSettings['shadows']) {
  return {
    enabled: settings.enabled && settings.type !== 'none',
    type: settings.type === 'vsm' ? 3 : settings.type === 'pcf' ? 2 : 1,
    mapSize: settings.mapSize,
    bias: settings.bias,
    normalBias: settings.normalBias,
    cascadeCount: settings.cascadeCount,
    maxDistance: settings.maxDistance,
  };
}

/**
 * Create bloom configuration
 */
export function createBloomConfig(settings: VisualEnhancementSettings['screenSpace']['bloom']) {
  return {
    enabled: settings.enabled,
    threshold: settings.threshold,
    strength: settings.intensity,
    radius: settings.radius,
    smoothing: settings.smoothing,
  };
}

/**
 * Create depth of field configuration
 */
export function createDoFConfig(settings: VisualEnhancementSettings['screenSpace']['depthOfField']) {
  return {
    enabled: settings.enabled,
    focusDistance: settings.focusDistance,
    focalLength: settings.focalLength,
    aperture: settings.aperture,
    maxBlur: settings.maxBlur,
  };
}

/**
 * Create color grading configuration
 */
export function createColorGradingConfig(
  settings: VisualEnhancementSettings['screenSpace']['colorGrading']
) {
  return {
    enabled: settings.enabled,
    toneMapping: settings.toneMapping === 'aces' 
      ? 2 
      : settings.toneMapping === 'filmic' 
        ? 3 
        : settings.toneMapping === 'reinhard' 
          ? 1 
          : 0,
    exposure: settings.exposure,
    contrast: settings.contrast,
    saturation: settings.saturation,
    brightness: settings.brightness,
    temperature: settings.temperature,
    tint: settings.tint,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all available visualization presets
 */
export function getAvailablePresets(): VisualizationPreset[] {
  return ['realistic', 'schematic', 'xray', 'wireframe', 'technical'];
}

/**
 * Get preset display name
 */
export function getPresetDisplayName(preset: VisualizationPreset): string {
  const names: Record<VisualizationPreset, string> = {
    realistic: 'Realistic',
    schematic: 'Schematic',
    xray: 'X-Ray',
    wireframe: 'Wireframe',
    technical: 'Technical',
  };
  return names[preset] || preset;
}

/**
 * Get preset description
 */
export function getPresetDescription(preset: VisualizationPreset): string {
  const descriptions: Record<VisualizationPreset, string> = {
    realistic: 'Photorealistic rendering with full lighting and effects',
    schematic: 'Simplified view for technical documentation',
    xray: 'Transparent view showing internal structure',
    wireframe: 'Edge-only rendering for geometry visualization',
    technical: 'Clean view with occlusion for precise detailing',
  };
  return descriptions[preset] || '';
}

/**
 * Check if a feature is supported based on quality level
 */
export function isFeatureSupported(
  feature: 'ambientOcclusion' | 'softShadows' | 'bloom' | 'depthOfField' | 'colorGrading',
  quality: RenderQualityLevel
): boolean {
  const preset = getQualityPreset(quality);
  
  switch (feature) {
    case 'ambientOcclusion':
      return preset.ambientOcclusion.enabled;
    case 'softShadows':
      return preset.shadows.type === 'pcf' || preset.shadows.type === 'vsm';
    case 'bloom':
      return preset.postProcessing.bloom.enabled;
    case 'depthOfField':
      return preset.postProcessing.depthOfField.enabled;
    case 'colorGrading':
      return preset.postProcessing.colorGrading.enabled;
    default:
      return false;
  }
}

/**
 * Optimize settings for better performance
 */
export function optimizeForPerformance(
  settings: VisualEnhancementSettings,
  targetFPS: number
): VisualEnhancementSettings {
  const optimized = { ...settings };
  
  // Reduce AO quality
  if (optimized.ambientOcclusion.enabled) {
    optimized.ambientOcclusion.samples = Math.min(optimized.ambientOcclusion.samples, 16);
    optimized.ambientOcclusion.quality = 'low';
  }
  
  // Reduce shadow quality
  if (optimized.shadows.enabled && optimized.shadows.type !== 'none') {
    optimized.shadows.mapSize = Math.min(optimized.shadows.mapSize, 1024);
    optimized.shadows.blurSamples = Math.min(optimized.shadows.blurSamples, 8);
    optimized.shadows.cascadeCount = Math.min(optimized.shadows.cascadeCount, 2);
  }
  
  // Reduce AA quality
  if (optimized.antiAliasing.enabled) {
    optimized.antiAliasing.method = 'fxaa';
    optimized.antiAliasing.samples = 1;
  }
  
  // Disable expensive effects if needed
  if (targetFPS < 30) {
    optimized.screenSpace.bloom.enabled = false;
    optimized.screenSpace.depthOfField.enabled = false;
  }
  
  return optimized;
}

/**
 * Clone visual settings
 */
export function cloneVisualSettings(settings: VisualEnhancementSettings): VisualEnhancementSettings {
  return JSON.parse(JSON.stringify(settings));
}

/**
 * Compare two visual settings
 */
export function areSettingsEqual(
  a: VisualEnhancementSettings,
  b: VisualEnhancementSettings
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Serialize settings for storage
 */
export function serializeSettings(settings: VisualEnhancementSettings): string {
  return JSON.stringify(settings, null, 2);
}

/**
 * Deserialize settings from storage
 */
export function deserializeSettings(data: string): VisualEnhancementSettings | null {
  try {
    return JSON.parse(data);
  } catch {
    console.error('Failed to parse visual settings');
    return null;
  }
}

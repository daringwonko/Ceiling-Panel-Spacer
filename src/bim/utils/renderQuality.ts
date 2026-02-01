/**
 * Render Quality Presets
 * 
 * Provides quality level configurations for BIM rendering system.
 * Supports Low, Medium, High, and Ultra quality levels with appropriate
 * settings for performance and visual fidelity.
 */

export type RenderQualityLevel = 'low' | 'medium' | 'high' | 'ultra';

export interface RenderQualityPreset {
  name: string;
  description: string;
  antiAliasing: AntiAliasingSettings;
  shadows: ShadowSettings;
  ambientOcclusion: AmbientOcclusionSettings;
  postProcessing: PostProcessingSettings;
  performance: PerformanceSettings;
}

export interface AntiAliasingSettings {
  enabled: boolean;
  method: 'fxaa' | 'msaa' | 'smaa' | 'none';
  samples: number;
  edgeThreshold: number;
}

export interface ShadowSettings {
  enabled: boolean;
  type: 'basic' | 'pcf' | 'vsm' | 'none';
  mapSize: number;
  blurSamples: number;
  bias: number;
  normalBias: number;
  cascadeCount: number;
  cascadeSplit: number[];
  maxDistance: number;
}

export interface AmbientOcclusionSettings {
  enabled: boolean;
  type: 'ssa0' | 'hbao' | 'gtao' | 'none';
  radius: number;
  intensity: number;
  quality: 'low' | 'medium' | 'high';
  samples: number;
  downsampling: number;
  temporal: boolean;
}

export interface PostProcessingSettings {
  bloom: {
    enabled: boolean;
    threshold: number;
    intensity: number;
    radius: number;
  };
  depthOfField: {
    enabled: boolean;
    focusDistance: number;
    focalLength: number;
    aperture: number;
    quality: 'low' | 'medium' | 'high';
  };
  colorGrading: {
    enabled: boolean;
    toneMapping: 'none' | 'reinhard' | 'ACESFilmic' | 'Cineon';
    exposure: number;
    contrast: number;
    saturation: number;
    temperature: number;
    tint: number;
  };
  vignette: {
    enabled: boolean;
    offset: number;
    darkness: number;
  };
  grain: {
    enabled: boolean;
    intensity: number;
  };
}

export interface PerformanceSettings {
  targetFPS: number;
  lodBias: number;
  maxLODLevel: number;
  textureQuality: 'low' | 'medium' | 'high';
  geometryQuality: 'low' | 'medium' | 'high';
  instancingEnabled: boolean;
  frustumCullingEnabled: boolean;
  occlusionCullingEnabled: boolean;
}

/**
 * Render quality presets configuration
 */
export const RENDER_QUALITY_PRESETS: Record<RenderQualityLevel, RenderQualityPreset> = {
  low: {
    name: 'Low',
    description: 'Optimized for performance, reduced visual quality',
    antiAliasing: {
      enabled: true,
      method: 'fxaa',
      samples: 1,
      edgeThreshold: 0.1,
    },
    shadows: {
      enabled: true,
      type: 'basic',
      mapSize: 512,
      blurSamples: 4,
      bias: 0.0001,
      normalBias: 0.5,
      cascadeCount: 1,
      cascadeSplit: [0.25],
      maxDistance: 50,
    },
    ambientOcclusion: {
      enabled: false,
      type: 'none',
      radius: 1.0,
      intensity: 1.0,
      quality: 'low',
      samples: 16,
      downsampling: 2,
      temporal: false,
    },
    postProcessing: {
      bloom: {
        enabled: false,
        threshold: 0.8,
        intensity: 0.5,
        radius: 0.5,
      },
      depthOfField: {
        enabled: false,
        focusDistance: 10,
        focalLength: 50,
        aperture: 2.8,
        quality: 'low',
      },
      colorGrading: {
        enabled: true,
        toneMapping: 'Reinhard',
        exposure: 1.0,
        contrast: 1.0,
        saturation: 1.0,
        temperature: 0,
        tint: 0,
      },
      vignette: {
        enabled: false,
        offset: 1,
        darkness: 1,
      },
      grain: {
        enabled: false,
        intensity: 0,
      },
    },
    performance: {
      targetFPS: 30,
      lodBias: 1.5,
      maxLODLevel: 2,
      textureQuality: 'low',
      geometryQuality: 'low',
      instancingEnabled: true,
      frustumCullingEnabled: true,
      occlusionCullingEnabled: false,
    },
  },
  
  medium: {
    name: 'Medium',
    description: 'Balanced quality and performance',
    antiAliasing: {
      enabled: true,
      method: 'fxaa',
      samples: 1,
      edgeThreshold: 0.083,
    },
    shadows: {
      enabled: true,
      type: 'pcf',
      mapSize: 1024,
      blurSamples: 8,
      bias: 0.00005,
      normalBias: 0.4,
      cascadeCount: 2,
      cascadeSplit: [0.2, 0.5],
      maxDistance: 100,
    },
    ambientOcclusion: {
      enabled: true,
      type: 'ssa0',
      radius: 2.0,
      intensity: 1.5,
      quality: 'low',
      samples: 24,
      downsampling: 2,
      temporal: false,
    },
    postProcessing: {
      bloom: {
        enabled: true,
        threshold: 0.7,
        intensity: 0.3,
        radius: 0.6,
      },
      depthOfField: {
        enabled: false,
        focusDistance: 10,
        focalLength: 50,
        aperture: 4.0,
        quality: 'low',
      },
      colorGrading: {
        enabled: true,
        toneMapping: 'ACESFilmic',
        exposure: 1.0,
        contrast: 1.05,
        saturation: 1.0,
        temperature: 0,
        tint: 0,
      },
      vignette: {
        enabled: false,
        offset: 1,
        darkness: 1,
      },
      grain: {
        enabled: false,
        intensity: 0,
      },
    },
    performance: {
      targetFPS: 45,
      lodBias: 1.0,
      maxLODLevel: 3,
      textureQuality: 'medium',
      geometryQuality: 'medium',
      instancingEnabled: true,
      frustumCullingEnabled: true,
      occlusionCullingEnabled: true,
    },
  },
  
  high: {
    name: 'High',
    description: 'High visual quality for detailed rendering',
    antiAliasing: {
      enabled: true,
      method: 'smaa',
      samples: 1,
      edgeThreshold: 0.05,
    },
    shadows: {
      enabled: true,
      type: 'pcf',
      mapSize: 2048,
      blurSamples: 16,
      bias: 0.00002,
      normalBias: 0.3,
      cascadeCount: 3,
      cascadeSplit: [0.15, 0.35, 0.65],
      maxDistance: 200,
    },
    ambientOcclusion: {
      enabled: true,
      type: 'hbao',
      radius: 2.5,
      intensity: 2.0,
      quality: 'medium',
      samples: 32,
      downsampling: 1,
      temporal: false,
    },
    postProcessing: {
      bloom: {
        enabled: true,
        threshold: 0.6,
        intensity: 0.5,
        radius: 0.7,
      },
      depthOfField: {
        enabled: false,
        focusDistance: 10,
        focalLength: 85,
        aperture: 2.8,
        quality: 'medium',
      },
      colorGrading: {
        enabled: true,
        toneMapping: 'ACESFilmic',
        exposure: 1.0,
        contrast: 1.1,
        saturation: 1.0,
        temperature: 0,
        tint: 0,
      },
      vignette: {
        enabled: true,
        offset: 1,
        darkness: 0.8,
      },
      grain: {
        enabled: false,
        intensity: 0,
      },
    },
    performance: {
      targetFPS: 60,
      lodBias: 0.5,
      maxLODLevel: 4,
      textureQuality: 'high',
      geometryQuality: 'high',
      instancingEnabled: true,
      frustumCullingEnabled: true,
      occlusionCullingEnabled: true,
    },
  },
  
  ultra: {
    name: 'Ultra',
    description: 'Maximum visual quality and effects',
    antiAliasing: {
      enabled: true,
      method: 'smaa',
      samples: 1,
      edgeThreshold: 0.02,
    },
    shadows: {
      enabled: true,
      type: 'vsm',
      mapSize: 4096,
      blurSamples: 32,
      bias: 0.00001,
      normalBias: 0.2,
      cascadeCount: 4,
      cascadeSplit: [0.1, 0.25, 0.45, 0.7],
      maxDistance: 300,
    },
    ambientOcclusion: {
      enabled: true,
      type: 'gtao',
      radius: 3.0,
      intensity: 2.5,
      quality: 'high',
      samples: 64,
      downsampling: 1,
      temporal: true,
    },
    postProcessing: {
      bloom: {
        enabled: true,
        threshold: 0.5,
        intensity: 0.7,
        radius: 0.8,
      },
      depthOfField: {
        enabled: true,
        focusDistance: 10,
        focalLength: 100,
        aperture: 1.4,
        quality: 'high',
      },
      colorGrading: {
        enabled: true,
        toneMapping: 'ACESFilmic',
        exposure: 1.0,
        contrast: 1.15,
        saturation: 1.0,
        temperature: 0,
        tint: 0,
      },
      vignette: {
        enabled: true,
        offset: 1,
        darkness: 0.6,
      },
      grain: {
        enabled: true,
        intensity: 0.05,
      },
    },
    performance: {
      targetFPS: 60,
      lodBias: 0,
      maxLODLevel: 5,
      textureQuality: 'high',
      geometryQuality: 'high',
      instancingEnabled: true,
      frustumCullingEnabled: true,
      occlusionCullingEnabled: true,
    },
  },
};

/**
 * Get the quality preset for a given level
 */
export function getQualityPreset(level: RenderQualityLevel): RenderQualityPreset {
  return RENDER_QUALITY_PRESETS[level];
}

/**
 * Get all available quality levels
 */
export function getAvailableQualityLevels(): RenderQualityLevel[] {
  return ['low', 'medium', 'high', 'ultra'];
}

/**
 * Get recommended quality level based on hardware capabilities
 */
export function getRecommendedQualityLevel(
  gpuMemory: number, // in GB
  gpuScore: number,  // benchmark score
  hasDedicatedGPU: boolean
): RenderQualityLevel {
  // Low-end or integrated GPU
  if (!hasDedicatedGPU || gpuScore < 3000 || gpuMemory < 2) {
    return 'low';
  }
  
  // Mid-range GPU
  if (gpuScore < 6000 || gpuMemory < 4) {
    return 'medium';
  }
  
  // High-end GPU
  if (gpuScore < 12000 || gpuMemory < 6) {
    return 'high';
  }
  
  // Enthusiast GPU
  return 'ultra';
}

/**
 * Merge custom settings with a preset
 */
export function mergeWithPreset(
  preset: RenderQualityLevel,
  customSettings: Partial<RenderQualityPreset>
): RenderQualityPreset {
  const base = getQualityPreset(preset);
  return {
    ...base,
    ...customSettings,
    antiAliasing: { ...base.antiAliasing, ...customSettings.antiAliasing },
    shadows: { ...base.shadows, ...customSettings.shadows },
    ambientOcclusion: { ...base.ambientOcclusion, ...customSettings.ambientOcclusion },
    postProcessing: {
      ...base.postProcessing,
      bloom: { ...base.postProcessing.bloom, ...customSettings.postProcessing?.bloom },
      depthOfField: { ...base.postProcessing.depthOfField, ...customSettings.postProcessing?.depthOfField },
      colorGrading: { ...base.postProcessing.colorGrading, ...customSettings.postProcessing?.colorGrading },
      vignette: { ...base.postProcessing.vignette, ...customSettings.postProcessing?.vignette },
      grain: { ...base.postProcessing.grain, ...customSettings.postProcessing?.grain },
    },
    performance: { ...base.performance, ...customSettings.performance },
  };
}

/**
 * Calculate estimated memory usage for a quality level
 */
export function estimateMemoryUsage(level: RenderQualityLevel): number {
  const preset = getQualityPreset(level);
  const { shadows, ambientOcclusion, postProcessing } = preset;
  
  // Rough memory estimates in MB
  let memory = 100; // Base overhead
  
  // Shadow memory
  const shadowSize = shadows.mapSize * shadows.mapSize * 4 * shadows.cascadeCount;
  memory += shadowSize / 1024 / 1024 * 2; // Double for double-sided
  
  // AO memory
  if (ambientOcclusion.enabled) {
    const aoSize = 1920 * 1080 * 4 / ambientOcclusion.downsampling;
    memory += aoSize / 1024 / 1024 * ambientOcclusion.samples;
  }
  
  // Post-processing memory
  if (postProcessing.bloom.enabled || postProcessing.depthOfField.enabled) {
    memory += 1920 * 1080 * 4 * 2 / 1024 / 1024; // Render targets
  }
  
  return Math.round(memory);
}

/**
 * Check if quality level supports a specific feature
 */
export function qualitySupportsFeature(
  level: RenderQualityLevel,
  feature: 'ambientOcclusion' | 'bloom' | 'depthOfField' | 'temporalAA' | 'softShadows'
): boolean {
  const preset = getQualityPreset(level);
  
  switch (feature) {
    case 'ambientOcclusion':
      return preset.ambientOcclusion.enabled;
    case 'bloom':
      return preset.postProcessing.bloom.enabled;
    case 'depthOfField':
      return preset.postProcessing.depthOfField.enabled;
    case 'temporalAA':
      return preset.antiAliasing.method === 'smaa';
    case 'softShadows':
      return preset.shadows.type === 'pcf' || preset.shadows.type === 'vsm';
    default:
      return false;
  }
}

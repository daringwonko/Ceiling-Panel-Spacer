/**
 * Image Export Component
 * 
 * High-resolution image export functionality for BIM workbench.
 * Supports 4K, 8K, and custom resolutions.
 */

import React, { useState, useCallback, useRef } from 'react';
import styles from './ImageExport.module.css';

export type ExportResolution = '4k' | '8k' | 'custom';

export interface ExportSettings {
  resolution: ExportResolution;
  customWidth: number;
  customHeight: number;
  format: 'png' | 'jpeg' | 'webp';
  quality: number;
  background: 'transparent' | 'white' | 'color';
  backgroundColor: string;
  antialias: boolean;
  preserveScale: boolean;
}

export interface ImageExportProps {
  // Canvas reference
  canvasRef: React.RefObject<HTMLCanvasElement>;
  
  // Optional renderer for WebGL
  renderer?: {
    domElement: HTMLCanvasElement;
    getSize: () => { width: number; height: number };
  };
  
  // Callbacks
  onExportStart?: () => void;
  onExportProgress?: (progress: number) => void;
  onExportComplete?: (blob: Blob) => void;
  onExportError?: (error: Error) => void;
  
  // Options
  enablePresets?: boolean;
  enableCustomResolution?: boolean;
  enableBackgroundOptions?: boolean;
  defaultFormat?: 'png' | 'jpeg' | 'webp';
  maxWidth?: number;
  maxHeight?: number;
}

const PRESET_RESOLUTIONS: Record<ExportResolution, { width: number; height: number; label: string }> = {
  '4k': { width: 3840, height: 2160, label: '4K UHD' },
  '8k': { width: 7680, height: 4320, label: '8K UHD' },
  'custom': { width: 1920, height: 1080, label: 'Custom' }
};

const ASPECT_RATIOS = [
  { label: '16:9', value: 16 / 9 },
  { label: '16:10', value: 16 / 10 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '1:1', value: 1 },
  { label: '9:16', value: 9 / 16 }
];

const DEFAULT_SETTINGS: ExportSettings = {
  resolution: '4k',
  customWidth: 1920,
  customHeight: 1080,
  format: 'png',
  quality: 0.92,
  background: 'transparent',
  backgroundColor: '#ffffff',
  antialias: true,
  preserveScale: true
};

export function ImageExport({
  canvasRef,
  renderer,
  onExportStart,
  onExportProgress,
  onExportComplete,
  onExportError,
  enablePresets = true,
  enableCustomResolution = true,
  enableBackgroundOptions = true,
  defaultFormat = 'png',
  maxWidth = 7680,
  maxHeight = 7680
}: ImageExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ExportSettings>({
    ...DEFAULT_SETTINGS,
    format: defaultFormat
  });
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleExport = useCallback(async () => {
    if (!canvasRef.current && !renderer) {
      onExportError?.(new Error('No canvas available for export'));
      return;
    }
    
    setIsExporting(true);
    setProgress(0);
    onExportStart?.();
    
    try {
      // Get canvas and dimensions
      const canvas = canvasRef.current || renderer?.domElement;
      if (!canvas) throw new Error('Canvas not found');
      
      const originalWidth = canvas.width;
      const originalHeight = canvas.height;
      
      // Calculate export dimensions
      let exportWidth: number;
      let exportHeight: number;
      
      if (settings.resolution === 'custom') {
        exportWidth = Math.min(settings.customWidth, maxWidth);
        exportHeight = Math.min(settings.customHeight, maxHeight);
      } else {
        const preset = PRESET_RESOLUTIONS[settings.resolution];
        exportWidth = preset.width;
        exportHeight = preset.height;
      }
      
      // Create export canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = exportWidth;
      exportCanvas.height = exportHeight;
      
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2D context');
      
      // Fill background
      setProgress(10);
      onExportProgress?.(10);
      
      if (settings.background !== 'transparent') {
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, exportWidth, exportHeight);
      }
      
      // Calculate scaling to fit content
      setProgress(20);
      onExportProgress?.(20);
      
      const scale = settings.preserveScale
        ? Math.min(exportWidth / originalWidth, exportHeight / originalHeight)
        : 1;
      
      const scaledWidth = originalWidth * scale;
      const scaledHeight = originalHeight * scale;
      
      // Center the content
      const offsetX = (exportWidth - scaledWidth) / 2;
      const offsetY = (exportHeight - scaledHeight) / 2;
      
      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw canvas content
      setProgress(30);
      onExportProgress?.(30);
      
      ctx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight);
      
      // Generate blob
      setProgress(80);
      onExportProgress?.(80);
      
      const mimeType = `image/${settings.format}`;
      const quality = settings.format === 'png' ? undefined : settings.quality;
      
      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Failed to generate image blob'));
            }
          },
          mimeType,
          quality
        );
      });
      
      setProgress(100);
      onExportProgress?.(100);
      
      onExportComplete?.(blob);
      
      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `bim-export-${Date.now()}.${settings.format}`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      onExportError?.(error as Error);
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [canvasRef, renderer, settings, maxWidth, maxHeight, onExportStart, onExportProgress, onExportComplete, onExportError]);
  
  const handleResolutionChange = (resolution: ExportResolution) => {
    setSettings(prev => ({ ...prev, resolution }));
  };
  
  const handleCustomWidthChange = (width: number) => {
    setSettings(prev => ({ ...prev, customWidth: width }));
    // Update height to maintain aspect ratio
    if (settings.preserveScale) {
      setSettings(prev => ({ ...prev, customHeight: Math.round(width / aspectRatio) }));
    }
  };
  
  const handleCustomHeightChange = (height: number) => {
    setSettings(prev => ({ ...prev, customHeight: height }));
  };
  
  const handleAspectRatioChange = (ratio: number) => {
    setAspectRatio(ratio);
    setSettings(prev => ({
      ...prev,
      customHeight: Math.round(prev.customWidth / ratio)
    }));
  };
  
  const handleFormatChange = (format: ExportSettings['format']) => {
    setSettings(prev => ({ ...prev, format }));
  };
  
  const handleQualityChange = (quality: number) => {
    setSettings(prev => ({ ...prev, quality }));
  };
  
  const handleBackgroundChange = (background: ExportSettings['background']) => {
    setSettings(prev => ({ ...prev, background }));
  };
  
  const getResolutionInfo = (): { width: number; height: number; label: string } => {
    if (settings.resolution === 'custom') {
      return {
        width: settings.customWidth,
        height: settings.customHeight,
        label: 'Custom'
      };
    }
    return PRESET_RESOLUTIONS[settings.resolution];
  };
  
  const resolution = getResolutionInfo();
  
  return (
    <div className={styles.container}>
      <button
        className={styles.triggerButton}
        onClick={() => setIsOpen(true)}
        title="Export Image"
      >
        📷 Export
      </button>
      
      {isOpen && (
        <div className={styles.overlay} onClick={() => !isExporting && setIsOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.header}>
              <h3>Export Image</h3>
              {!isExporting && (
                <button
                  className={styles.closeButton}
                  onClick={() => setIsOpen(false)}
                >
                  ×
                </button>
              )}
            </div>
            
            <div className={styles.content}>
              {/* Resolution Section */}
              <section className={styles.section}>
                <h4>Resolution</h4>
                
                {enablePresets && (
                  <div className={styles.presetGrid}>
                    {(Object.keys(PRESET_RESOLUTIONS) as ExportResolution[]).map(res => (
                      <button
                        key={res}
                        className={`${styles.presetButton} ${settings.resolution === res ? styles.active : ''}`}
                        onClick={() => handleResolutionChange(res)}
                        disabled={isExporting}
                      >
                        <span className={styles.presetLabel}>
                          {PRESET_RESOLUTIONS[res].label}
                        </span>
                        <span className={styles.presetSize}>
                          {PRESET_RESOLUTIONS[res].width} × {PRESET_RESOLUTIONS[res].height}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                
                {settings.resolution === 'custom' && enableCustomResolution && (
                  <div className={styles.customResolution}>
                    <div className={styles.inputRow}>
                      <label>
                        Width (px)
                        <input
                          type="number"
                          value={settings.customWidth}
                          onChange={e => handleCustomWidthChange(Number(e.target.value))}
                          min={1}
                          max={maxWidth}
                          className={styles.input}
                          disabled={isExporting}
                        />
                      </label>
                      
                      <span className={styles.multiply}>×</span>
                      
                      <label>
                        Height (px)
                        <input
                          type="number"
                          value={settings.customHeight}
                          onChange={e => handleCustomHeightChange(Number(e.target.value))}
                          min={1}
                          max={maxHeight}
                          className={styles.input}
                          disabled={isExporting}
                        />
                      </label>
                    </div>
                    
                    <div className={styles.aspectRatioRow}>
                      <span>Aspect Ratio:</span>
                      <div className={styles.aspectRatioButtons}>
                        {ASPECT_RATIOS.map(ratio => (
                          <button
                            key={ratio.label}
                            className={`${styles.aspectButton} ${Math.abs(aspectRatio - ratio.value) < 0.01 ? styles.active : ''}`}
                            onClick={() => handleAspectRatioChange(ratio.value)}
                            disabled={isExporting}
                          >
                            {ratio.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <p className={styles.resolutionInfo}>
                  Export: <strong>{resolution.width} × {resolution.height}</strong> pixels
                </p>
              </section>
              
              {/* Format Section */}
              <section className={styles.section}>
                <h4>Format</h4>
                <div className={styles.formatButtons}>
                  {(['png', 'jpeg', 'webp'] as const).map(format => (
                    <button
                      key={format}
                      className={`${styles.formatButton} ${settings.format === format ? styles.active : ''}`}
                      onClick={() => handleFormatChange(format)}
                      disabled={isExporting}
                    >
                      {format.toUpperCase()}
                    </button>
                  ))}
                </div>
                
                {settings.format !== 'png' && (
                  <div className={styles.qualitySlider}>
                    <label>
                      Quality: {Math.round(settings.quality * 100)}%
                      <input
                        type="range"
                        min={0.5}
                        max={1}
                        step={0.01}
                        value={settings.quality}
                        onChange={e => handleQualityChange(Number(e.target.value))}
                        className={styles.slider}
                        disabled={isExporting}
                      />
                    </label>
                  </div>
                )}
              </section>
              
              {/* Background Section */}
              {enableBackgroundOptions && (
                <section className={styles.section}>
                  <h4>Background</h4>
                  <div className={styles.backgroundButtons}>
                    {(['transparent', 'white', 'color'] as const).map(bg => (
                      <button
                        key={bg}
                        className={`${styles.bgButton} ${settings.background === bg ? styles.active : ''}`}
                        onClick={() => handleBackgroundChange(bg)}
                        disabled={isExporting}
                      >
                        {bg === 'transparent' && '⭕ Transparent'}
                        {bg === 'white' && '⬜ White'}
                        {bg === 'color' && '🎨 Custom'}
                      </button>
                    ))}
                  </div>
                  
                  {settings.background === 'color' && (
                    <div className={styles.colorPicker}>
                      <input
                        type="color"
                        value={settings.backgroundColor}
                        onChange={e => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className={styles.colorInput}
                        disabled={isExporting}
                      />
                      <input
                        type="text"
                        value={settings.backgroundColor}
                        onChange={e => setSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className={styles.colorText}
                        disabled={isExporting}
                      />
                    </div>
                  )}
                </section>
              )}
              
              {/* Options Section */}
              <section className={styles.section}>
                <h4>Options</h4>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={settings.preserveScale}
                    onChange={e => setSettings(prev => ({ ...prev, preserveScale: e.target.checked }))}
                    disabled={isExporting}
                  />
                  Preserve Scale (fit content)
                </label>
                
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={settings.antialias}
                    onChange={e => setSettings(prev => ({ ...prev, antialias: e.target.checked }))}
                    disabled={isExporting}
                  />
                  Anti-aliasing
                </label>
              </section>
              
              {/* Progress Bar */}
              {isExporting && (
                <div className={styles.progressSection}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>
                    Exporting... {progress}%
                  </span>
                </div>
              )}
            </div>
            
            <div className={styles.footer}>
              <button
                className={styles.cancelButton}
                onClick={() => setIsOpen(false)}
                disabled={isExporting}
              >
                Cancel
              </button>
              <button
                className={styles.exportButton}
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? 'Exporting...' : `Export ${resolution.width}×${resolution.height}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageExport;

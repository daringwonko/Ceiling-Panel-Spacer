/**
 * Offline Calculation Engine
 * Provides full calculation capabilities without network dependency
 */

// Core calculation classes (simplified from main engine for offline use)
export class Dimensions {
  constructor({ width_mm = 0, length_mm = 0 } = {}) {
    this.width_mm = width_mm;
    this.length_mm = length_mm;
  }
}

export class Gap {
  constructor({ edge_gap_mm = 50, spacing_gap_mm = 0 } = {}) {
    this.edge_gap_mm = edge_gap_mm;
    this.spacing_gap_mm = spacing_gap_mm;
  }
}

export class Material {
  constructor({
    name = 'Standard',
    cost_per_sqm = 15,
    waste_factor = 1.15,
    thickness_mm = 12.5
  } = {}) {
    this.name = name;
    this.cost_per_sqm = cost_per_sqm;
    this.waste_factor = waste_factor;
    this.thickness_mm = thickness_mm;
  }
}

export class LayoutResult {
  constructor({
    panel_count = 1,
    panel_width_mm = 0,
    panel_length_mm = 0,
    total_coverage_sqm = 0,
    total_material_cost = 0,
    layout_efficiency = 0,
    warnings = []
  } = {}) {
    this.panel_count = panel_count;
    this.panel_width_mm = panel_width_mm;
    this.panel_length_mm = panel_length_mm;
    this.total_coverage_sqm = total_coverage_sqm;
    this.total_material_cost = total_material_cost;
    this.layout_efficiency = layout_efficiency;
    this.warnings = warnings;
  }
}

export class OfflineCalculator {
  constructor() {
    this.materials = {
      'Standard': new Material({ name: 'Standard', cost_per_sqm: 15 }),
      'Premium': new Material({ name: 'Premium', cost_per_sqm: 25 }),
      'Moisture Resistant': new Material({ name: 'Moisture Resistant', cost_per_sqm: 20 }),
      'Fire Rated': new Material({ name: 'Fire Rated', cost_per_sqm: 30 }),
      'Acoustic': new Material({ name: 'Acoustic', cost_per_sqm: 35 }),
      'Custom': new Material({ name: 'Custom', cost_per_sqm: 15 })
    };
  }

  /**
   * Calculate optimal panel layout (simplified algorithm for offline use)
   * @param {Dimensions} ceiling - Ceiling dimensions
   * @param {Gap} gap - Gap specifications
   * @param {Material} material - Material properties
   * @returns {LayoutResult} Calculation result
   */
  calculate(ceiling, gap, material) {
    // Validate inputs
    if (ceiling.width_mm <= 0 || ceiling.length_mm <= 0) {
      throw new Error('Ceiling dimensions must be positive');
    }

    if (gap.edge_gap_mm < 0 || gap.spacing_gap_mm < 0) {
      throw new Error('Gap sizes cannot be negative');
    }

    // Calculate available area
    const availableWidth = ceiling.width_mm - (2 * gap.edge_gap_mm);
    const availableLength = ceiling.length_mm - (2 * gap.edge_gap_mm);

    if (availableWidth <= 0 || availableLength <= 0) {
      throw new Error('Edge gaps exceed ceiling dimensions');
    }

    // Simplified panel calculation (optimized for practicality)
    const maxPanelSize = 2400; // Maximum practical panel size
    const aspectRatio = availableLength / availableWidth;

    let panelWidth, panelLength, panelCount;

    if (aspectRatio >= 1) {
      // Landscape orientation
      panelWidth = Math.min(availableWidth, maxPanelSize);
      panelLength = Math.min(availableLength, maxPanelSize * 2);
    } else {
      // Portrait orientation
      panelWidth = Math.min(availableWidth, maxPanelSize * 2);
      panelLength = Math.min(availableLength, maxPanelSize);
    }

    // Calculate panel count
    const cols = Math.ceil(availableWidth / panelWidth);
    const rows = Math.ceil(availableLength / panelLength);
    panelCount = cols * rows;

    // Ensure panels fit within dimensions
    if (panelWidth > availableWidth) {
      panelWidth = availableWidth;
    }
    if (panelLength > availableLength) {
      panelLength = availableLength;
    }

    // Recalculate if adjustments made
    const actualCols = Math.ceil(availableWidth / panelWidth);
    const actualRows = Math.ceil(availableLength / panelLength);
    panelCount = actualCols * actualRows;

    // Calculate totals
    const panelArea = (panelWidth * panelLength) / 1_000_000; // Convert to sqm
    const totalCoverage = panelArea * panelCount;
    const adjustedCoverage = totalCoverage * material.waste_factor;
    const totalCost = adjustedCoverage * material.cost_per_sqm;

    // Calculate efficiency
    const coverageRatio = totalCoverage / ((availableWidth * availableLength) / 1_000_000);
    const layoutEfficiency = Math.min(coverageRatio * 100, 100);

    // Generate warnings for impractical layouts
    const warnings = [];
    if (panelWidth > 2000) {
      warnings.push('Large panel size may be difficult to handle');
    }
    if (panelCount === 1) {
      warnings.push('Single panel layout - consider multi-panel for easier installation');
    }

    return new LayoutResult({
      panel_count: panelCount,
      panel_width_mm: Math.round(panelWidth),
      panel_length_mm: Math.round(panelLength),
      total_coverage_sqm: Math.round(totalCoverage * 100) / 100,
      total_material_cost: Math.round(totalCost * 100) / 100,
      layout_efficiency: Math.round(layoutEfficiency * 10) / 10,
      warnings
    });
  }

  /**
   * Get available materials
   */
  getMaterials() {
    return Object.entries(this.materials).map(([key, material]) => ({
      id: key,
      name: material.name,
      cost_per_sqm: material.cost_per_sqm,
      waste_factor: material.waste_factor
    }));
  }

  /**
   * Calculate with string dimensions (e.g., "4.8m" or "4800mm")
   */
  calculateFromStrings(widthStr, lengthStr, edgeGapMm = 50, materialKey = 'Standard') {
    const widthMm = this.parseDimension(widthStr);
    const lengthMm = this.parseDimension(lengthStr);
    
    const dimensions = new Dimensions({ width_mm: widthMm, length_mm: lengthMm });
    const gap = new Gap({ edge_gap_mm: edgeGapMm });
    const material = this.materials[materialKey] || this.materials['Standard'];

    return this.calculate(dimensions, gap, material);
  }

  /**
   * Parse dimension string to millimeters
   */
  parseDimension(str) {
    if (!str) return 0;
    
    str = str.toLowerCase().trim();
    
    if (str.endsWith('mm')) {
      return parseFloat(str) || 0;
    }
    
    if (str.endsWith('cm')) {
      return (parseFloat(str) || 0) * 10;
    }
    
    if (str.endsWith('m')) {
      return (parseFloat(str) || 0) * 1000;
    }
    
    // Assume millimeters if no unit
    return parseFloat(str) || 0;
  }

  /**
   * Format dimension for display
   */
  formatDimension(mm) {
    if (mm >= 1000) {
      return `${(mm / 1000).toFixed(2)}m`;
    }
    return `${Math.round(mm)}mm`;
  }

  /**
   * Quick estimate calculator
   */
  quickEstimate(ceilingAreaSqm, materialKey = 'Standard') {
    const material = this.materials[materialKey] || this.materials['Standard'];
    const adjustedArea = ceilingAreaSqm * material.waste_factor;
    const cost = adjustedArea * material.cost_per_sqm;
    
    return {
      area_sqm: ceilingAreaSqm,
      material: material.name,
      waste_factor: material.waste_factor,
      adjusted_area_sqm: Math.round(adjustedArea * 100) / 100,
      cost_per_sqm: material.cost_per_sqm,
      estimated_cost: Math.round(cost * 100) / 100
    };
  }
}

// Export singleton
export const offlineCalculator = new OfflineCalculator();

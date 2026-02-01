/**
 * Schedule Types for BIM Workbench
 * 
 * Defines schedule structures for door, window, material, and custom schedules
 */

// ============================================================================
// Schedule Definition Types
// ============================================================================

/**
 * Schedule type enumeration
 */
export type ScheduleType = 'door' | 'window' | 'material' | 'custom';

/**
 * Column definition for a schedule table
 */
export interface ScheduleColumn {
  /** Unique key for the column */
  key: string;
  /** Column header text */
  header: string;
  /** Column width in pixels */
  width: number;
  /** Function to extract value from a BIM object */
  accessor: (obj: BIMObject) => any;
  /** Optional format function for display */
  format?: (value: any) => string;
  /** Optional sort function */
  sort?: (a: any, b: any) => number;
}

/**
 * Filter definition for schedule data
 */
export interface ScheduleFilter {
  /** Property key to filter on */
  key: string;
  /** Operator for comparison */
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';
  /** Value to compare against */
  value: any;
}

/**
 * Sort definition for schedule data
 */
export interface ScheduleSort {
  /** Column key to sort by */
  key: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Schedule definition interface
 */
export interface ScheduleDefinition {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Schedule type */
  type: ScheduleType;
  /** Column definitions */
  columns: ScheduleColumn[];
  /** Optional filter to apply */
  filter?: (obj: BIMObject) => boolean;
  /** Optional filter definitions for UI */
  filters?: ScheduleFilter[];
  /** Default sort */
  defaultSort?: ScheduleSort;
  /** Description */
  description?: string;
}

// ============================================================================
// Schedule Data Types
// ============================================================================

/**
 * Row data for a schedule table
 */
export interface ScheduleRow {
  /** Unique row identifier */
  id: string;
  /** Reference to source BIM object */
  objectId: string;
  /** Count (usually 1, can be aggregated) */
  count: number;
  /** Object type */
  type: string;
  /** Formatted dimensions string */
  dimensions: string;
  /** Material name */
  material: string;
  /** Additional properties */
  [key: string]: any;
}

/**
 * Schedule data with metadata
 */
export interface ScheduleData {
  /** Schedule definition */
  definition: ScheduleDefinition;
  /** Row data */
  rows: ScheduleRow[];
  /** Total count */
  totalCount: number;
  /** Generated timestamp */
  generated: string;
  /** Summary statistics */
  summary?: {
    totalItems: number;
    totalArea?: number;
    totalVolume?: number;
    byType?: Record<string, number>;
  };
}

// ============================================================================
// BIM Object Types (simplified for schedules)
// ============================================================================

/**
 * Simplified BIM object for schedule calculations
 */
export interface BIMObject {
  /** Unique identifier */
  id: string;
  /** Object type */
  type: string;
  /** Display name */
  name: string;
  /** Material name */
  material: string;
  /** Layer name */
  layer: string;
  /** Object properties */
  properties: Record<string, any>;
  /** Geometry data */
  geometry?: {
    width?: number;
    height?: number;
    length?: number;
    thickness?: number;
    area?: number;
    volume?: number;
  };
  /** Position */
  position?: {
    x: number;
    y: number;
    z: number;
  };
}

// ============================================================================
// Quantity Calculation Types
// ============================================================================

/**
 * Area calculation result
 */
export interface AreaCalculation {
  objectId: string;
  objectName: string;
  objectType: string;
  area: number;
  unit: string;
}

/**
 * Volume calculation result
 */
export interface VolumeCalculation {
  objectId: string;
  objectName: string;
  objectType: string;
  volume: number;
  unit: string;
}

/**
 * Material quantity result
 */
export interface MaterialQuantity {
  materialName: string;
  objectCount: number;
  totalArea: number;
  totalVolume: number;
  unitArea: string;
  unitVolume: string;
}

/**
 * Quantity takeoff result
 */
export interface QuantityResult {
  category: string;
  item: string;
  count: number;
  unit: string;
  total: number;
  unitCost?: number;
  totalCost?: number;
}

// ============================================================================
// Predefined Schedule Definitions
// ============================================================================

/**
 * Door schedule definition
 */
export const doorSchedule: ScheduleDefinition = {
  id: 'door-schedule',
  name: 'Door Schedule',
  type: 'door',
  description: 'Complete door schedule with dimensions and materials',
  columns: [
    { key: 'count', header: 'Count', width: 60, accessor: () => 1 },
    { key: 'type', header: 'Type', width: 100, accessor: (obj) => obj.properties?.type || 'Standard' },
    { key: 'width', header: 'Width', width: 80, accessor: (obj) => `${obj.geometry?.width || obj.properties?.width || 900}mm` },
    { key: 'height', header: 'Height', width: 80, accessor: (obj) => `${obj.geometry?.height || obj.properties?.height || 2100}mm` },
    { key: 'material', header: 'Material', width: 120, accessor: (obj) => obj.material || '-' },
    { key: 'fireRating', header: 'Fire Rating', width: 100, accessor: (obj) => obj.properties?.fireRating || '-' },
  ],
  filter: (obj) => obj.type === 'door',
};

/**
 * Window schedule definition
 */
export const windowSchedule: ScheduleDefinition = {
  id: 'window-schedule',
  name: 'Window Schedule',
  type: 'window',
  description: 'Window schedule with sizes and glazing',
  columns: [
    { key: 'count', header: 'Count', width: 60, accessor: () => 1 },
    { key: 'type', header: 'Type', width: 100, accessor: (obj) => obj.properties?.type || 'Fixed' },
    { key: 'width', header: 'Width', width: 80, accessor: (obj) => `${obj.geometry?.width || obj.properties?.width || 1200}mm` },
    { key: 'height', header: 'Height', width: 80, accessor: (obj) => `${obj.geometry?.height || obj.properties?.height || 1200}mm` },
    { key: 'glazing', header: 'Glazing', width: 100, accessor: (obj) => obj.properties?.glazing || 'Double' },
    { key: 'material', header: 'Frame Material', width: 120, accessor: (obj) => obj.material || 'Aluminum' },
  ],
  filter: (obj) => obj.type === 'window',
};

/**
 * Material schedule definition
 */
export const materialSchedule: ScheduleDefinition = {
  id: 'material-schedule',
  name: 'Material Schedule',
  type: 'material',
  description: 'Material quantities by type',
  columns: [
    { key: 'material', header: 'Material', width: 150, accessor: (obj) => obj.material },
    { key: 'objectCount', header: 'Objects', width: 80, accessor: () => 1 },
    { key: 'totalArea', header: 'Total Area', width: 100, accessor: (obj) => {
      const area = obj.geometry?.area || 
        (obj.geometry?.width && obj.geometry?.height ? 
          (obj.geometry.width * obj.geometry.height) / 1000000 : 0);
      return `${area.toFixed(2)} m²`;
    }},
    { key: 'totalVolume', header: 'Total Volume', width: 100, accessor: (obj) => {
      const volume = obj.geometry?.volume || 
        (obj.geometry?.width && obj.geometry?.height && obj.geometry?.thickness ?
          (obj.geometry.width * obj.geometry.height * obj.geometry.thickness) / 1000000000 : 0);
      return volume > 0 ? `${volume.toFixed(3)} m³` : '-';
    }},
  ],
  defaultSort: { key: 'material', direction: 'asc' },
};

/**
 * All predefined schedules
 */
export const predefinedSchedules: ScheduleDefinition[] = [
  doorSchedule,
  windowSchedule,
  materialSchedule,
];

// ============================================================================
// Export/Report Types
// ============================================================================

/**
 * CSV export options
 */
export interface CSVExportOptions {
  /** Include headers */
  includeHeaders: boolean;
  /** Field delimiter */
  delimiter: string;
  /** Quote strings */
  quoteStrings: boolean;
}

/**
 * Project report structure
 */
export interface ProjectReport {
  /** Report metadata */
  metadata: {
    projectName: string;
    generated: string;
    author: string;
  };
  /** Project summary */
  summary: {
    totalObjects: number;
    totalMaterials: number;
    totalLayers: number;
    siteArea?: number;
    buildingArea?: number;
  };
  /** Schedule data */
  schedules: {
    doors: ScheduleData;
    windows: ScheduleData;
    materials: ScheduleData;
  };
  /** Quantity takeoff */
  quantities: QuantityResult[];
}

/**
 * Excel export request
 */
export interface ExcelExportRequest {
  /** Schedule definition */
  schedule: ScheduleDefinition;
  /** Schedule data */
  data: ScheduleRow[];
  /** Report title */
  title?: string;
  /** Include summary sheet */
  includeSummary?: boolean;
}

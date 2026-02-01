/**
 * useSchedules Hook
 * 
 * React hook for managing BIM schedules including generation, filtering, and export
 */

import { useState, useCallback, useMemo } from 'react';
import {
  ScheduleDefinition,
  ScheduleData,
  ScheduleRow,
  ScheduleFilter,
  ScheduleSort,
  BIMObject,
  predefinedSchedules,
  ScheduleColumn,
} from '../types/schedules';

// ============================================================================
// Schedule Generation Functions
// ============================================================================

/**
 * Generate schedule data from BIM objects
 */
function generateScheduleData(
  definition: ScheduleDefinition,
  objects: BIMObject[]
): ScheduleData {
  // Filter objects based on schedule filter
  const filteredObjects = definition.filter
    ? objects.filter(definition.filter)
    : objects;

  // Generate rows
  const rows: ScheduleRow[] = filteredObjects.map((obj, index) => {
    const row: ScheduleRow = {
      id: `${definition.id}-row-${index}`,
      objectId: obj.id,
      count: 1,
      type: obj.properties?.type || obj.type,
      dimensions: formatDimensions(obj),
      material: obj.material || '-',
    };

    // Add column values
    definition.columns.forEach((col) => {
      row[col.key] = col.format
        ? col.format(col.accessor(obj))
        : col.accessor(obj);
    });

    return row;
  });

  // Apply default sort
  if (definition.defaultSort) {
    rows.sort((a, b) => {
      const aVal = a[definition.defaultSort!.key];
      const bVal = b[definition.defaultSort!.key];
      const direction = definition.defaultSort!.direction === 'asc' ? 1 : -1;
      if (aVal < bVal) return -1 * direction;
      if (aVal > bVal) return 1 * direction;
      return 0;
    });
  }

  // Generate summary
  const summary = calculateSummary(rows, definition.type);

  return {
    definition,
    rows,
    totalCount: rows.length,
    generated: new Date().toISOString(),
    summary,
  };
}

/**
 * Format dimensions from object geometry
 */
function formatDimensions(obj: BIMObject): string {
  const width = obj.geometry?.width || obj.properties?.width;
  const height = obj.geometry?.height || obj.properties?.height;
  const length = obj.geometry?.length || obj.properties?.length;
  const thickness = obj.geometry?.thickness || obj.properties?.thickness;

  if (width && height) {
    return `${width} × ${height}mm`;
  }
  if (width && height && length) {
    return `${width} × ${height} × ${length}mm`;
  }
  if (thickness && length) {
    return `${thickness} × ${length}mm`;
  }
  return '-';
}

/**
 * Calculate summary statistics for schedule
 */
function calculateSummary(
  rows: ScheduleRow[],
  type: string
): ScheduleData['summary'] {
  const byType: Record<string, number> = {};
  let totalArea = 0;
  let totalVolume = 0;

  rows.forEach((row) => {
    byType[row.type] = (byType[row.type] || 0) + row.count;

    // Try to extract area from dimensions
    if (row.dimensions && row.dimensions.includes('×')) {
      const parts = row.dimensions
        .replace('mm', '')
        .split('×')
        .map((p) => parseFloat(p.trim()));
      if (parts.length === 2) {
        totalArea += (parts[0] * parts[1]) / 1000000; // mm² to m²
      }
    }
  });

  return {
    totalItems: rows.length,
    totalArea: totalArea > 0 ? totalArea : undefined,
    totalVolume: totalVolume > 0 ? totalVolume : undefined,
    byType,
  };
}

// ============================================================================
// Filter and Sort Functions
// ============================================================================

/**
 * Apply filters to schedule data
 */
function applyFilters(
  rows: ScheduleRow[],
  filters: ScheduleFilter[]
): ScheduleRow[] {
  if (!filters || filters.length === 0) return rows;

  return rows.filter((row) => {
    return filters.every((filter) => {
      const value = row[filter.key];
      switch (filter.operator) {
        case 'equals':
          return value === filter.value;
        case 'contains':
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'gt':
          return Number(value) > Number(filter.value);
        case 'lt':
          return Number(value) < Number(filter.value);
        case 'gte':
          return Number(value) >= Number(filter.value);
        case 'lte':
          return Number(value) <= Number(filter.value);
        default:
          return true;
      }
    });
  });
}

/**
 * Sort schedule data
 */
function applySort(
  rows: ScheduleRow[],
  sort: ScheduleSort | undefined,
  columns: ScheduleColumn[]
): ScheduleRow[] {
  if (!sort) return rows;

  const sorted = [...rows];
  sorted.sort((a, b) => {
    const aVal = a[sort.key];
    const bVal = b[sort.key];

    // Try to use custom sort function from column
    const column = columns.find((c) => c.key === sort.key);
    if (column?.sort) {
      return column.sort(aVal, bVal) * (sort.direction === 'asc' ? 1 : -1);
    }

    // Default numeric/string comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return (aVal - bVal) * (sort.direction === 'asc' ? 1 : -1);
    }
    return String(aVal).localeCompare(String(bVal)) * (sort.direction === 'asc' ? 1 : -1);
  });

  return sorted;
}

// ============================================================================
// Hook Interface
// ============================================================================

/**
 * Hook return type
 */
export interface UseSchedulesReturn {
  // State
  schedules: ScheduleDefinition[];
  activeSchedule: ScheduleDefinition | null;
  scheduleData: ScheduleData | null;
  filters: ScheduleFilter[];
  sort: ScheduleSort | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setActiveSchedule: (schedule: ScheduleDefinition | null) => void;
  generateSchedule: (objects: BIMObject[]) => void;
  addFilter: (filter: ScheduleFilter) => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;
  setSort: (sort: ScheduleSort) => void;
  clearSort: () => void;
  addCustomSchedule: (schedule: ScheduleDefinition) => void;
  removeCustomSchedule: (id: string) => void;
  refreshSchedule: (objects: BIMObject[]) => void;
}

/**
 * useSchedules hook for managing BIM schedules
 * 
 * @param {BIMObject[]} objects - Array of BIM objects to generate schedules from
 * @returns {UseSchedulesReturn} Hook interface
 * 
 * @example
 * const {
 *   schedules,
 *   activeSchedule,
 *   scheduleData,
 *   setActiveSchedule,
 *   generateSchedule,
 * } = useSchedules(objects);
 */
export function useSchedules(
  objects: BIMObject[] = []
): UseSchedulesReturn {
  // State
  const [schedules, setSchedules] = useState<ScheduleDefinition[]>(predefinedSchedules);
  const [customSchedules, setCustomSchedules] = useState<ScheduleDefinition[]>([]);
  const [activeSchedule, setActiveSchedule] = useState<ScheduleDefinition | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [filters, setFilters] = useState<ScheduleFilter[]>([]);
  const [sort, setSortState] = useState<ScheduleSort | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All schedules (predefined + custom)
  const allSchedules = useMemo(
    () => [...schedules, ...customSchedules],
    [schedules, customSchedules]
  );

  // Generate schedule data
  const generateSchedule = useCallback(
    (bimObjects: BIMObject[]) => {
      if (!activeSchedule) {
        setScheduleData(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = generateScheduleData(activeSchedule, bimObjects);
        setScheduleData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate schedule');
        setScheduleData(null);
      } finally {
        setIsLoading(false);
      }
    },
    [activeSchedule]
  );

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    if (!scheduleData) return null;

    let rows = applyFilters(scheduleData.rows, filters);
    rows = applySort(rows, sort, scheduleData.definition.columns);

    return {
      ...scheduleData,
      rows,
      totalCount: rows.length,
    };
  }, [scheduleData, filters, sort]);

  // Actions
  const addFilter = useCallback((filter: ScheduleFilter) => {
    setFilters((prev) => [...prev, filter]);
  }, []);

  const removeFilter = useCallback((index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
  }, []);

  const setSort = useCallback((newSort: ScheduleSort) => {
    setSortState(newSort);
  }, []);

  const clearSort = useCallback(() => {
    setSortState(null);
  }, []);

  const addCustomSchedule = useCallback((schedule: ScheduleDefinition) => {
    setCustomSchedules((prev) => [...prev, schedule]);
  }, []);

  const removeCustomSchedule = useCallback((id: string) => {
    setCustomSchedules((prev) => prev.filter((s) => s.id !== id));
    if (activeSchedule?.id === id) {
      setActiveSchedule(null);
      setScheduleData(null);
    }
  }, [activeSchedule]);

  const refreshSchedule = useCallback(
    (bimObjects: BIMObject[]) => {
      generateSchedule(bimObjects);
    },
    [generateSchedule]
  );

  // Auto-generate when objects or active schedule changes
  if (objects && activeSchedule && !scheduleData) {
    generateSchedule(objects);
  }

  return {
    schedules: allSchedules,
    activeSchedule,
    scheduleData: filteredData,
    filters,
    sort,
    isLoading,
    error,
    setActiveSchedule,
    generateSchedule,
    addFilter,
    removeFilter,
    clearFilters,
    setSort,
    clearSort,
    addCustomSchedule,
    removeCustomSchedule,
    refreshSchedule,
  };
}

export default useSchedules;

/**
 * Schedule Export Utilities
 * 
 * CSV and Excel export functionality for schedules
 */

import {
  ScheduleDefinition,
  ScheduleRow,
  CSVExportOptions,
  ExcelExportRequest,
  ProjectReport,
} from '../types/schedules';

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Escape CSV field value
 */
function escapeCSVField(value: any, options: CSVExportOptions): string {
  const str = String(value ?? '');
  if (options.quoteStrings || str.includes(options.delimiter) || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Export schedule data to CSV format
 */
export function exportScheduleToCSV(
  definition: ScheduleDefinition,
  data: ScheduleRow[],
  options?: Partial<CSVExportOptions>
): string {
  const opts: CSVExportOptions = {
    includeHeaders: true,
    delimiter: ',',
    quoteStrings: true,
    ...options,
  };

  const lines: string[] = [];

  // Add headers
  if (opts.includeHeaders) {
    const headers = definition.columns.map((col) => escapeCSVField(col.header, opts));
    lines.push(headers.join(opts.delimiter));
  }

  // Add data rows
  data.forEach((row) => {
    const values = definition.columns.map((col) =>
      escapeCSVField(row[col.key], opts)
    );
    lines.push(values.join(opts.delimiter));
  });

  return lines.join('\n');
}

/**
 * Download schedule as CSV file
 */
export function downloadScheduleCSV(
  definition: ScheduleDefinition,
  data: ScheduleRow[],
  filename?: string
): void {
  const csv = exportScheduleToCSV(definition, data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${definition.name.replace(/\s+/g, '_')}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Excel Export (via API)
// ============================================================================

/**
 * Export schedule to Excel via backend API
 */
export async function exportScheduleToExcel(
  definition: ScheduleDefinition,
  data: ScheduleRow[],
  title?: string
): Promise<Blob> {
  const requestBody: ExcelExportRequest = {
    schedule: definition,
    data: data,
    title: title || definition.name,
    includeSummary: true,
  };

  const response = await fetch('/api/bim/schedules/export/excel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Excel export failed: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Download schedule as Excel file
 */
export async function downloadScheduleExcel(
  definition: ScheduleDefinition,
  data: ScheduleRow[],
  filename?: string
): Promise<void> {
  const blob = await exportScheduleToExcel(definition, data);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${definition.name.replace(/\s+/g, '_')}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// Project Report Generation
// ============================================================================

/**
 * Generate full project report
 */
export async function generateProjectReport(
  project: {
    name: string;
    author?: string;
  },
  objects: any[],
  options: {
    includeSchedules?: string[];
    includeQuantities?: boolean;
  } = {}
): Promise<ProjectReport> {
  const { includeSchedules = ['door', 'window', 'material'], includeQuantities = true } = options;

  const response = await fetch('/api/bim/schedules/report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      project: {
        name: project.name,
        author: project.author || 'Unknown',
      },
      objects: objects,
      include_schedules: includeSchedules,
      include_quantities: includeQuantities,
    }),
  });

  if (!response.ok) {
    throw new Error(`Report generation failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Download project report
 */
export async function downloadProjectReport(
  project: { name: string; author?: string },
  objects: any[],
  format: 'json' | 'csv' = 'json'
): Promise<void> {
  const report = await generateProjectReport(project, objects);

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '_')}_report.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Generate CSV summary
    const lines: string[] = [];
    
    // Summary
    lines.push('PROJECT SUMMARY');
    lines.push(`Project Name,${report.metadata.projectName}`);
    lines.push(`Generated,${report.metadata.generated}`);
    lines.push(`Author,${report.metadata.author}`);
    lines.push(`Total Objects,${report.summary.totalObjects}`);
    lines.push(`Total Materials,${report.summary.totalMaterials}`);
    lines.push('');
    
    // Quantities
    if (report.quantities) {
      lines.push('QUANTITY TAKEOFF');
      lines.push('Category,Item,Count,Unit,Total');
      report.quantities.forEach((q: any) => {
        lines.push(`${q.category},${q.item},${q.count},${q.unit},${q.total}`);
      });
    }
    
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.replace(/\s+/g, '_')}_report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// ============================================================================
// Batch Export
// ============================================================================

/**
 * Export multiple schedules at once
 */
export async function exportMultipleSchedules(
  schedules: Array<{ definition: ScheduleDefinition; data: ScheduleRow[] }>,
  format: 'csv' | 'excel' = 'csv'
): Promise<void> {
  for (const { definition, data } of schedules) {
    if (format === 'csv') {
      downloadScheduleCSV(definition, data);
    } else {
      await downloadScheduleExcel(definition, data);
    }
    
    // Small delay between downloads
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * Export all schedules for a project
 */
export async function exportAllSchedules(
  objects: any[],
  format: 'csv' | 'excel' = 'csv'
): Promise<void> {
  // Generate schedules via API
  const response = await fetch('/api/bim/schedules/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      schedule_type: 'all',
      objects: objects,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate schedules: ${response.statusText}`);
  }

  // Export each schedule type
  const schedules = await response.json();
  
  for (const scheduleType of ['door', 'window', 'material']) {
    if (schedules[scheduleType] && schedules[scheduleType].rows) {
      const definition: ScheduleDefinition = {
        id: `${scheduleType}-schedule`,
        name: `${scheduleType.charAt(0).toUpperCase() + scheduleType.slice(1)} Schedule`,
        type: scheduleType as any,
        columns: [],
      };
      
      const data = schedules[scheduleType].rows;
      
      if (format === 'csv') {
        downloadScheduleCSV(definition, data);
      } else {
        await downloadScheduleExcel(definition, data);
      }
    }
  }
}

export default {
  exportScheduleToCSV,
  downloadScheduleCSV,
  exportScheduleToExcel,
  downloadScheduleExcel,
  generateProjectReport,
  downloadProjectReport,
  exportMultipleSchedules,
  exportAllSchedules,
};

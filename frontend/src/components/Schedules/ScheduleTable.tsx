/**
 * Schedule Table Component
 * 
 * Tabular display of schedule data with sorting and export functionality
 */

import React, { useState, useCallback } from 'react';
import {
  ScheduleDefinition,
  ScheduleRow,
  CSVExportOptions,
} from '../types/schedules';
import './ScheduleTable.css';

// ============================================================================
// Component Props
// ============================================================================

interface ScheduleTableProps {
  /** Schedule definition */
  definition: ScheduleDefinition;
  /** Schedule row data */
  data: ScheduleRow[];
  /** Enable row selection */
  selectable?: boolean;
  /** Callback when row is selected */
  onSelectRow?: (row: ScheduleRow) => void;
  /** Callback when export is requested */
  onExport?: (format: 'csv' | 'excel') => void;
}

// ============================================================================
// Utility Functions
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
export function exportToCSV(
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
 * Download CSV file
 */
export function downloadCSV(
  definition: ScheduleDefinition,
  data: ScheduleRow[],
  filename?: string
): void {
  const csv = exportToCSV(definition, data);
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
// Sub-components
// ============================================================================

/**
 * Table header cell with sorting
 */
function TableHeader({
  column,
  sortKey,
  sortDirection,
  onSort,
}: {
  column: ScheduleDefinition['columns'][0];
  sortKey: string | null;
  sortDirection: 'asc' | 'desc' | null;
  onSort: (key: string) => void;
}) {
  const isSorted = sortKey === column.key;
  const sortIndicator = isSorted
    ? sortDirection === 'asc'
      ? ' ↑'
      : ' ↓'
    : '';

  return (
    <th
      style={{ width: column.width }}
      onClick={() => onSort(column.key)}
      className={isSorted ? 'sorted' : ''}
    >
      {column.header}
      {sortIndicator && <span className="sort-indicator">{sortIndicator}</span>}
    </th>
  );
}

/**
 * Table row with selection
 */
function TableRow({
  row,
  columns,
  isSelected,
  onSelect,
}: {
  row: ScheduleRow;
  columns: ScheduleDefinition['columns'];
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <tr className={isSelected ? 'selected' : ''} onClick={onSelect}>
      {columns.map((col) => (
        <td key={col.key} title={String(row[col.key])}>
          {row[col.key] ?? '-'}
        </td>
      ))}
    </tr>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Schedule Table Component
 * 
 * @param {ScheduleTableProps} props - Component props
 * @returns {React.ReactElement} Component
 * 
 * @example
 * <ScheduleTable
 *   definition={doorSchedule}
 *   data={doorData}
 *   selectable={true}
 *   onSelectRow={(row) => selectDoor(row)}
 *   onExport={(format) => exportSchedule(format)}
 * />
 */
export function ScheduleTable({
  definition,
  data,
  selectable = false,
  onSelectRow,
  onExport,
}: ScheduleTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(
    definition.defaultSort?.key || null
  );
  const [sortDirection, setSortDirection] = useState<
    'asc' | 'desc' | null
  >(definition.defaultSort?.direction || null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(25);

  // Handle sort
  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        // Toggle direction
        setSortDirection((prev) =>
          prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
        );
        if (sortDirection === 'desc') {
          setSortKey(null);
        }
      } else {
        setSortKey(key);
        setSortDirection('asc');
      }
    },
    [sortKey, sortDirection]
  );

  // Handle row selection
  const handleRowSelect = useCallback(
    (row: ScheduleRow) => {
      if (!selectable) return;

      setSelectedRows((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(row.id)) {
          newSet.delete(row.id);
        } else {
          newSet.add(row.id);
        }
        return newSet;
      });

      onSelectRow?.(row);
    },
    [selectable, onSelectRow]
  );

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((r) => r.id)));
    }
  }, [selectedRows.size, data]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal ?? '').toLowerCase();
      const bStr = String(bVal ?? '').toLowerCase();
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDirection]);

  // Paginate data
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  // Total pages
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  // Handle export
  const handleExport = useCallback(
    (format: 'csv' | 'excel') => {
      onExport?.(format);
    },
    [onExport]
  );

  // Handle CSV download
  const handleDownloadCSV = useCallback(() => {
    downloadCSV(definition, data);
  }, [definition, data]);

  // Empty state
  if (data.length === 0) {
    return (
      <div className="schedule-table-container">
        <div className="schedule-table-empty">
          <p>No data available for this schedule</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-table-container">
      {/* Table Controls */}
      <div className="table-controls">
        <div className="table-info">
          <span>
            Showing {paginatedData.length} of {data.length} rows
          </span>
          {selectedRows.size > 0 && (
            <span className="selected-count">
              {selectedRows.size} selected
            </span>
          )}
        </div>
        <div className="table-actions">
          <button
            className="table-action-btn"
            onClick={handleDownloadCSV}
            title="Download as CSV"
          >
            📥 CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="schedule-table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              {selectable && (
                <th className="checkbox-column">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    indeterminate={
                      selectedRows.size > 0 && selectedRows.size < data.length
                    }
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {definition.columns.map((col) => (
                <TableHeader
                  key={col.key}
                  column={col}
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <TableRow
                key={row.id}
                row={row}
                columns={definition.columns}
                isSelected={selectedRows.has(row.id)}
                onSelect={() => handleRowSelect(row)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="table-pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            ««
          </button>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            «
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            »
          </button>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            »»
          </button>
        </div>
      )}
    </div>
  );
}

export default ScheduleTable;

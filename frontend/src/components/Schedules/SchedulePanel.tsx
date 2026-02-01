/**
 * Schedule Panel Component
 * 
 * Main panel for managing and displaying BIM schedules
 */

import React, { useState } from 'react';
import { useSchedules } from '../hooks/useSchedules';
import {
  ScheduleDefinition,
  ScheduleRow,
  BIMObject,
  ScheduleFilter,
} from '../types/schedules';
import { ScheduleTable } from './ScheduleTable';
import './SchedulePanel.css';

// ============================================================================
// Component Props
// ============================================================================

interface SchedulePanelProps {
  /** Array of BIM objects to generate schedules from */
  objects: BIMObject[];
  /** Optional initial schedule to show */
  initialScheduleId?: string;
  /** Callback when schedule is exported */
  onExport?: (schedule: ScheduleDefinition, data: ScheduleRow[]) => void;
  /** Callback when report is generated */
  onGenerateReport?: () => void;
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Schedule list item
 */
function ScheduleListItem({
  schedule,
  isActive,
  onClick,
}: {
  schedule: ScheduleDefinition;
  isActive: boolean;
  onClick: () => void;
}) {
  const typeIcons: Record<string, string> = {
    door: '🚪',
    window: '🪟',
    material: '📦',
    custom: '📋',
  };

  return (
    <div
      className={`schedule-list-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <span className="schedule-icon">{typeIcons[schedule.type] || '📋'}</span>
      <div className="schedule-info">
        <span className="schedule-name">{schedule.name}</span>
        <span className="schedule-type">{schedule.type}</span>
      </div>
    </div>
  );
}

/**
 * Filter row component
 */
function FilterRow({
  filter,
  columns,
  onChange,
  onRemove,
}: {
  filter: ScheduleFilter;
  columns: ScheduleDefinition['columns'];
  onChange: (filter: ScheduleFilter) => void;
  onRemove: () => void;
}) {
  const columnOptions = columns.map((col) => ({
    value: col.key,
    label: col.header,
  }));

  const operatorOptions = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'gt', label: 'Greater than' },
    { value: 'lt', label: 'Less than' },
    { value: 'gte', label: 'Greater or equal' },
    { value: 'lte', label: 'Less or equal' },
  ];

  return (
    <div className="filter-row">
      <select
        value={filter.key}
        onChange={(e) => onChange({ ...filter, key: e.target.value })}
        className="filter-select"
      >
        <option value="">Select column...</option>
        {columnOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        value={filter.operator}
        onChange={(e) =>
          onChange({
            ...filter,
            operator: e.target.value as ScheduleFilter['operator'],
          })
        }
        className="filter-select"
      >
        {operatorOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={filter.value}
        onChange={(e) => onChange({ ...filter, value: e.target.value })}
        placeholder="Value..."
        className="filter-input"
      />
      <button onClick={onRemove} className="filter-remove" title="Remove filter">
        ✕
      </button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Schedule Panel Component
 * 
 * @param {SchedulePanelProps} props - Component props
 * @returns {React.ReactElement} Component
 * 
 * @example
 * <SchedulePanel
 *   objects={objects}
 *   initialScheduleId="door-schedule"
 *   onExport={(schedule, data) => exportToCSV(schedule, data)}
 * />
 */
export function SchedulePanel({
  objects,
  initialScheduleId,
  onExport,
  onGenerateReport,
}: SchedulePanelProps) {
  const {
    schedules,
    activeSchedule,
    scheduleData,
    filters,
    sort,
    isLoading,
    error,
    setActiveSchedule,
    addFilter,
    removeFilter,
    clearFilters,
    setSort,
    clearSort,
  } = useSchedules(objects);

  // Set initial schedule
  React.useEffect(() => {
    if (initialScheduleId && !activeSchedule) {
      const schedule = schedules.find((s) => s.id === initialScheduleId);
      if (schedule) {
        setActiveSchedule(schedule);
      }
    }
  }, [initialScheduleId, activeSchedule, schedules, setActiveSchedule]);

  // Refresh when objects change
  React.useEffect(() => {
    if (activeSchedule && objects.length > 0) {
      // regenerate is handled by the hook
    }
  }, [objects, activeSchedule]);

  const handleExportCSV = () => {
    if (activeSchedule && scheduleData && onExport) {
      onExport(activeSchedule, scheduleData.rows);
    }
  };

  const handleExportExcel = () => {
    if (activeSchedule && scheduleData && onExport) {
      onExport(activeSchedule, scheduleData.rows);
      // Excel export would be handled separately
    }
  };

  const handleAddFilter = () => {
    if (activeSchedule && activeSchedule.columns.length > 0) {
      addFilter({
        key: activeSchedule.columns[0].key,
        operator: 'contains',
        value: '',
      });
    }
  };

  if (schedules.length === 0) {
    return (
      <div className="schedule-panel">
        <div className="schedule-empty">
          <p>No schedules available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-panel">
      {/* Header */}
      <div className="schedule-header">
        <h3>📊 Schedules</h3>
        {onGenerateReport && (
          <button
            className="schedule-action-btn"
            onClick={onGenerateReport}
            title="Generate Project Report"
          >
            📄 Report
          </button>
        )}
      </div>

      {/* Schedule List */}
      <div className="schedule-list">
        <h4>Available Schedules</h4>
        {schedules.map((schedule) => (
          <ScheduleListItem
            key={schedule.id}
            schedule={schedule}
            isActive={activeSchedule?.id === schedule.id}
            onClick={() => setActiveSchedule(schedule)}
          />
        ))}
      </div>

      {/* Active Schedule Details */}
      {activeSchedule && scheduleData && (
        <div className="schedule-content">
          {/* Schedule Title */}
          <div className="schedule-title">
            <h4>{activeSchedule.name}</h4>
            <span className="schedule-count">
              {scheduleData.totalCount} items
            </span>
          </div>

          {/* Export Buttons */}
          <div className="schedule-actions">
            <button
              className="schedule-action-btn"
              onClick={handleExportCSV}
              disabled={scheduleData.rows.length === 0}
            >
              📥 CSV
            </button>
            <button
              className="schedule-action-btn"
              onClick={handleExportExcel}
              disabled={scheduleData.rows.length === 0}
            >
              📊 Excel
            </button>
          </div>

          {/* Filters */}
          <div className="schedule-filters">
            <div className="filters-header">
              <h5>Filters</h5>
              <div className="filters-actions">
                <button
                  className="filter-add-btn"
                  onClick={handleAddFilter}
                >
                  + Add Filter
                </button>
                {filters.length > 0 && (
                  <button
                    className="filter-clear-btn"
                    onClick={clearFilters}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
            {filters.length > 0 && (
              <div className="filters-list">
                {filters.map((filter, index) => (
                  <FilterRow
                    key={index}
                    filter={filter}
                    columns={activeSchedule.columns}
                    onChange={(newFilter) => {
                      const newFilters = [...filters];
                      newFilters[index] = newFilter;
                      // Update filters in parent
                    }}
                    onRemove={() => removeFilter(index)}
                  />
                ))}
              </div>
            )}
            {filters.length === 0 && (
              <p className="filters-empty">No filters applied</p>
            )}
          </div>

          {/* Sort Controls */}
          <div className="schedule-sort">
            <h5>Sort By</h5>
            <select
              value={sort?.key || ''}
              onChange={(e) =>
                setSort({
                  key: e.target.value,
                  direction: sort?.direction === 'asc' ? 'desc' : 'asc',
                })
              }
              className="sort-select"
            >
              <option value="">Default</option>
              {activeSchedule.columns.map((col) => (
                <option key={col.key} value={col.key}>
                  {col.header}
                </option>
              ))}
            </select>
            {sort && (
              <button className="sort-direction" onClick={clearSort}>
                {sort.direction === 'asc' ? '↑' : '↓'}
              </button>
            )}
          </div>

          {/* Summary */}
          {scheduleData.summary && (
            <div className="schedule-summary">
              <h5>Summary</h5>
              <div className="summary-stats">
                <span>Total: {scheduleData.summary.totalItems}</span>
                {scheduleData.summary.totalArea && (
                  <span>Area: {scheduleData.summary.totalArea.toFixed(2)} m²</span>
                )}
                {scheduleData.summary.byType && (
                  <span className="summary-types">
                    {Object.entries(scheduleData.summary.byType)
                      .map(([type, count]) => `${type}: ${count}`)
                      .join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="schedule-error">
              <p>Error: {error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="schedule-loading">
              <p>Generating schedule...</p>
            </div>
          )}

          {/* Schedule Table */}
          {!isLoading && !error && (
            <ScheduleTable
              definition={activeSchedule}
              data={scheduleData.rows}
            />
          )}
        </div>
      )}

      {/* Empty State */}
      {!activeSchedule && (
        <div className="schedule-empty">
          <p>Select a schedule from the list to view details</p>
        </div>
      )}
    </div>
  );
}

export default SchedulePanel;

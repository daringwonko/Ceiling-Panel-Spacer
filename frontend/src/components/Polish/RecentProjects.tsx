/**
 * Recent Projects Component
 * Displays and manages recently opened projects
 */

import React, { useState, useEffect, useCallback } from 'react';

export interface RecentProjectData {
  id: string;
  name: string;
  path: string;
  lastModified: Date;
  thumbnail?: string;
  projectType?: string;
  size?: string;
}

interface RecentProjectsProps {
  maxItems?: number;
  onProjectOpen: (project: RecentProjectData) => void;
  onProjectDelete?: (projectId: string) => void;
  onProjectPin?: (projectId: string) => void;
}

export const RecentProjects: React.FC<RecentProjectsProps> = ({
  maxItems = 8,
  onProjectOpen,
  onProjectDelete,
  onProjectPin
}) => {
  const [projects, setProjects] = useState<RecentProjectData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);

  // Load recent projects from localStorage
  useEffect(() => {
    const loadProjects = () => {
      setIsLoading(true);
      try {
        const saved = localStorage.getItem('bim-workbench-recent-projects');
        if (saved) {
          const parsed = JSON.parse(saved);
          const projectsWithDates = parsed.map((p: any) => ({
            ...p,
            lastModified: new Date(p.lastModified)
          }));
          setProjects(projectsWithDates);
        }
      } catch (e) {
        console.error('Failed to load recent projects:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Save projects to localStorage
  const saveProjects = useCallback((projectsToSave: RecentProjectData[]) => {
    try {
      localStorage.setItem('bim-workbench-recent-projects', JSON.stringify(projectsToSave));
    } catch (e) {
      console.error('Failed to save recent projects:', e);
    }
  }, []);

  // Filter and sort projects
  const filteredProjects = React.useMemo(() => {
    let result = [...projects];

    // Filter by search query
    if (searchQuery) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortBy === 'recent') {
      result.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Limit
    return result.slice(0, maxItems);
  }, [projects, searchQuery, sortBy, maxItems]);

  const handleProjectClick = (project: RecentProjectData) => {
    onProjectOpen(project);
  };

  const handleDeleteProject = (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const updated = projects.filter(p => p.id !== projectId);
    setProjects(updated);
    saveProjects(updated);
    onProjectDelete?.(projectId);
  };

  const handlePinProject = (projectId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const updated = projects.map(p =>
      p.id === projectId ? { ...p, isPinned: !p.isPinned } : p
    );
    setProjects(updated);
    saveProjects(updated);
    onProjectPin?.(projectId);
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all recent projects?')) {
      setProjects([]);
      localStorage.removeItem('bim-workbench-recent-projects');
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <div className="recent-projects" role="region" aria-label="Recent projects">
        <div className="recent-loading">Loading...</div>
        <style>{`
          .recent-loading {
            padding: 40px;
            text-align: center;
            color: #888;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="recent-projects" role="region" aria-label="Recent projects">
      {/* Header */}
      <div className="recent-header">
        <h2 className="recent-title">Recent Projects</h2>
        <div className="recent-actions">
          {projects.length > 0 && (
            <button
              className="recent-clear"
              onClick={handleClearAll}
              aria-label="Clear all recent projects"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="recent-controls">
        <div className="recent-search">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="recent-search-input"
            aria-label="Search recent projects"
          />
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <div className="recent-options">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'name')}
            className="recent-sort"
            aria-label="Sort by"
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name</option>
          </select>

          <div className="recent-view-toggle" role="group" aria-label="View mode">
            <button
              className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              aria-label="Grid view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              aria-label="List view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="4" width="18" height="4" rx="1" />
                <rect x="3" y="10" width="18" height="4" rx="1" />
                <rect x="3" y="16" width="18" height="4" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {filteredProjects.length === 0 ? (
        <div className="recent-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p>No recent projects</p>
          <small>Open a project to see it here</small>
        </div>
      ) : (
        <div
          className={`recent-grid ${viewMode}`}
          role="list"
          aria-label="Recent projects list"
        >
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="recent-card"
              onClick={() => handleProjectClick(project)}
              role="listitem"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleProjectClick(project);
                }
              }}
            >
              <div className="card-thumbnail">
                {project.thumbnail ? (
                  <img src={project.thumbnail} alt="" />
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 21h18M5 21V7l8-4v18M13 21V3l6 3v15M9 9v.01M9 12v.01" />
                  </svg>
                )}
              </div>

              <div className="card-content">
                <div className="card-header">
                  <span className="card-name">{project.name}</span>
                  {project.isPinned && (
                    <svg className="pinned-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 4l4 4-6 6 2 2-4 4-2-2-4 4 2 2 6-6 4 4V4z" />
                    </svg>
                  )}
                </div>

                <div className="card-meta">
                  <span className="card-date">{formatDate(project.lastModified)}</span>
                  {project.projectType && (
                    <span className="card-type">{project.projectType}</span>
                  )}
                </div>

                {project.path && (
                  <div className="card-path" title={project.path}>
                    {project.path}
                  </div>
                )}
              </div>

              <div className="card-actions">
                <button
                  className="action-pin"
                  onClick={(e) => handlePinProject(project.id, e)}
                  aria-label={project.isPinned ? 'Unpin project' : 'Pin project'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={project.isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M12 17v5M9 11V7a3 3 0 016.3-2.8l1.5 1.1a4.5 4.5 0 00-4.8 6.7H8" />
                  </svg>
                </button>

                <button
                  className="action-delete"
                  onClick={(e) => handleDeleteProject(project.id, e)}
                  aria-label="Remove from recent projects"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .recent-projects {
          padding: 20px;
        }

        .recent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .recent-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .recent-clear {
          background: none;
          border: none;
          color: #888;
          font-size: 13px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .recent-clear:hover {
          background: #fee;
          color: #c00;
        }

        .recent-controls {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .recent-search {
          position: relative;
          flex: 1;
          min-width: 200px;
        }

        .recent-search-input {
          width: 100%;
          padding: 10px 16px 10px 40px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .recent-search-input:focus {
          outline: none;
          border-color: #2196f3;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #888;
        }

        .recent-options {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .recent-sort {
          padding: 10px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        }

        .recent-view-toggle {
          display: flex;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
        }

        .view-toggle {
          padding: 8px 12px;
          background: white;
          border: none;
          cursor: pointer;
          color: #888;
          transition: all 0.2s;
        }

        .view-toggle:hover {
          background: #f5f5f5;
        }

        .view-toggle.active {
          background: #2196f3;
          color: white;
        }

        .recent-grid {
          display: grid;
          gap: 12px;
        }

        .recent-grid.grid {
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        }

        .recent-grid.list {
          grid-template-columns: 1fr;
        }

        .recent-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f8f9fa;
          border: 2px solid transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .recent-grid.list .recent-card {
          padding: 16px;
        }

        .recent-card:hover {
          background: #e3f2fd;
          border-color: #2196f3;
        }

        .recent-card:focus {
          outline: none;
          border-color: #2196f3;
          box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.3);
        }

        .card-thumbnail {
          width: 48px;
          height: 48px;
          background: #e0e0e0;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          flex-shrink: 0;
          overflow: hidden;
        }

        .card-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-content {
          flex: 1;
          min-width: 0;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .card-name {
          font-weight: 500;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pinned-icon {
          color: #f57c00;
          flex-shrink: 0;
        }

        .card-meta {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }

        .card-date,
        .card-type {
          font-size: 12px;
          color: #888;
        }

        .card-type {
          background: #e0e0e0;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .card-path {
          font-size: 11px;
          color: #aaa;
          margin-top: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .recent-card:hover .card-actions {
          opacity: 1;
        }

        .action-pin,
        .action-delete {
          padding: 6px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          cursor: pointer;
          color: #666;
          transition: all 0.2s;
        }

        .action-pin:hover {
          background: #fff3e0;
          border-color: #f57c00;
          color: #f57c00;
        }

        .action-delete:hover {
          background: #ffebee;
          border-color: #f44336;
          color: #f44336;
        }

        .recent-empty {
          text-align: center;
          padding: 48px 24px;
          color: #888;
        }

        .recent-empty svg {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .recent-empty p {
          margin: 0 0 4px;
          font-size: 16px;
          color: #666;
        }

        .recent-empty small {
          font-size: 13px;
          color: #aaa;
        }
      `}</style>
    </div>
  );
};

export default RecentProjects;

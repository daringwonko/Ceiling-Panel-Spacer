/**
 * Welcome Screen Component
 * Initial landing screen for BIM Workbench
 */

import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

interface RecentProject {
  id: string;
  name: string;
  path: string;
  lastModified: Date;
  thumbnail?: string;
}

interface WelcomeScreenProps {
  onNewProject: () => void;
  onOpenProject: (path: string) => void;
  recentProjects?: RecentProject[];
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onNewProject,
  onOpenProject,
  recentProjects = []
}) => {
  const history = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentProjectsState, setRecentProjects] = useState<RecentProject[]>(recentProjects);

  // Load recent projects from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bim-workbench-recent-projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentProjects(parsed.map((p: any) => ({
          ...p,
          lastModified: new Date(p.lastModified)
        })));
      } catch (e) {
        console.error('Failed to parse recent projects:', e);
      }
    }
  }, []);

  const filteredProjects = recentProjectsState.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProjectClick = (project: RecentProject) => {
    onOpenProject(project.path);
  };

  const handleDemoProject = () => {
    // Load demo project
    history.push('/bim?demo=true');
  };

  return (
    <div className="welcome-screen" role="main">
      <div className="welcome-container">
        {/* Header */}
        <header className="welcome-header">
          <div className="welcome-logo">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="16" width="48" height="40" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M8 28h48" stroke="currentColor" strokeWidth="2" />
              <path d="M24 16v12" stroke="currentColor" strokeWidth="2" />
              <path d="M40 16v12" stroke="currentColor" strokeWidth="2" />
              <circle cx="16" cy="42" r="4" fill="currentColor" />
              <circle cx="32" cy="42" r="4" fill="currentColor" />
              <circle cx="48" cy="42" r="4" fill="currentColor" />
            </svg>
          </div>
          <h1>BIM Workbench</h1>
          <p className="welcome-subtitle">Building Information Modeling for Professionals</p>
        </header>

        {/* Main Actions */}
        <div className="welcome-actions">
          <button
            className="welcome-button welcome-button-primary"
            onClick={onNewProject}
            autoFocus
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Project
          </button>

          <button
            className="welcome-button welcome-button-secondary"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Open Project
          </button>

          <input
            type="file"
            id="file-input"
            accept=".bim,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onOpenProject(file.path);
              }
            }}
          />
        </div>

        {/* Recent Projects */}
        {recentProjectsState.length > 0 && (
          <section className="welcome-recent" aria-labelledby="recent-projects-title">
            <h2 id="recent-projects-title">Recent Projects</h2>

            <div className="recent-search">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="recent-search-input"
                aria-label="Search recent projects"
              />
            </div>

            <div className="recent-grid" role="list">
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  className="recent-card"
                  onClick={() => handleProjectClick(project)}
                  role="listitem"
                >
                  <div className="recent-thumbnail">
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt="" />
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 21h18M5 21V7l8-4v18M13 21V3l6 3v15M9 9v.01M9 12v.01M9 16v.01M9 20v.01" />
                      </svg>
                    )}
                  </div>
                  <div className="recent-info">
                    <span className="recent-name">{project.name}</span>
                    <span className="recent-date">
                      {project.lastModified.toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Quick Links */}
        <section className="welcome-links" aria-labelledby="quick-links-title">
          <h2 id="quick-links-title">Quick Links</h2>
          <div className="links-grid">
            <a href="#" className="link-card" onClick={(e) => { e.preventDefault(); handleDemoProject(); }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Demo Project</span>
              <small>Explore with sample data</small>
            </a>

            <a href="#" className="link-card" onClick={(e) => { e.preventDefault(); }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span>Tutorials</span>
              <small>Learn the basics</small>
            </a>

            <a href="#" className="link-card" onClick={(e) => { e.preventDefault(); }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Documentation</span>
              <small>Full reference guide</small>
            </a>

            <a href="#" className="link-card" onClick={(e) => { e.preventDefault(); }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Support</span>
              <small>Get help</small>
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="welcome-footer">
          <p>Press <kbd>?</kbd> to view keyboard shortcuts</p>
          <p className="version">Version 1.0.0</p>
        </footer>
      </div>

      <style>{`
        .welcome-screen {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .welcome-container {
          width: 100%;
          max-width: 900px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          padding: 48px;
        }

        .welcome-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .welcome-logo {
          color: #2196f3;
          margin-bottom: 16px;
        }

        .welcome-header h1 {
          margin: 0 0 8px;
          font-size: 32px;
          font-weight: 700;
          color: #333;
        }

        .welcome-subtitle {
          margin: 0;
          font-size: 16px;
          color: #666;
        }

        .welcome-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 48px;
        }

        .welcome-button {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .welcome-button-primary {
          background: #2196f3;
          color: white;
        }

        .welcome-button-primary:hover {
          background: #1976d2;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
        }

        .welcome-button-secondary {
          background: white;
          color: #333;
          border: 2px solid #e0e0e0;
        }

        .welcome-button-secondary:hover {
          border-color: #2196f3;
          color: #2196f3;
        }

        .welcome-recent {
          margin-bottom: 40px;
        }

        .welcome-recent h2 {
          margin: 0 0 16px;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .recent-search {
          margin-bottom: 16px;
        }

        .recent-search-input {
          width: 100%;
          max-width: 300px;
          padding: 10px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
        }

        .recent-search-input:focus {
          outline: none;
          border-color: #2196f3;
        }

        .recent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
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
          text-align: left;
        }

        .recent-card:hover {
          background: #e3f2fd;
          border-color: #2196f3;
        }

        .recent-thumbnail {
          width: 48px;
          height: 48px;
          background: #e0e0e0;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          flex-shrink: 0;
        }

        .recent-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 6px;
        }

        .recent-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .recent-name {
          font-weight: 500;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .recent-date {
          font-size: 12px;
          color: #888;
        }

        .welcome-links h2 {
          margin: 0 0 16px;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }

        .link-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 16px;
          background: #f8f9fa;
          border-radius: 8px;
          text-decoration: none;
          color: #333;
          transition: all 0.2s;
        }

        .link-card:hover {
          background: #e3f2fd;
          transform: translateY(-2px);
        }

        .link-card svg {
          color: #2196f3;
          margin-bottom: 12px;
        }

        .link-card span {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .link-card small {
          font-size: 12px;
          color: #888;
        }

        .welcome-footer {
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .welcome-footer p {
          margin: 0;
          font-size: 13px;
          color: #888;
        }

        .welcome-footer kbd {
          display: inline-block;
          padding: 2px 8px;
          font-family: monospace;
          font-size: 12px;
          background: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin: 0 4px;
        }

        .version {
          color: #aaa;
        }

        @media (max-width: 600px) {
          .welcome-container {
            padding: 24px;
          }

          .welcome-actions {
            flex-direction: column;
          }

          .welcome-button {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;

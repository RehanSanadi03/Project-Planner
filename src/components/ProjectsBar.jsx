import React, { useState, useRef, useEffect } from 'react';

export default function ProjectsBar({
    projects,
    activeProjectId,
    setActiveProjectId,
    tasks,
    onNewProject,
    onRenameProject,
    onDeleteProject,
}) {
    const [menuOpenId, setMenuOpenId] = useState(null);
    const menuRef = useRef(null);

    // Close context menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpenId(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const getCount = (projectId) =>
        tasks.filter(t => t.projectId === projectId).length;

    const allCount = tasks.length;

    return (
        <div className="projects-bar">
            <div className="projects-bar-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                Projects
            </div>

            <div className="projects-pills-row">
                {/* All Tasks pill */}
                <button
                    className={`project-pill ${activeProjectId === null ? 'active' : ''}`}
                    onClick={() => setActiveProjectId(null)}
                    title="Show all tasks across all projects"
                >
                    <span className="project-pill-dot" style={{ background: 'var(--text-muted)' }} />
                    All Tasks
                    <span className="project-pill-count">{allCount}</span>
                </button>

                {/* Per-project pills */}
                {projects.map(proj => (
                    <div key={proj.id} className="project-pill-wrapper" ref={menuOpenId === proj.id ? menuRef : null}>
                        <button
                            className={`project-pill ${activeProjectId === proj.id ? 'active' : ''}`}
                            style={activeProjectId === proj.id ? { '--pill-color': proj.color } : {}}
                            onClick={() => setActiveProjectId(proj.id)}
                            title={proj.name}
                        >
                            <span className="project-pill-dot" style={{ background: proj.color }} />
                            {proj.name}
                            <span className="project-pill-count">{getCount(proj.id)}</span>
                        </button>

                        {/* Three-dot context menu trigger */}
                        <button
                            className="project-pill-menu-btn"
                            title="Project options"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(prev => prev === proj.id ? null : proj.id);
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                            </svg>
                        </button>

                        {/* Dropdown menu */}
                        {menuOpenId === proj.id && (
                            <div className="project-context-menu">
                                <button
                                    className="project-menu-item"
                                    onClick={() => {
                                        setMenuOpenId(null);
                                        onRenameProject(proj);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                                    </svg>
                                    Rename
                                </button>
                                <button
                                    className="project-menu-item danger"
                                    onClick={() => {
                                        setMenuOpenId(null);
                                        onDeleteProject(proj);
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                    </svg>
                                    Delete Project
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {/* New Project button */}
                <button className="project-new-btn" onClick={onNewProject} title="Create a new project">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    New Project
                </button>
            </div>
        </div>
    );
}

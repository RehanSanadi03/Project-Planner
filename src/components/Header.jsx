import React from 'react';

export default function Header({ activeTab, activeProject, onLoadPresetClick, onAddTaskClick }) {
    const labels = {
        dashboard: 'Dashboard',
        tasks: 'Manage Tasks',
        sandbox: 'Task Organizer',
        compare: 'Compare Algo',
        about: 'About Planner'
    };

    return (
        <header className="top-nav">
            <div className="breadcrumb">
                <span className="parent-route">App</span>
                {activeProject && (
                    <>
                        {' '}
                        <span className="breadcrumb-sep">/</span>
                        {' '}
                        <span
                            className="breadcrumb-project"
                            style={{ color: activeProject.color }}
                        >
                            <span
                                className="breadcrumb-project-dot"
                                style={{ background: activeProject.color }}
                            />
                            {activeProject.name}
                        </span>
                    </>
                )}
                {' '}
                <span className="breadcrumb-sep">/</span>
                {' '}
                <span className="active-route" id="nav-title">{labels[activeTab]}</span>
            </div>
            <div className="quick-actions">
                <button className="btn btn-secondary-outline" id="load-preset-btn" onClick={onLoadPresetClick}>
                    Load Preset...
                </button>
                <button className="btn btn-primary" id="global-add-task" onClick={() => onAddTaskClick()}>
                    + New Task
                </button>
            </div>
        </header>
    );
}

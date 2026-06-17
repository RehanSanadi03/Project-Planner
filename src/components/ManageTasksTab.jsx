import React from 'react';
import { getTaskColor, PRESETS } from '../utils/scheduler';

export default function ManageTasksTab({ 
    tasks,           // full task pool (all projects)
    visibleTasks,    // filtered tasks for the active project (or all if null)
    activeProjectId,
    projects,
    onAddTaskClick, 
    onEditTaskClick, 
    onDeleteTaskClick, 
    onClearAllClick, 
    onSelectPreset,
    hoveredTaskId,
    setHoveredTaskId 
}) {
    // Displayed tasks: use visibleTasks if provided, else tasks
    const displayTasks = visibleTasks ?? tasks;

    // Helper: find project by id
    const getProject = (projectId) =>
        projects ? projects.find(p => p.id === projectId) : null;

    // Helper to determine if a preset matches the current task configuration
    const getActivePresetName = () => {
        for (const [key, presetList] of Object.entries(PRESETS)) {
            if (presetList.length === displayTasks.length) {
                const match = presetList.every((pt, i) => {
                    const ct = displayTasks[i];
                    if (!ct) return false;
                    return pt.id === ct.id &&
                        pt.name === ct.name &&
                        pt.duration === ct.duration &&
                        pt.deadline === ct.deadline &&
                        pt.priority === ct.priority &&
                        JSON.stringify(pt.predecessors) === JSON.stringify(ct.predecessors);
                });
                if (match) return key;
            }
        }
        return '';
    };

    const activePreset = getActivePresetName();

    const presetPills = [
        { id: 'balanced', label: 'Balanced Development' },
        { id: 'cpu', label: 'CPU Bottleneck' },
        { id: 'deadlines', label: 'Deadline Panic' },
        { id: 'priority', label: 'Priority Starvation' },
        { id: 'dependencies', label: 'Dependency Chain' }
    ];

    // Edit/Delete must use the index from the FULL tasks array (not filtered)
    const getFullIndex = (taskId) => tasks.findIndex(t => t.id === taskId);

    // Active project name for labels
    const activeProject = getProject(activeProjectId);

    return (
        <div className="tab-view active-view" id="view-tasks">
            <div className="glass-panel full-width-block">
                <div className="block-header">
                    <div>
                        <h2 className="section-title">
                            {activeProject ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: '10px', height: '10px',
                                            borderRadius: '50%',
                                            background: activeProject.color,
                                            flexShrink: 0
                                        }}
                                    />
                                    {activeProject.name}
                                </span>
                            ) : 'Task Management Panel'}
                        </h2>
                        <p className="subtitle">
                            {activeProject
                                ? `${displayTasks.length} task${displayTasks.length !== 1 ? 's' : ''} in this project. Add, edit or remove them below.`
                                : 'Add, edit, or delete items from the current active pool.'}
                        </p>
                    </div>
                    <div className="header-buttons" style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-danger-outline" id="clear-tasks-btn" onClick={onClearAllClick}>
                            🗑️ {activeProject ? `Clear Project Tasks` : 'Clear All Tasks'}
                        </button>
                        <button className="btn btn-primary" id="manager-add-task" onClick={() => onAddTaskClick()}>
                            + Add Task
                        </button>
                    </div>
                </div>

                {/* Filter / Presets Quickbar */}
                <div className="presets-quickbar">
                    <span className="quickbar-label">Quick Scenario Presets:</span>
                    <div className="preset-pills">
                        {presetPills.map(pill => (
                            <button
                                key={pill.id}
                                className={`preset-pill-btn ${activePreset === pill.id ? 'active' : ''}`}
                                onClick={() => onSelectPreset(pill.id)}
                            >
                                {pill.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Empty state for an active project with no tasks */}
                {displayTasks.length === 0 && activeProject ? (
                    <div className="project-empty-state">
                        <span className="empty-icon">📁</span>
                        <h3>"{activeProject.name}" is empty</h3>
                        <p>
                            This project has no tasks yet.<br />
                            Click <strong>+ Add Task</strong> to create one, or load a Scenario Preset above.
                        </p>
                    </div>
                ) : (
                    /* Task Pool Grid Table */
                    <div className="table-container">
                        <table className="premium-table" id="tasks-manager-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Task Name</th>
                                    <th>Duration <span className="info-tag">(Service Time)</span></th>
                                    <th>Deadline</th>
                                    <th>Priority <span className="info-tag">(Lower is Higher)</span></th>
                                    <th>Predecessors</th>
                                    {/* Show Project column only when in "All Tasks" view */}
                                    {!activeProjectId && projects && projects.length > 0 && (
                                        <th>Project</th>
                                    )}
                                    <th className="actions-col">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>
                                            No tasks available. Click "+ Add Task" or load a Scenario Preset.
                                        </td>
                                    </tr>
                                ) : (
                                    displayTasks.map((task) => {
                                        const fullIndex = getFullIndex(task.id);
                                        const preds = task.predecessors || [];
                                        const hasPredecessors = preds.length > 0;
                                        const proj = getProject(task.projectId);

                                        return (
                                            <tr
                                                key={task.id}
                                                className={hoveredTaskId === task.id ? 'row-highlighted' : ''}
                                                onMouseEnter={() => setHoveredTaskId(task.id)}
                                                onMouseLeave={() => setHoveredTaskId(null)}
                                            >
                                                <td><b>{task.id}</b></td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{
                                                            display: 'inline-block', width: '10px', height: '10px',
                                                            borderRadius: '50%', background: getTaskColor(task.id)
                                                        }} />
                                                        <span>{task.name}</span>
                                                    </div>
                                                </td>
                                                <td>{task.duration}</td>
                                                <td>{task.deadline}</td>
                                                <td>
                                                    <span className={`priority-badge p-${task.priority}`}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td>
                                                    {hasPredecessors ? (
                                                        preds.map(pId => (
                                                            <span
                                                                key={pId}
                                                                className="dependency-tag"
                                                                style={{ borderColor: getTaskColor(pId), color: getTaskColor(pId) }}
                                                            >
                                                                ⛓️ {pId}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>None</span>
                                                    )}
                                                </td>

                                                {/* Project badge (only in All Tasks view) */}
                                                {!activeProjectId && projects && projects.length > 0 && (
                                                    <td>
                                                        {proj ? (
                                                            <span
                                                                className="project-badge"
                                                                style={{
                                                                    background: `${proj.color}18`,
                                                                    color: proj.color,
                                                                    border: `1px solid ${proj.color}44`
                                                                }}
                                                            >
                                                                <span
                                                                    className="project-badge-dot"
                                                                    style={{ background: proj.color }}
                                                                />
                                                                {proj.name}
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>—</span>
                                                        )}
                                                    </td>
                                                )}

                                                <td className="actions-col">
                                                    <div className="actions-cell">
                                                        <button
                                                            className="action-btn edit"
                                                            onClick={() => onEditTaskClick(fullIndex)}
                                                            title="Edit Task"
                                                        >
                                                            ✏️
                                                        </button>
                                                        <button
                                                            className="action-btn delete"
                                                            onClick={() => onDeleteTaskClick(fullIndex)}
                                                            title="Delete Task"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

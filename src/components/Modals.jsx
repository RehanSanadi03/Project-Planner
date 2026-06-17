import React, { useState, useEffect } from 'react';
import { getTaskColor, PROJECT_COLORS } from '../utils/scheduler';

// ==========================================
// 1. ADD / EDIT TASK MODAL
// ==========================================
export function TaskModal({ isOpen, onClose, onSubmit, tasks, editingTaskIndex, projects, activeProjectId }) {
    const [name, setName] = useState('');
    const [duration, setDuration] = useState('');
    const [deadline, setDeadline] = useState('');
    const [priority, setPriority] = useState('');
    const [predecessors, setPredecessors] = useState([]);
    const [projectId, setProjectId] = useState('');

    const isEditing = editingTaskIndex !== null && editingTaskIndex !== undefined;
    const currentTask = isEditing ? tasks[editingTaskIndex] : null;

    // Reset or populate fields when modal opens or editingTaskIndex changes
    useEffect(() => {
        if (isOpen) {
            if (isEditing && currentTask) {
                setName(currentTask.name || '');
                setDuration(currentTask.duration || '');
                setDeadline(currentTask.deadline || '');
                setPriority(currentTask.priority || '');
                setPredecessors(currentTask.predecessors || []);
                setProjectId(currentTask.projectId || '');
            } else {
                setName('');
                setDuration('');
                setDeadline('');
                setPriority('');
                setPredecessors([]);
                // Default to active project if one is selected
                setProjectId(activeProjectId || (projects && projects[0]?.id) || '');
            }
        }
    }, [isOpen, editingTaskIndex, currentTask, activeProjectId]);

    if (!isOpen) return null;

    const handleCheckboxChange = (taskId, checked) => {
        if (checked) {
            setPredecessors(prev => [...prev, taskId]);
        } else {
            setPredecessors(prev => prev.filter(id => id !== taskId));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const durationVal = parseInt(duration, 10);
        const deadlineVal = parseInt(deadline, 10);
        const priorityVal = parseInt(priority, 10);

        if (!name.trim() || isNaN(durationVal) || isNaN(deadlineVal) || isNaN(priorityVal)) {
            return;
        }

        onSubmit({
            name: name.trim(),
            duration: durationVal,
            deadline: deadlineVal,
            priority: priorityVal,
            predecessors,
            projectId: projectId || null
        });
    };

    return (
        <div className="modal-backdrop modal-open" id="task-modal">
            <div className="modal-content glass-panel animated-modal">
                <div className="modal-header">
                    <h2>{isEditing ? 'Edit Existing Task' : 'Add New Task'}</h2>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="task-name" className="form-label">Task Name</label>
                        <input
                            type="text"
                            id="task-name"
                            className="form-input"
                            placeholder="e.g. Design Architecture"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="task-duration" className="form-label">Duration (Time Units)</label>
                            <input
                                type="number"
                                id="task-duration"
                                className="form-input"
                                min="1"
                                max="100"
                                placeholder="e.g. 5"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="task-deadline" className="form-label">Deadline (End Time)</label>
                            <input
                                type="number"
                                id="task-deadline"
                                className="form-input"
                                min="1"
                                max="500"
                                placeholder="e.g. 15"
                                value={deadline}
                                onChange={e => setDeadline(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="task-priority" className="form-label">Priority (1 to 5, Lower is Higher)</label>
                        <input
                            type="number"
                            id="task-priority"
                            className="form-input"
                            min="1"
                            max="5"
                            placeholder="e.g. 2"
                            value={priority}
                            onChange={e => setPriority(e.target.value)}
                            required
                        />
                    </div>
                    {/* Project Assignment */}
                    {projects && projects.length > 0 && (
                        <div className="form-group">
                            <label htmlFor="task-project" className="form-label">Project (Folder)</label>
                            <select
                                id="task-project"
                                className="form-input"
                                value={projectId}
                                onChange={e => setProjectId(e.target.value)}
                            >
                                <option value="">— No Project —</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Predecessors (Must complete before this task)</label>
                        <div className="predecessors-list-wrapper" id="modal-predecessors-list">
                            {tasks.length === 0 || (isEditing && tasks.length === 1) ? (
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                                    No other tasks available to depend on.
                                </div>
                            ) : (
                                tasks
                                    .filter(t => !currentTask || t.id !== currentTask.id)
                                    .map(t => (
                                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="checkbox"
                                                id={`chk-pred-${t.id}`}
                                                value={t.id}
                                                checked={predecessors.includes(t.id)}
                                                onChange={e => handleCheckboxChange(t.id, e.target.checked)}
                                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                            />
                                            <label
                                                htmlFor={`chk-pred-${t.id}`}
                                                style={{ fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexGrow: 1 }}
                                            >
                                                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: getTaskColor(t.id) }}></span>
                                                <b>{t.id}</b>: {t.name}
                                            </label>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{isEditing ? 'Apply Changes' : 'Create Task'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ==========================================
// 2. SCENARIO PRESETS MODAL
// ==========================================
export function PresetsModal({ isOpen, onClose, onSelectPreset }) {
    if (!isOpen) return null;

    const presetOptions = [
        {
            id: 'balanced',
            icon: '🌟',
            title: 'Balanced Development',
            description: 'Standard task mix of varying priorities, durations, and reasonable deadlines.'
        },
        {
            id: 'cpu',
            icon: '⚡',
            title: 'CPU Bottleneck',
            description: 'A few extremely long tasks alongside short ones. Ideal for seeing SJF convoy-effect reduction.'
        },
        {
            id: 'deadlines',
            icon: '🚨',
            title: 'Deadline Panic',
            description: 'Tasks with very tight deadlines. EDF will showcase its capability of meeting them.'
        },
        {
            id: 'priority',
            icon: '👑',
            title: 'Priority Starvation',
            description: 'A high-priority heavy task that schedules first, starving low-priority quick tasks.'
        },
        {
            id: 'dependencies',
            icon: '⛓️',
            title: 'Dependency Chain',
            description: 'Linear and branched task dependencies. Schedules in topological order (e.g. Design ➔ Code ➔ Test).'
        }
    ];

    return (
        <div className="modal-backdrop modal-open" id="presets-modal">
            <div className="modal-content glass-panel animated-modal small-modal">
                <div className="modal-header">
                    <h2>Select Scenario Preset</h2>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="preset-options-list">
                    {presetOptions.map(option => (
                        <button
                            key={option.id}
                            className="preset-option-card"
                            onClick={() => {
                                onSelectPreset(option.id);
                                onClose();
                            }}
                        >
                            <span className="preset-icon">{option.icon}</span>
                            <div className="preset-details">
                                <h4>{option.title}</h4>
                                <p>{option.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 3. CONFIRM ACTION MODAL
// ==========================================
export function ConfirmModal({ isOpen, onClose, onConfirm, config }) {
    if (!isOpen || !config) return null;

    return (
        <div className="modal-backdrop modal-open" id="confirm-modal">
            <div className="modal-content glass-panel animated-modal small-modal">
                <div className="modal-header">
                    <h2>{config.title || 'Confirm Action'}</h2>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body-content">
                    <p>{config.message || 'Are you sure you want to proceed?'}</p>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary-outline" onClick={onClose}>Cancel</button>
                    <button type="button" className="btn btn-danger" onClick={() => {
                        onConfirm();
                        onClose();
                    }}>Yes, Proceed</button>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 4. PROJECT MODAL (Create / Rename)
// ==========================================
export function ProjectModal({ isOpen, onClose, onSubmit, existingProject }) {
    const isEditing = !!existingProject;
    const [name, setName] = useState('');
    const [color, setColor] = useState(PROJECT_COLORS[0]);

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setName(existingProject.name || '');
                setColor(existingProject.color || PROJECT_COLORS[0]);
            } else {
                setName('');
                setColor(PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)]);
            }
        }
    }, [isOpen, existingProject]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), color });
    };

    return (
        <div className="modal-backdrop modal-open" id="project-modal">
            <div className="modal-content glass-panel animated-modal small-modal">
                <div className="modal-header">
                    <h2>{isEditing ? 'Rename Project' : '📁 New Project'}</h2>
                    <button className="modal-close-btn" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="project-name" className="form-label">Project Name</label>
                        <input
                            type="text"
                            id="project-name"
                            className="form-input"
                            placeholder="e.g. Mobile App, API Redesign..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Project Color</label>
                        <div className="project-color-picker">
                            {PROJECT_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    className={`color-swatch ${color === c ? 'selected' : ''}`}
                                    style={{ background: c }}
                                    onClick={() => setColor(c)}
                                    title={c}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary-outline" onClick={onClose}>Cancel</button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ background: color, boxShadow: `0 4px 12px ${color}55` }}
                        >
                            {isEditing ? 'Save Changes' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

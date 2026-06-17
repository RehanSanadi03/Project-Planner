import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ProjectsBar from './components/ProjectsBar';
import DashboardTab from './components/DashboardTab';
import ManageTasksTab from './components/ManageTasksTab';
import SandboxTab from './components/SandboxTab';
import CompareTab from './components/CompareTab';
import AboutTab from './components/AboutTab';
import Chatbot from './components/Chatbot';
import ToastContainer from './components/Toast';
import { TaskModal, PresetsModal, ConfirmModal, ProjectModal } from './components/Modals';
import { DEFAULT_TASKS, DEFAULT_PROJECTS, PRESETS } from './utils/scheduler';

export default function App() {
    // ── Core States ────────────────────────────────────────────────────────────
    const [tasks, setTasks] = useState(() => {
        const saved = localStorage.getItem('opti_tasks');
        return saved ? JSON.parse(saved) : [...DEFAULT_TASKS];
    });

    const [projects, setProjects] = useState(() => {
        const saved = localStorage.getItem('opti_projects');
        return saved ? JSON.parse(saved) : [...DEFAULT_PROJECTS];
    });

    const [activeProjectId, setActiveProjectId] = useState(null); // null = All Tasks

    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('opti_theme') || 'dark';
    });

    const [activeTab, setActiveTab] = useState('dashboard');
    const [hoveredTaskId, setHoveredTaskId] = useState(null);
    const [dashboardAlgo, setDashboardAlgo] = useState('sjf');

    // ── Modal States ───────────────────────────────────────────────────────────
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTaskIndex, setEditingTaskIndex] = useState(null);
    const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState(null);

    // Project modal state
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null); // null = creating new

    // ── Toast State ────────────────────────────────────────────────────────────
    const [toasts, setToasts] = useState([]);

    const showToast = (title, message) => {
        const id = 'toast_' + Date.now() + Math.random().toString(36).substring(2, 7);
        setToasts(prev => [...prev, { id, title, message }]);
    };

    const dismissToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    // ── Persistence ────────────────────────────────────────────────────────────
    useEffect(() => {
        localStorage.setItem('opti_tasks', JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        localStorage.setItem('opti_projects', JSON.stringify(projects));
    }, [projects]);

    useEffect(() => {
        localStorage.setItem('opti_theme', theme);
        document.body.className = `${theme}-theme`;
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    // ── Derived: tasks visible in the current project context ─────────────────
    // For scheduling tabs we always show the active project's tasks (or all)
    const visibleTasks = activeProjectId
        ? tasks.filter(t => t.projectId === activeProjectId)
        : tasks;

    // ── Task CRUD ──────────────────────────────────────────────────────────────
    const handleAddTask = (taskData) => {
        if (editingTaskIndex !== null) {
            const updated = [...tasks];
            const originalId = updated[editingTaskIndex].id;
            updated[editingTaskIndex] = { ...taskData, id: originalId };
            setTasks(updated);
            showToast('Task Modified', `Task ${originalId} has been updated.`);
            setEditingTaskIndex(null);
        } else {
            const nextNum = tasks.reduce(
                (max, t) => Math.max(max, parseInt(t.id.replace(/\D/g, '')) || 0), 0
            ) + 1;
            const id = 'T' + nextNum;
            // Auto-assign to active project if one is selected and taskData has no projectId
            const projectId = taskData.projectId || activeProjectId || null;
            setTasks(prev => [...prev, { ...taskData, id, projectId }]);
            showToast('Task Created', `Added new task ${id} to the pool.`);
        }
        setIsTaskModalOpen(false);
    };

    // Used by Chatbot to add tasks directly
    const handleAddDirectTask = (newTask) => {
        const projectId = newTask.projectId || activeProjectId || null;
        setTasks(prev => [...prev, { ...newTask, projectId }]);
        showToast('Task Created', `Added new task ${newTask.id} via chatbot.`);
    };

    const handleDeleteTask = (index) => {
        // index is relative to the full tasks array from ManageTasksTab
        const taskToDelete = tasks[index];
        setConfirmConfig({
            title: 'Delete Task',
            message: `Are you sure you want to permanently remove task ${taskToDelete.id} (${taskToDelete.name})?`,
            onConfirm: () => {
                const deletedId = taskToDelete.id;
                const updated = tasks.filter((_, i) => i !== index);
                const cleaned = updated.map(t => ({
                    ...t,
                    predecessors: (t.predecessors || []).filter(pId => pId !== deletedId)
                }));
                setTasks(cleaned);
                showToast('Task Removed', `Task ${deletedId} has been deleted.`);
            }
        });
    };

    const handleClearAllTasks = () => {
        setConfirmConfig({
            title: 'Reset Task Pool',
            message: activeProjectId
                ? `Delete all tasks in this project? Tasks in other projects are unaffected.`
                : 'Delete ALL tasks across every project? This cannot be undone.',
            onConfirm: () => {
                if (activeProjectId) {
                    setTasks(prev => prev.filter(t => t.projectId !== activeProjectId));
                } else {
                    setTasks([]);
                }
                showToast('Task Pool Reset', 'Tasks cleared.');
            }
        });
    };

    const handleLoadPresetScenario = (name) => {
        if (!PRESETS[name]) return;
        const presetTasks = PRESETS[name].map(t => ({
            ...t,
            projectId: activeProjectId || null
        }));
        if (activeProjectId) {
            // Replace only the current project's tasks
            setTasks(prev => [
                ...prev.filter(t => t.projectId !== activeProjectId),
                ...presetTasks
            ]);
        } else {
            setTasks([...presetTasks]);
        }
        showToast('Preset Loaded', `Loaded "${name.toUpperCase()}" scenario.`);
    };

    // ── Project CRUD ───────────────────────────────────────────────────────────
    const openNewProject = () => {
        setEditingProject(null);
        setIsProjectModalOpen(true);
    };

    const openRenameProject = (proj) => {
        setEditingProject(proj);
        setIsProjectModalOpen(true);
    };

    const handleProjectSubmit = ({ name, color }) => {
        if (editingProject) {
            // Rename/recolor
            setProjects(prev =>
                prev.map(p => p.id === editingProject.id ? { ...p, name, color } : p)
            );
            showToast('Project Updated', `Project renamed to "${name}".`);
        } else {
            // Create new
            const id = 'proj_' + Date.now();
            const newProj = { id, name, color, createdAt: Date.now() };
            setProjects(prev => [...prev, newProj]);
            setActiveProjectId(id); // Switch to the new project
            showToast('Project Created', `"${name}" project is ready.`);
        }
        setIsProjectModalOpen(false);
        setEditingProject(null);
    };

    const handleDeleteProject = (proj) => {
        setConfirmConfig({
            title: 'Delete Project',
            message: `Delete project "${proj.name}"? All tasks inside it will also be permanently removed.`,
            onConfirm: () => {
                setTasks(prev => prev.filter(t => t.projectId !== proj.id));
                setProjects(prev => prev.filter(p => p.id !== proj.id));
                if (activeProjectId === proj.id) setActiveProjectId(null);
                showToast('Project Deleted', `"${proj.name}" and its tasks have been removed.`);
            }
        });
    };

    // ── Active project object (for Header breadcrumb) ─────────────────────────
    const activeProject = projects.find(p => p.id === activeProjectId) || null;

    // ── Tab rendering ──────────────────────────────────────────────────────────
    const renderActiveTabContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <DashboardTab
                        tasks={visibleTasks}
                        onAddTaskClick={() => {
                            setEditingTaskIndex(null);
                            setIsTaskModalOpen(true);
                        }}
                        onLoadPresetClick={() => setIsPresetsModalOpen(true)}
                        hoveredTaskId={hoveredTaskId}
                        setHoveredTaskId={setHoveredTaskId}
                        selectedAlgo={dashboardAlgo}
                        setSelectedAlgo={setDashboardAlgo}
                    />
                );
            case 'tasks':
                return (
                    <ManageTasksTab
                        tasks={tasks}
                        visibleTasks={visibleTasks}
                        activeProjectId={activeProjectId}
                        projects={projects}
                        onAddTaskClick={() => {
                            setEditingTaskIndex(null);
                            setIsTaskModalOpen(true);
                        }}
                        onEditTaskClick={(index) => {
                            setEditingTaskIndex(index);
                            setIsTaskModalOpen(true);
                        }}
                        onDeleteTaskClick={handleDeleteTask}
                        onClearAllClick={handleClearAllTasks}
                        onSelectPreset={handleLoadPresetScenario}
                        hoveredTaskId={hoveredTaskId}
                        setHoveredTaskId={setHoveredTaskId}
                    />
                );
            case 'sandbox':
                return <SandboxTab tasks={visibleTasks} />;
            case 'compare':
                return <CompareTab tasks={visibleTasks} />;
            case 'about':
                return <AboutTab />;
            default:
                return <DashboardTab tasks={visibleTasks} />;
        }
    };

    return (
        <div className="app-container">
            {/* Sidebar Navigation */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                theme={theme}
                toggleTheme={toggleTheme}
            />

            {/* Main Application Area */}
            <main className="main-content">
                <Header
                    activeTab={activeTab}
                    activeProject={activeProject}
                    onLoadPresetClick={() => setIsPresetsModalOpen(true)}
                    onAddTaskClick={() => {
                        setEditingTaskIndex(null);
                        setIsTaskModalOpen(true);
                    }}
                />

                {/* Project folder switcher bar */}
                <ProjectsBar
                    projects={projects}
                    activeProjectId={activeProjectId}
                    setActiveProjectId={setActiveProjectId}
                    tasks={tasks}
                    onNewProject={openNewProject}
                    onRenameProject={openRenameProject}
                    onDeleteProject={handleDeleteProject}
                />

                {/* Tab content panel */}
                {renderActiveTabContent()}
            </main>

            {/* Floating Chatbot Assistant */}
            <Chatbot
                tasks={tasks}
                addTask={handleAddDirectTask}
                loadPreset={handleLoadPresetScenario}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                showToast={showToast}
                setSelectedAlgo={setDashboardAlgo}
            />

            {/* Global Toasts */}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />

            {/* Modals */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => {
                    setIsTaskModalOpen(false);
                    setEditingTaskIndex(null);
                }}
                onSubmit={handleAddTask}
                tasks={tasks}
                editingTaskIndex={editingTaskIndex}
                projects={projects}
                activeProjectId={activeProjectId}
            />

            <PresetsModal
                isOpen={isPresetsModalOpen}
                onClose={() => setIsPresetsModalOpen(false)}
                onSelectPreset={handleLoadPresetScenario}
            />

            <ConfirmModal
                isOpen={confirmConfig !== null}
                onClose={() => setConfirmConfig(null)}
                onConfirm={confirmConfig?.onConfirm}
                config={confirmConfig}
            />

            <ProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => {
                    setIsProjectModalOpen(false);
                    setEditingProject(null);
                }}
                onSubmit={handleProjectSubmit}
                existingProject={editingProject}
            />
        </div>
    );
}

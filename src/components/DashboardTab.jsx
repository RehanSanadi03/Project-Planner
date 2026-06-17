import React, { useState } from 'react';
import { 
    scheduleTasks, 
    calculateMetrics, 
    getTaskColor, 
    algorithms 
} from '../utils/scheduler';

export default function DashboardTab({ tasks, onAddTaskClick, onLoadPresetClick, hoveredTaskId, setHoveredTaskId, selectedAlgo, setSelectedAlgo }) {

    // 1. Calculate General Summary Stats
    const totalTasks = tasks.length;
    const totalDuration = tasks.reduce((sum, t) => sum + t.duration, 0);
    const busyRatio = totalTasks > 0 ? '100%' : '0%';

    let bestAlgo = '-';
    if (totalTasks > 0) {
        const metricList = [];
        Object.keys(algorithms).forEach(key => {
            const res = scheduleTasks(tasks, key);
            if (!res.deadlockError) {
                const metrics = calculateMetrics(res.scheduled);
                metricList.push({ key: key.toUpperCase(), val: parseFloat(metrics.averageWaitingTime) });
            }
        });
        if (metricList.length > 0) {
            metricList.sort((a, b) => a.val - b.val);
            bestAlgo = metricList[0].key;
        } else {
            bestAlgo = 'Deadlock';
        }
    }

    // 2. Schedule Tasks for the Active Algorithm
    const scheduleResult = scheduleTasks(tasks, selectedAlgo);
    const hasDeadlock = scheduleResult.deadlockError;

    // Metrics for active algo
    let metrics = {
        totalCompletionTime: 0,
        averageWaitingTime: '0.00',
        averageTurnaroundTime: '0.00',
        maxLateness: 0,
        timeline: [0]
    };

    if (!hasDeadlock && totalTasks > 0) {
        metrics = calculateMetrics(scheduleResult.scheduled);
    }

    // 3. Render Gantt Ruler Tick Labels
    const renderRulerTicks = () => {
        const maxTime = metrics.totalCompletionTime;
        if (maxTime === 0) return null;

        let interval = 1;
        if (maxTime > 15) interval = 2;
        if (maxTime > 35) interval = 5;
        if (maxTime > 75) interval = 10;
        if (maxTime > 150) interval = 20;

        const ticks = [];
        for (let t = 0; t <= maxTime; t += interval) {
            const pct = (t / maxTime) * 100;
            ticks.push(
                <div key={t} className="timeline-tick-label" style={{ left: `${pct}%` }}>
                    {t}
                </div>
            );
        }
        if (maxTime % interval !== 0) {
            ticks.push(
                <div key="max" className="timeline-tick-label" style={{ left: '100%' }}>
                    {maxTime}
                </div>
            );
        }
        return ticks;
    };

    // 4. Render Gantt Bars
    const renderGanttBars = () => {
        if (hasDeadlock) {
            return (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', width: '100%', padding: '20px 0' }}>
                    Deadlock occurred. Unable to schedule tasks due to cyclic dependencies.
                </div>
            );
        }
        if (totalTasks === 0 || scheduleResult.scheduled.length === 0) {
            return (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', width: '100%', padding: '20px 0' }}>
                    No tasks scheduled. Add tasks or break deadlocks to see Gantt timeline.
                </div>
            );
        }

        const maxTime = metrics.totalCompletionTime;
        let elapsed = 0;

        return scheduleResult.scheduled.map(task => {
            const start = elapsed;
            const finish = start + task.duration;
            elapsed = finish;

            const widthPct = (task.duration / maxTime) * 100;
            const waiting = start;
            const turnaround = finish;
            const lateness = Math.max(0, finish - task.deadline);
            const penalty = (turnaround / task.duration).toFixed(2);
            const predsStr = task.predecessors && task.predecessors.length > 0 ? task.predecessors.join(', ') : 'None';

            const tooltip = `[${task.id}] ${task.name}\n` +
                `• Start Time: ${start}\n` +
                `• Completion Time: ${finish}\n` +
                `• Service Time (Duration): ${task.duration}\n` +
                `• Target Deadline: ${task.deadline}\n` +
                `• Predecessors: ${predsStr}\n` +
                `• Wait Time: ${waiting}\n` +
                `• Turnaround Time: ${turnaround}\n` +
                `• Penalty Ratio: ${penalty}\n` +
                `• Lateness/Delay: ${lateness}`;

            return (
                <div
                    key={task.id}
                    className="gantt-bar-element"
                    style={{
                        width: `${widthPct}%`,
                        background: getTaskColor(task.id),
                        boxShadow: hoveredTaskId === task.id ? '0 8px 16px rgba(0, 0, 0, 0.4)' : ''
                    }}
                    title={tooltip}
                    onMouseEnter={() => setHoveredTaskId(task.id)}
                    onMouseLeave={() => setHoveredTaskId(null)}
                >
                    <strong>{task.id}</strong>
                    <span>{task.name}</span>
                </div>
            );
        });
    };

    return (
        <div className="tab-view active-view" id="view-dashboard">
            <div className="dashboard-header">
                <h1 className="page-title">Welcome to OptiSchedule</h1>
                <p className="page-subtitle">Interactive analysis & scheduling simulator powered by greedy optimization</p>
            </div>

            {/* Deadlock Banner */}
            {hasDeadlock && (
                <div className="deadlock-warning-banner" id="dashboard-deadlock-alert" style={{ display: 'flex' }}>
                    <span style={{ fontSize: '20px' }}>⚠️</span>
                    <div>
                        <strong style={{ display: 'block', marginBottom: '2px' }}>Dependency Deadlock Detected!</strong>
                        <span>
                            The task pool contains cyclic dependency rules. The current algorithm "{selectedAlgo.toUpperCase()}" cannot schedule tasks due to deadlock. Please break the cycle in the Task Manager.
                        </span>
                    </div>
                </div>
            )}

            {/* Summary Statistics Cards */}
            <div className="stats-grid">
                <div className="stat-card glass-panel">
                    <div className="stat-icon-wrapper blue-gradient">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            viewBox="0 0 24 24">
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                            <path d="m9 12 2 2 4-4" />
                        </svg>
                    </div>
                    <div className="stat-details">
                        <h3>Total Tasks</h3>
                        <span className="stat-value">{totalTasks}</span>
                        <small>Tasks Loaded</small>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-icon-wrapper purple-gradient">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div className="stat-details">
                        <h3>Total Duration</h3>
                        <span className="stat-value">{totalDuration}</span>
                        <small>Units of Time</small>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-icon-wrapper green-gradient">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            viewBox="0 0 24 24">
                            <path d="m22 2-7 20-4-9-9-4Z" />
                            <path d="M22 2 11 13" />
                        </svg>
                    </div>
                    <div className="stat-details">
                        <h3>Best Algorithm</h3>
                        <span className="stat-value">{bestAlgo}</span>
                        <small>Lowest Avg Waiting Time</small>
                    </div>
                </div>
                <div className="stat-card glass-panel">
                    <div className="stat-icon-wrapper gold-gradient">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <div className="stat-details">
                        <h3>Busy Time Ratio</h3>
                        <span className="stat-value">{busyRatio}</span>
                        <small>Utilization Metric</small>
                    </div>
                </div>
            </div>

            <div className="grid-layout-2">
                {/* Gantt Timeline */}
                <div className="glass-panel main-chart-block">
                    <div className="block-header">
                        <h2>Active Gantt Chart Timeline</h2>
                        <div className="selector-wrapper">
                            <select
                                id="dashboard-algo-select"
                                className="form-select"
                                value={selectedAlgo}
                                onChange={e => setSelectedAlgo(e.target.value)}
                            >
                                <option value="sjf">Shortest Job First (SJF)</option>
                                <option value="priority">Priority Scheduling</option>
                                <option value="edf">Earliest Deadline First (EDF)</option>
                                <option value="fcfs">First Come First Served (FCFS)</option>
                                <option value="ljf">Longest Job First (LJF)</option>
                            </select>
                        </div>
                    </div>

                    <div className="timeline-container">
                        <div className="timeline-ruler" id="db-timeline-ruler">
                            {renderRulerTicks()}
                        </div>
                        <div className="gantt-chart-wrapper" id="db-gantt-chart">
                            {renderGanttBars()}
                        </div>
                    </div>

                    {!hasDeadlock && scheduleResult.scheduled.length > 0 && (
                        <div className="gantt-legend" id="db-gantt-legend">
                            {scheduleResult.scheduled.map(task => (
                                <div key={task.id} className="legend-item">
                                    <span className="legend-color" style={{ background: getTaskColor(task.id) }}></span>
                                    <span>
                                        <b>{task.id}</b>: {task.name} (d={task.duration}){' '}
                                        {task.predecessors.length > 0 && `[Wait: ${task.predecessors.join(', ')}]`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Performance Analytics metrics */}
                <div className="glass-panel side-metrics-block">
                    <h2>Performance Analytics</h2>
                    <p className="description">Current statistics based on the active scheduling algorithm.</p>

                    <div className="metrics-list">
                        <div className="metric-card">
                            <span className="metric-lbl">Total Completion Time</span>
                            <div className="metric-num-wrapper">
                                <span className="metric-num" id="db-metrics-completion">
                                    {metrics.totalCompletionTime}
                                </span>
                                <span className="unit">units</span>
                            </div>
                        </div>
                        <div className="metric-card highlight">
                            <span className="metric-lbl">Average Waiting Time</span>
                            <div className="metric-num-wrapper">
                                <span className="metric-num text-gradient-green" id="db-metrics-waiting">
                                    {metrics.averageWaitingTime}
                                </span>
                                <span className="unit">units</span>
                            </div>
                        </div>
                        <div className="metric-card">
                            <span className="metric-lbl">Average Turnaround Time</span>
                            <div className="metric-num-wrapper">
                                <span className="metric-num" id="db-metrics-turnaround">
                                    {metrics.averageTurnaroundTime}
                                </span>
                                <span className="unit">units</span>
                            </div>
                        </div>
                        <div className="metric-card">
                            <span className="metric-lbl">Max Delay / Lateness</span>
                            <div className="metric-num-wrapper">
                                <span className="metric-num text-gradient-red" id="db-metrics-lateness">
                                    {metrics.maxLateness}
                                </span>
                                <span className="unit">units</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';
import { 
    algorithms, 
    calculateMetrics, 
    getTaskColor 
} from '../utils/scheduler';

export default function SandboxTab({ tasks }) {
    const [selectedAlgo, setSelectedAlgo] = useState('sjf');
    const [currentStep, setCurrentStep] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [scheduledTasks, setScheduledTasks] = useState([]);
    const [unscheduledTasks, setUnscheduledTasks] = useState([]);
    const [timeline, setTimeline] = useState([0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speedMs, setSpeedMs] = useState(1000);
    const [isDeadlocked, setIsDeadlocked] = useState(false);

    const timerRef = useRef(null);
    const stateRef = useRef({ scheduledTasks, unscheduledTasks, currentTime, timeline, currentStep, isDeadlocked });

    // Sync refs for the timer callback
    useEffect(() => {
        stateRef.current = { scheduledTasks, unscheduledTasks, currentTime, timeline, currentStep, isDeadlocked };
    }, [scheduledTasks, unscheduledTasks, currentTime, timeline, currentStep, isDeadlocked]);

    // Reset Sandbox whenever the task pool changes or tab mounts
    const handleReset = () => {
        stopAutoPlay();
        setCurrentStep(0);
        setCurrentTime(0);
        setScheduledTasks([]);
        setUnscheduledTasks([...tasks]);
        setTimeline([0]);
        setIsDeadlocked(false);
    };

    useEffect(() => {
        handleReset();
        return () => stopAutoPlay();
    }, [tasks, selectedAlgo]);

    const stopAutoPlay = () => {
        setIsPlaying(false);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const runStep = () => {
        const state = stateRef.current;
        if (state.unscheduledTasks.length === 0 || state.isDeadlocked) {
            stopAutoPlay();
            return;
        }

        const scheduledIds = new Set(state.scheduledTasks.map(t => t.id));
        const ready = state.unscheduledTasks.filter(task => {
            const preds = task.predecessors || [];
            return preds.every(pId => scheduledIds.has(pId));
        });

        if (ready.length === 0) {
            setIsDeadlocked(true);
            stopAutoPlay();
            return;
        }

        const sorted = algorithms[selectedAlgo](ready);
        const chosenTask = sorted[0];

        const nextScheduled = [...state.scheduledTasks, chosenTask];
        const nextUnscheduled = state.unscheduledTasks.filter(t => t.id !== chosenTask.id);
        const nextTime = state.currentTime + chosenTask.duration;
        const nextTimeline = [...state.timeline, nextTime];

        setScheduledTasks(nextScheduled);
        setUnscheduledTasks(nextUnscheduled);
        setCurrentTime(nextTime);
        setTimeline(nextTimeline);
        setCurrentStep(prev => prev + 1);

        if (nextUnscheduled.length === 0) {
            stopAutoPlay();
        }
    };

    const handlePlayPause = () => {
        if (isPlaying) {
            stopAutoPlay();
        } else {
            const state = stateRef.current;
            if (state.unscheduledTasks.length === 0 || state.isDeadlocked) {
                // reset first if completed or deadlocked
                setCurrentStep(0);
                setCurrentTime(0);
                setScheduledTasks([]);
                setUnscheduledTasks([...tasks]);
                setTimeline([0]);
                setIsDeadlocked(false);
                setIsPlaying(true);
            } else {
                setIsPlaying(true);
            }
        }
    };

    // Keep play timer in sync
    useEffect(() => {
        if (isPlaying) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = setInterval(runStep, speedMs);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isPlaying, speedMs]);

    // Calculate metrics for scheduled tasks so far
    const metrics = calculateMetrics(scheduledTasks);
    const totalDuration = tasks.reduce((sum, t) => sum + t.duration, 0);

    // Calculate incremental Gantt ticks based on total duration of all tasks
    const renderSandboxRulerTicks = () => {
        if (totalDuration === 0) return null;

        let interval = 1;
        if (totalDuration > 15) interval = 2;
        if (totalDuration > 35) interval = 5;
        if (totalDuration > 75) interval = 10;
        if (totalDuration > 150) interval = 20;

        const ticks = [];
        for (let t = 0; t <= totalDuration; t += interval) {
            const pct = (t / totalDuration) * 100;
            ticks.push(
                <div key={t} className="timeline-tick-label" style={{ left: `${pct}%` }}>
                    {t}
                </div>
            );
        }
        if (totalDuration % interval !== 0) {
            ticks.push(
                <div key="max" className="timeline-tick-label" style={{ left: '100%' }}>
                    {totalDuration}
                </div>
            );
        }
        return ticks;
    };

    // Render scheduled bars so far
    const renderSandboxGanttBars = () => {
        if (tasks.length === 0) {
            return (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', width: '100%', padding: '20px 0' }}>
                    No tasks loaded. Go to "Manage Tasks" first.
                </div>
            );
        }

        let elapsed = 0;
        return scheduledTasks.map(task => {
            const start = elapsed;
            const finish = start + task.duration;
            elapsed = finish;

            const widthPct = (task.duration / totalDuration) * 100;
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
                        background: getTaskColor(task.id)
                    }}
                    title={tooltip}
                >
                    <strong>{task.id}</strong>
                    <span>{task.name}</span>
                </div>
            );
        });
    };

    // Narrative explanations helper
    const renderExplanation = () => {
        if (tasks.length === 0) {
            return (
                <>
                    <h4>Simulation Ready</h4>
                    <p>Please load some tasks in the Task Manager first.</p>
                </>
            );
        }

        if (isDeadlocked) {
            const remaining = unscheduledTasks.map(t => t.id).join(', ');
            return (
                <>
                    <h4 style={{ color: '#ef4444' }}>Deadlock Detected 🛑</h4>
                    <p>
                        <strong>Simulation halted!</strong> The remaining tasks (<b>{remaining}</b>) have cyclic dependencies. None of their predecessors can run, making scheduling impossible.
                    </p>
                </>
            );
        }

        if (currentStep === 0) {
            const scheduledIds = new Set(scheduledTasks.map(t => t.id));
            const ready = unscheduledTasks.filter(task => {
                const preds = task.predecessors || [];
                return preds.every(pId => scheduledIds.has(pId));
            });

            return (
                <>
                    <h4>Simulation Initiated</h4>
                    <p>
                        Ready queue contains <b>{ready.length}</b> tasks. The greedy choice is highlighted in violet.<br />
                        Click <b>Step Forward</b> or <b>Play</b> to start scheduling.
                    </p>
                </>
            );
        }

        if (currentStep === tasks.length) {
            return (
                <>
                    <h4>Simulation Completed! 🏁</h4>
                    <p>
                        All tasks scheduled successfully using <b>{selectedAlgo.toUpperCase()}</b>.<br />
                        • Final Completion Span: <b>{currentTime}</b> units.<br />
                        • Average Waiting Time: <b>{metrics.averageWaitingTime}</b> units.
                    </p>
                </>
            );
        }

        const lastTask = scheduledTasks[scheduledTasks.length - 1];
        if (!lastTask) return null;
        
        let explanationText = '';
        switch (selectedAlgo) {
            case 'sjf':
                explanationText = `Shortest Job First scheduled ${lastTask.id} because it had the shortest duration (${lastTask.duration} units) among all Ready tasks.`;
                break;
            case 'ljf':
                explanationText = `Longest Job First scheduled ${lastTask.id} because it had the longest duration (${lastTask.duration} units) among all Ready tasks.`;
                break;
            case 'priority':
                explanationText = `Priority Scheduling selected ${lastTask.id} because it carried the highest priority rank of ${lastTask.priority} among all Ready tasks.`;
                break;
            case 'edf':
                explanationText = `Earliest Deadline First scheduled ${lastTask.id} because its deadline of ${lastTask.deadline} was the closest among all Ready tasks.`;
                break;
            case 'fcfs':
                explanationText = `First-Come-First-Served queued ${lastTask.id} because it is the earliest task in the sequence order among all Ready tasks.`;
                break;
            default:
                break;
        }

        return (
            <>
                <h4>Step {currentStep}: Scheduled {lastTask.id}</h4>
                <p>
                    {explanationText}<br />
                    • Processor Time: <b>{currentTime - lastTask.duration} ➔ {currentTime}</b> units.<br />
                    • Unscheduled Tasks: <b>{unscheduledTasks.length}</b> left.
                </p>
            </>
        );
    };

    // Determine task card states in ready queue pool
    const scheduledIds = new Set(scheduledTasks.map(t => t.id));
    const readyTasks = unscheduledTasks.filter(task => {
        const preds = task.predecessors || [];
        return preds.every(pId => scheduledIds.has(pId));
    });

    let nextGreedyMatch = null;
    if (readyTasks.length > 0 && !isDeadlocked) {
        const sorted = algorithms[selectedAlgo](readyTasks);
        nextGreedyMatch = sorted[0];
    }

    const progressPct = tasks.length > 0 ? (currentStep / tasks.length) * 100 : 0;

    return (
        <div className="tab-view active-view" id="view-sandbox">
            <div className="grid-layout-1-2">
                {/* Sandbox Control Panel */}
                <div className="glass-panel sandbox-controls">
                    <h2>Simulation Controller</h2>
                    <p className="description">Select an algorithm to simulate execution step-by-step.</p>

                    <div className="control-group">
                        <label htmlFor="sandbox-algo-select" className="control-label">Algorithm</label>
                        <select
                            id="sandbox-algo-select"
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

                    <div className="playback-controls">
                        <button className="playback-btn" id="sb-reset" title="Reset Simulation" onClick={handleReset}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                            </svg>
                        </button>
                        <button className="playback-btn play-main" id="sb-play-pause" title="Play / Pause Auto-run" onClick={handlePlayPause}>
                            {isPlaying ? (
                                <span className="pause-icon">⏸</span>
                            ) : (
                                <span className="play-icon">▶</span>
                            )}
                        </button>
                        <button className="playback-btn" id="sb-step" title="Step Forward" onClick={runStep}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none"
                                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                strokeLinejoin="round" viewBox="0 0 24 24">
                                <polygon points="5 4 15 12 5 20 5 4" />
                                <line x1="19" y1="5" x2="19" y2="19" />
                            </svg>
                        </button>
                    </div>

                    <div className="control-group">
                        <label htmlFor="sandbox-speed" className="control-label">Simulation Speed</label>
                        <select
                            id="sandbox-speed"
                            className="form-select"
                            value={speedMs}
                            onChange={e => setSpeedMs(parseInt(e.target.value, 10))}
                        >
                            <option value="2000">Slow (2s per step)</option>
                            <option value="1000">Normal (1s per step)</option>
                            <option value="500">Fast (0.5s per step)</option>
                        </select>
                    </div>

                    <div className="sim-progress-block">
                        <div className="sim-progress-header">
                            <span>Execution Progress</span>
                            <span id="sim-step-text">{currentStep} / {tasks.length} Tasks</span>
                        </div>
                        <div className="sim-progress-bar-container">
                            <div className="sim-progress-bar-fill" id="sim-progress-fill" style={{ width: `${progressPct}%` }}></div>
                        </div>
                    </div>

                    <div 
                        className="explanation-box" 
                        id="sim-explanation-card"
                        style={isDeadlocked ? { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' } : {}}
                    >
                        {renderExplanation()}
                    </div>
                </div>

                {/* Sandbox Visualizer Board */}
                <div className="glass-panel sandbox-visualizer">
                    <h2>Step Execution Visualizer</h2>

                    <div className="sandbox-workspace">
                        {/* Left: Task Pool (Ready Queue) */}
                        <div className="workspace-section">
                            <h3>Ready Queue / Remaining Tasks</h3>
                            <div className="tasks-queue-pool" id="sandbox-pool">
                                {tasks.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', width: '100%', padding: '20px 0' }}>
                                        No tasks loaded. Go to "Manage Tasks" first.
                                    </div>
                                ) : (
                                    tasks.map(task => {
                                        const isScheduled = scheduledTasks.some(t => t.id === task.id);
                                        const isReady = !isScheduled && readyTasks.some(t => t.id === task.id);
                                        const isNextGreedy = nextGreedyMatch && nextGreedyMatch.id === task.id;

                                        let badgeText = '';
                                        let badgeColor = '';
                                        let extraClass = '';
                                        let inlineStyle = {};

                                        if (isScheduled) {
                                            badgeText = 'Scheduled';
                                            badgeColor = 'var(--text-muted)';
                                            extraClass = 'sim-scheduled';
                                        } else if (isNextGreedy) {
                                            badgeText = 'Greedy Optimal';
                                            badgeColor = 'var(--accent-color)';
                                            extraClass = 'greedy-match';
                                        } else if (isReady) {
                                            badgeText = 'Ready';
                                            badgeColor = '#10b981';
                                        } else {
                                            const missing = task.predecessors.filter(p => !scheduledIds.has(p));
                                            badgeText = `Locked (Wait: ${missing.join(', ')})`;
                                            badgeColor = '#f97316';
                                            extraClass = 'sim-locked';
                                            inlineStyle = { borderStyle: 'dashed', opacity: 0.5 };
                                        }

                                        return (
                                            <div
                                                key={task.id}
                                                className={`queue-task-card ${extraClass}`}
                                                style={inlineStyle}
                                            >
                                                <span className="queue-task-badge" style={{ background: badgeColor }}>
                                                    {badgeText}
                                                </span>
                                                <span className="queue-task-id" style={{ color: getTaskColor(task.id) }}>
                                                    {task.id}
                                                </span>
                                                <span className="queue-task-name">{task.name}</span>
                                                <div className="queue-task-metrics">
                                                    <span>Dur: <b>{task.duration}</b></span>
                                                    <span>DL: <b>{task.deadline}</b></span>
                                                    <span>Pri: <b>{task.priority}</b></span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Right: Running state & Gantt builds */}
                        <div className="workspace-section">
                            <h3>Scheduled Timeline</h3>
                            <div className="sandbox-gantt-container">
                                <div className="timeline-ruler" id="sb-timeline-ruler">
                                    {renderSandboxRulerTicks()}
                                </div>
                                <div className="gantt-chart-wrapper" id="sb-gantt-chart">
                                    {renderSandboxGanttBars()}
                                </div>
                            </div>

                            <div className="metric-cards-row">
                                <div className="mini-metric-card">
                                    <label>Time Elapsed</label>
                                    <span id="sb-metric-time">{currentTime}</span>
                                </div>
                                <div className="mini-metric-card">
                                    <label>Average Delay</label>
                                    <span id="sb-metric-avg-wait">{metrics.averageWaitingTime}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

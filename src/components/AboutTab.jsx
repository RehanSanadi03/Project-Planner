import React from 'react';

export default function AboutTab() {
    return (
        <div className="tab-view active-view" id="view-about">
            <div className="glass-panel explanation-panel">
                <div className="about-hero">
                    <img src="/icon.png" alt="OptiSchedule icon" className="about-icon" />
                    <h1>About OptiSchedule</h1>
                    <p className="lead">Exploring the optimization space of Single-Processor Scheduling using Greedy Selection Paradigms.</p>
                </div>

                <div className="about-content">
                    <h2>Greedy Heuristics Explained</h2>
                    <p>Greedy algorithms make the locally optimal choice at each stage with the hope of finding a
                        globally optimal solution. In single-machine task scheduling, different metrics (average
                        waiting time, meeting deadlines, priority order) require different greedy heuristics:</p>

                    <div className="algo-explanation-grid">
                        <div className="algo-explain-card">
                            <h3>Shortest Job First (SJF)</h3>
                            <p>Sorts tasks by shortest duration. <strong>Provably optimal</strong> for minimizing
                                average waiting time when all tasks are ready at time 0. However, it can cause
                                starvation for longer tasks.</p>
                        </div>
                        <div className="algo-explain-card">
                            <h3>Priority Scheduling</h3>
                            <p>Schedules tasks by priority values (lower numbers indicate higher urgency). If
                                priorities are equal, falls back to Shortest Job First. Best for ensuring vital
                                processes run first.</p>
                        </div>
                        <div className="algo-explain-card">
                            <h3>Earliest Deadline First (EDF)</h3>
                            <p>Sorts tasks by deadline. Minimizes maximum lateness. If there exists a schedule where
                                all tasks can complete before their deadline, EDF will find it.</p>
                        </div>
                        <div className="algo-explain-card">
                            <h3>First-Come-First-Served (FCFS)</h3>
                            <p>Schedules tasks in the order they arrive. Purely fair and has zero scheduling
                                overhead, but can cause the <em>convoy effect</em> where short tasks wait behind
                                long ones.</p>
                        </div>
                        <div className="algo-explain-card">
                            <h3>Longest Job First (LJF)</h3>
                            <p>Sorts tasks in descending order of duration. Used in parallel computing
                                load-balancing scenarios (e.g., schedule heavy tasks first so remaining work is
                                easier to balance), but suboptimal for single-processors.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

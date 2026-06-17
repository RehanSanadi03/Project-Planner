import React from 'react';
import { scheduleTasks, calculateMetrics } from '../utils/scheduler';

export default function CompareTab({ tasks }) {
    if (tasks.length === 0) {
        return (
            <div className="tab-view active-view" id="view-compare">
                <div className="grid-layout-2">
                    <div className="glass-panel comparison-chart-card">
                        <h2>Algorithm Comparison Chart</h2>
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0', width: '100%' }}>
                            No tasks to compile statistics. Add tasks to see chart.
                        </div>
                    </div>
                    <div className="glass-panel comparison-table-card">
                        <h2>Detailed Benchmark Matrix</h2>
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>
                            No benchmark data.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const algos = ['sjf', 'priority', 'edf', 'fcfs', 'ljf'];

    // Compile results for all 5 algorithms
    const results = algos.map(key => {
        const res = scheduleTasks(tasks, key);
        if (res.deadlockError) {
            return {
                key,
                name: key.toUpperCase(),
                deadlock: true,
                completion: 0,
                waiting: 0,
                turnaround: 0,
                lateness: 0
            };
        } else {
            const metrics = calculateMetrics(res.scheduled);
            return {
                key,
                name: key.toUpperCase(),
                deadlock: false,
                completion: metrics.totalCompletionTime,
                waiting: parseFloat(metrics.averageWaitingTime),
                turnaround: parseFloat(metrics.averageTurnaroundTime),
                lateness: metrics.maxLateness
            };
        }
    });

    const validResults = results.filter(r => !r.deadlock);
    const maxComp = validResults.length > 0 ? Math.max(...validResults.map(r => r.completion), 1) : 1;
    const maxWait = validResults.length > 0 ? Math.max(...validResults.map(r => r.waiting), 1) : 1;
    const maxVal = Math.max(maxComp, maxWait);

    // Calculate Y-Axis ticks based on max value
    let tickInterval = 5;
    if (maxVal <= 10) tickInterval = 2;
    else if (maxVal <= 25) tickInterval = 5;
    else if (maxVal <= 50) tickInterval = 10;
    else if (maxVal <= 100) tickInterval = 20;
    else tickInterval = 50;

    const ticks = [];
    for (let i = 0; i <= maxVal; i += tickInterval) {
        ticks.push(i);
    }
    if (ticks[ticks.length - 1] < maxVal) {
        ticks.push(Math.ceil(maxVal / tickInterval) * tickInterval);
    }
    const finalMax = ticks[ticks.length - 1] || 1;

    // Find best algorithm waiting time
    const bestWaitVal = validResults.length > 0 ? Math.min(...validResults.map(r => r.waiting)) : -1;

    return (
        <div className="tab-view active-view" id="view-compare">
            <div className="grid-layout-2">
                
                {/* Benchmark Bar Chart Card */}
                <div className="glass-panel comparison-chart-card">
                    <h2>Algorithm Comparison Chart</h2>
                    <p className="description">Visual benchmarking of average waiting times and total execution spans.</p>

                    <div className="chart-labels">
                        <span className="label-item">
                            <span className="chart-dot blue-dot"></span> Completion Time
                        </span>
                        <span className="label-item">
                            <span className="chart-dot green-dot"></span> Avg Waiting Time
                        </span>
                    </div>

                    <div className="compare-chart-wrapper" id="compare-chart-container">
                        {/* Y-Axis Labels */}
                        <div className="chart-y-axis">
                            {ticks.slice().reverse().map((tick, i) => (
                                <span key={i}>{tick}</span>
                            ))}
                        </div>

                        {/* Chart Area */}
                        <div className="chart-area-wrapper">
                            <div className="chart-grid-area">
                                {/* Grid lines */}
                                <div className="chart-grid-lines">
                                    {ticks.map((tick, i) => {
                                        const pct = (tick / finalMax) * 100;
                                        return (
                                            <div 
                                                key={i} 
                                                className="chart-grid-line" 
                                                style={{ bottom: `${pct}%` }}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Columns */}
                                <div className="chart-columns-container">
                                    {results.map(res => (
                                        <div key={res.name} className="chart-column-group">
                                            {res.deadlock ? (
                                                <div className="chart-deadlock-placeholder">
                                                    <span>⚠️</span>
                                                    <span>Deadlock</span>
                                                </div>
                                            ) : (
                                                <div className="chart-bars-pair">
                                                    <div 
                                                        className="compare-bar-column completion" 
                                                        style={{ height: `${Math.max((res.completion / finalMax) * 100, 2)}%` }}
                                                    >
                                                        <div className="bar-value-tooltip">Completion: {res.completion}</div>
                                                    </div>
                                                    <div 
                                                        className="compare-bar-column waiting" 
                                                        style={{ height: `${Math.max((res.waiting / finalMax) * 100, 2)}%` }}
                                                    >
                                                        <div className="bar-value-tooltip">Avg Waiting: {res.waiting}</div>
                                                    </div>
                                                </div>
                                            )}
                                            <div 
                                                className="chart-x-axis-label" 
                                                style={res.deadlock ? { color: '#ef4444' } : {}}
                                            >
                                                {res.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Benchmark Tabular Matrix Card */}
                <div className="glass-panel comparison-table-card">
                    <h2>Detailed Benchmark Matrix</h2>
                    <p className="description">Comparative statistics of all 5 scheduling paradigms.</p>

                    <div className="table-container">
                        <table className="premium-table compare-table" id="compare-metrics-table">
                            <thead>
                                <tr>
                                    <th>Algorithm</th>
                                    <th>Completion Time</th>
                                    <th>Avg Waiting</th>
                                    <th>Avg Turnaround</th>
                                    <th>Max Lateness</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map(res => {
                                    if (res.deadlock) {
                                        return (
                                            <tr key={res.name} style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                                                <td style={{ color: '#ef4444' }}><b>{res.name}</b> 🛑</td>
                                                <td colSpan="4" style={{ textAlign: 'center', fontWeight: 600, color: '#ef4444', fontSize: '13px' }}>
                                                    Cycle deadlock occurred. Execution halted.
                                                </td>
                                            </tr>
                                        );
                                    }

                                    const isBest = res.waiting === bestWaitVal;
                                    return (
                                        <tr key={res.name} className={isBest ? 'row-highlighted' : ''}>
                                            <td>
                                                <b>{res.name}</b> {isBest ? '⭐' : ''}
                                            </td>
                                            <td>{res.completion} units</td>
                                            <td className={isBest ? 'text-gradient-green' : ''} style={{ fontWeight: 700 }}>
                                                {res.waiting} units
                                            </td>
                                            <td>{res.turnaround} units</td>
                                            <td className={res.lateness > 0 ? 'text-gradient-red' : ''}>
                                                {res.lateness} units
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

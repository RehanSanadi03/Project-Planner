// ==========================================
// 1. DEFAULT DATA & CONSTANTS
// ==========================================

export const PROJECT_COLORS = [
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#a855f7', // Purple
    '#14b8a6', // Teal
    '#e11d48', // Rose
];

export const DEFAULT_PROJECTS = [
    { id: 'proj_1', name: 'Web App', color: '#6366f1', createdAt: Date.now() }
];

export const DEFAULT_TASKS = [
    { id: 'T1', name: 'UI Wireframing', duration: 3, deadline: 5, priority: 2, predecessors: [], projectId: 'proj_1' },
    { id: 'T2', name: 'Database Setup', duration: 5, deadline: 12, priority: 3, predecessors: [], projectId: 'proj_1' },
    { id: 'T3', name: 'API Integration', duration: 4, deadline: 10, priority: 2, predecessors: [], projectId: 'proj_1' },
    { id: 'T4', name: 'Auth Testing', duration: 2, deadline: 15, priority: 1, predecessors: [], projectId: 'proj_1' },
    { id: 'T5', name: 'Docs & Deployment', duration: 3, deadline: 20, priority: 4, predecessors: [], projectId: 'proj_1' }
];

export const TASK_COLORS = [
    'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue
    'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Pink/Rose
    'linear-gradient(135deg, #10b981 0%, #047857 100%)', // Emerald/Green
    'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', // Violet/Purple
    'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', // Amber/Gold
    'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', // Cyan
    'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', // Orange
    'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)', // Purple
    'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)', // Teal
    'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)'  // Rose Red
];

// Helper to get color gradient based on ID
export function getTaskColor(id) {
    const num = parseInt(id.replace(/\D/g, '')) || 0;
    return TASK_COLORS[(num - 1) % TASK_COLORS.length];
}

// ==========================================
// 2. SCENARIO PRESETS
// ==========================================

export const PRESETS = {
    balanced: [
        { id: 'T1', name: 'UI Wireframing', duration: 3, deadline: 5, priority: 2, predecessors: [] },
        { id: 'T2', name: 'Database Setup', duration: 5, deadline: 12, priority: 3, predecessors: [] },
        { id: 'T3', name: 'API Integration', duration: 4, deadline: 10, priority: 2, predecessors: [] },
        { id: 'T4', name: 'Auth Testing', duration: 2, deadline: 15, priority: 1, predecessors: [] },
        { id: 'T5', name: 'Docs & Deployment', duration: 3, deadline: 20, priority: 4, predecessors: [] }
    ],
    cpu: [
        { id: 'T1', name: 'Machine Learning Training', duration: 24, deadline: 45, priority: 3, predecessors: [] },
        { id: 'T2', name: 'Cache Warmup Script', duration: 2, deadline: 10, priority: 1, predecessors: [] },
        { id: 'T3', name: 'Index Verification', duration: 3, deadline: 15, priority: 2, predecessors: [] },
        { id: 'T4', name: 'Quick Analytics Agg', duration: 1, deadline: 8, priority: 2, predecessors: [] },
        { id: 'T5', name: 'Backup Compress', duration: 14, deadline: 40, priority: 4, predecessors: [] }
    ],
    deadlines: [
        { id: 'T1', name: 'Critical Bugfix Hotfix', duration: 3, deadline: 4, priority: 1, predecessors: [] },
        { id: 'T2', name: 'Server Migration Draft', duration: 5, deadline: 13, priority: 3, predecessors: [] },
        { id: 'T3', name: 'Log Rotation Cron', duration: 2, deadline: 6, priority: 4, predecessors: [] },
        { id: 'T4', name: 'Weekly Client Report', duration: 4, deadline: 9, priority: 2, predecessors: [] },
        { id: 'T5', name: 'Dockerise Application', duration: 5, deadline: 20, priority: 3, predecessors: [] }
    ],
    priority: [
        { id: 'T1', name: 'CEO Demo Script', duration: 10, deadline: 12, priority: 1, predecessors: [] },
        { id: 'T2', name: 'Normal User Registration', duration: 2, deadline: 25, priority: 3, predecessors: [] },
        { id: 'T3', name: 'Email Newsletter Blast', duration: 8, deadline: 40, priority: 5, predecessors: [] },
        { id: 'T4', name: 'Compliance System Check', duration: 4, deadline: 15, priority: 2, predecessors: [] },
        { id: 'T5', name: 'Audit Logging Hook', duration: 2, deadline: 30, priority: 4, predecessors: [] }
    ],
    dependencies: [
        { id: 'T1', name: 'System Architecture', duration: 4, deadline: 8, priority: 2, predecessors: [] },
        { id: 'T2', name: 'Database Schema', duration: 3, deadline: 12, priority: 3, predecessors: ['T1'] },
        { id: 'T3', name: 'API Implementation', duration: 5, deadline: 18, priority: 2, predecessors: ['T2'] },
        { id: 'T4', name: 'Frontend Client Layout', duration: 6, deadline: 20, priority: 4, predecessors: ['T1'] },
        { id: 'T5', name: 'E2E Testing & Verification', duration: 3, deadline: 25, priority: 1, predecessors: ['T3', 'T4'] }
    ]
};

// ==========================================
// 3. SCHEDULING ALGORITHMS
// ==========================================

export const algorithms = {
    sjf: (list) => [...list].sort((a, b) => a.duration - b.duration || a.id.localeCompare(b.id)),
    priority: (list) => [...list].sort((a, b) => a.priority - b.priority || a.duration - b.duration || a.id.localeCompare(b.id)),
    edf: (list) => [...list].sort((a, b) => a.deadline - b.deadline || a.duration - b.duration || a.id.localeCompare(b.id)),
    fcfs: (list) => [...list].sort((a, b) => {
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idA - idB;
    }),
    ljf: (list) => [...list].sort((a, b) => b.duration - a.duration || a.id.localeCompare(b.id))
};

// Topological Scheduler
export function scheduleTasks(list, algoKey) {
    let unscheduled = [...list];
    const scheduled = [];
    const scheduledIds = new Set();
    
    let steps = 0;
    const maxSteps = list.length * 2;

    while (unscheduled.length > 0) {
        steps++;
        if (steps > maxSteps) {
            return { scheduled: [], deadlockError: true };
        }

        const ready = unscheduled.filter(task => {
            const preds = task.predecessors || [];
            return preds.every(pId => scheduledIds.has(pId));
        });

        if (ready.length === 0) {
            return { scheduled: [], deadlockError: true };
        }

        const sortedReady = algorithms[algoKey](ready);
        const chosen = sortedReady[0];

        scheduled.push(chosen);
        scheduledIds.add(chosen.id);
        unscheduled = unscheduled.filter(t => t.id !== chosen.id);
    }

    return { scheduled, deadlockError: false };
}

// Metrics calculator
export function calculateMetrics(scheduledTasks) {
    let currentTime = 0;
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    let maxLateness = 0;
    const timeline = [0];
    
    scheduledTasks.forEach(task => {
        const start = currentTime;
        const finish = start + task.duration;
        const waiting = start; 
        const turnaround = finish;
        const lateness = Math.max(0, finish - task.deadline);
        
        currentTime = finish;
        timeline.push(currentTime);
        
        totalWaitingTime += waiting;
        totalTurnaroundTime += turnaround;
        maxLateness = Math.max(maxLateness, lateness);
    });

    const len = scheduledTasks.length || 1;
    return {
        totalCompletionTime: currentTime,
        averageWaitingTime: (totalWaitingTime / len).toFixed(2),
        averageTurnaroundTime: (totalTurnaroundTime / len).toFixed(2),
        maxLateness: maxLateness,
        timeline: timeline
    };
}

// Find dependency cycle (DFS path reconstructor) for Chatbot diagnosis
export function findDependencyCycle(taskList) {
    const adj = {};
    taskList.forEach(t => {
        adj[t.id] = t.predecessors || [];
    });
    
    const visited = {}; // undefined = unvisited, 1 = visiting, 2 = visited
    const parent = {};
    let cyclePath = null;

    function dfs(u) {
        visited[u] = 1;
        const neighbors = adj[u] || [];
        for (const v of neighbors) {
            // Since predecessors point in reverse (i.e. T2 depends on T1 means T1 runs first,
            // so dependency arrow is T2 -> T1), a cycle in dependency definitions:
            // T2 depends on T1, T1 depends on T2 => T2 -> T1 and T1 -> T2 is a cycle.
            if (visited[v] === 1) {
                const cycle = [v];
                let curr = u;
                while (curr !== v && curr) {
                    cycle.push(curr);
                    curr = parent[curr];
                }
                cycle.push(v);
                cycle.reverse();
                cyclePath = cycle;
                return true;
            } else if (!visited[v]) {
                parent[v] = u;
                if (dfs(v)) return true;
            }
        }
        visited[u] = 2;
        return false;
    }

    for (const t of taskList) {
        if (!visited[t.id]) {
            if (dfs(t.id)) break;
        }
    }
    return cyclePath;
}

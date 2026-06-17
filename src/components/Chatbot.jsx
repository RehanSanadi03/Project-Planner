import React, { useState, useEffect, useRef } from 'react';
import { 
    scheduleTasks, 
    calculateMetrics, 
    findDependencyCycle, 
    algorithms 
} from '../utils/scheduler';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

export default function Chatbot({ 
    tasks, 
    addTask, 
    loadPreset, 
    activeTab, 
    setActiveTab, 
    showToast,
    setSelectedAlgo 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 'welcome',
            sender: 'assistant',
            text: "Hi there! I am your OptiSchedule Assistant. 🧠 I can help you model and optimize your schedules. You can command me to automate actions, or just ask any questions about scheduling algorithms!",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            chips: [
                { label: '📊 Suggest best algorithm', value: 'suggest' },
                { label: '⛓️ Check for deadlocks', value: 'deadlock' },
                { label: '✏️ How to add task via chat?', value: 'how_to_add' },
                { label: '🚀 Load balanced scenario', value: 'load_balanced' }
            ]
        }
    ]);

    const messagesEndRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    const retryCountRef = useRef(0);
    const MAX_RETRIES = 2;

    const startRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onstart = () => {
            setIsListening(true);
            retryCountRef.current = 0;
            showToast('🎤 Listening...', 'Speak now — your words will appear in the input box.');
        };

        recognition.onresult = (event) => {
            const speechToText = event.results[0][0].transcript;
            setInputValue(speechToText);
            setIsListening(false);
            showToast('✅ Voice Captured', `"${speechToText}"`);
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);

            if (event.error === 'network') {
                // Network error: Chrome speech API couldn't reach Google servers
                // Retry up to MAX_RETRIES times automatically
                if (retryCountRef.current < MAX_RETRIES) {
                    retryCountRef.current += 1;
                    showToast('🔄 Retrying...', `Network issue — retrying (${retryCountRef.current}/${MAX_RETRIES})...`);
                    setTimeout(() => {
                        try {
                            const retry = new SpeechRecognition();
                            retry.lang = 'en-US';
                            retry.interimResults = false;
                            retry.maxAlternatives = 1;
                            retry.continuous = false;
                            retry.onstart = recognition.onstart;
                            retry.onresult = recognition.onresult;
                            retry.onerror = recognition.onerror;
                            retry.onend = recognition.onend;
                            recognitionRef.current = retry;
                            retry.start();
                        } catch {
                            setIsListening(false);
                        }
                    }, 800);
                } else {
                    setIsListening(false);
                    showToast(
                        '❌ Mic Unavailable',
                        'Chrome needs internet access to Google\'s servers for voice input. Check your connection or try typing instead.'
                    );
                }
            } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
                setIsListening(false);
                showToast('🚫 Mic Blocked', 'Microphone access was denied. Please allow mic access in your browser settings.');
            } else if (event.error === 'no-speech') {
                setIsListening(false);
                showToast('🔇 No Speech Detected', 'Nothing was heard. Click the mic and speak clearly.');
            } else if (event.error === 'aborted') {
                setIsListening(false); // Silently stop on manual abort
            } else {
                setIsListening(false);
                showToast('🎤 Voice Error', `Could not capture voice: ${event.error}. Please try again.`);
            }
        };

        recognition.onend = () => {
            // Only set false if not in a retry loop
            if (retryCountRef.current >= MAX_RETRIES || retryCountRef.current === 0) {
                setIsListening(false);
            }
        };

        recognitionRef.current = recognition;
        try {
            recognition.start();
        } catch (err) {
            setIsListening(false);
            showToast('Voice Error', 'Could not start microphone. Please try again.');
            console.error('Recognition start error:', err);
        }
    };

    const toggleListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast('Voice Unsupported', 'Speech recognition requires Chrome or Edge browser.');
            return;
        }

        if (isListening) {
            retryCountRef.current = MAX_RETRIES; // Prevent retry loop on manual stop
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch { /* ignore */ }
            }
            setIsListening(false);
        } else {
            retryCountRef.current = 0;
            startRecognition();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Format LLM message containing simple bold/monospace markdown syntax
    const formatMessageText = (text) => {
        return text.split('\n').map((line, idx) => {
            let content = line;
            
            // Format bold text: **text**
            const boldRegex = /\*\*(.*?)\*\*/g;
            const parts = [];
            let lastIndex = 0;
            let match;
            
            while ((match = boldRegex.exec(content)) !== null) {
                parts.push(content.substring(lastIndex, match.index));
                parts.push(<strong key={match.index}>{match[1]}</strong>);
                lastIndex = boldRegex.lastIndex;
            }
            parts.push(content.substring(lastIndex));
            content = parts.length > 1 ? parts : content;

            // Simple check for bullet points
            const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*');
            
            return (
                <div 
                    key={idx} 
                    style={{ 
                        paddingLeft: isBullet ? '12px' : '0px', 
                        textIndent: isBullet ? '-12px' : '0px',
                        marginBottom: '4px' 
                    }}
                >
                    {content}
                </div>
            );
        });
    };

    // Make network request to OpenRouter API
    const callOpenRouter = async (chatHistory) => {
        const systemPrompt = `You are the OptiSchedule Assistant, an AI scheduling optimizer agent integrated into the OptiSchedule application.
Your role is to help users manage, design, and optimize task schedules.

Current Application State:
- Active Tab View: "${activeTab}"
- Task Pool:
${JSON.stringify(tasks, null, 2)}

Your guidelines:
1. Help the user understand single-processor task scheduling, greedy heuristics (SJF, Priority, EDF, FCFS, LJF), and cycle deadlocks.
2. If the user asks about their current task pool, refer directly to the Task Pool JSON state above. Explain cycle paths or wait times precisely.
3. If they want to add a task, load a preset, or switch tabs, guide them on how to write text commands (e.g. "Add task API, duration 4") or click the quick chips.
4. Keep answers concise, highly readable, and formatted in clear markdown.`;

        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...chatHistory.map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }))
        ];

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'http://localhost:5173/',
                    'X-Title': 'OptiSchedule Planner'
                },
                body: JSON.stringify({
                    model: 'meta-llama/llama-3.1-8b-instruct',
                    messages: apiMessages
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
        } catch (err) {
            console.error("OpenRouter error:", err);
            return "I had trouble connecting to the AI brain. Please check your internet connection or verify the API key.";
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userText = inputValue.trim();
        setInputValue('');

        // 1. Add user message to state
        const userMsg = {
            id: 'msg_' + Date.now(),
            sender: 'user',
            text: userText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const nextMessages = [...messages, userMsg];
        setMessages(nextMessages);

        // 2. Trigger typing indicator
        setIsTyping(true);

        // 3. Check if command can be processed locally (faster + changes local state)
        const localReply = checkLocalCommands(userText);
        if (localReply) {
            setTimeout(() => {
                setIsTyping(false);
                setMessages(prev => [...prev, localReply]);
            }, 500);
            return;
        }

        // 4. Fallback to OpenRouter LLM Call
        const replyText = await callOpenRouter(nextMessages);
        setIsTyping(false);
        setMessages(prev => [...prev, {
            id: 'reply_' + Date.now(),
            sender: 'assistant',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
    };

    const handleChipClick = async (value) => {
        const chipLabels = {
            suggest: 'Suggest the best scheduling algorithm',
            deadlock: 'Check my task pool for cyclic deadlocks',
            how_to_add: 'How do I add tasks using text commands?',
            load_balanced: 'Load the balanced preset scenario'
        };
        
        const text = chipLabels[value] || value;
        const userMsg = {
            id: 'msg_' + Date.now(),
            sender: 'user',
            text: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        const nextMessages = [...messages, userMsg];
        setMessages(nextMessages);

        setIsTyping(true);

        // Run local processors for chips
        const localReply = processAction(value);
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [...prev, localReply]);
        }, 500);
    };

    // Check if message matches instant local UI commands
    const checkLocalCommands = (text) => {
        const lower = text.toLowerCase();

        // Switch Tabs
        if (lower.includes('go to') || lower.includes('show tab') || lower.includes('switch to')) {
            let target = '';
            let label = '';
            if (lower.includes('dashboard')) { target = 'dashboard'; label = 'Dashboard'; }
            else if (lower.includes('task') || lower.includes('manager')) { target = 'tasks'; label = 'Manage Tasks'; }
            else if (lower.includes('sandbox') || lower.includes('simulat')) { target = 'sandbox'; label = 'Step Sandbox'; }
            else if (lower.includes('compare') || lower.includes('arena') || lower.includes('benchmark')) { target = 'compare'; label = 'Compare Arena'; }
            else if (lower.includes('about') || lower.includes('help')) { target = 'about'; label = 'About Planner'; }

            if (target) {
                setActiveTab(target);
                return {
                    id: 'reply_' + Date.now(),
                    sender: 'assistant',
                    text: `Sure, I've switched your view to the **${label}** tab.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            }
        }

        // Scenario Preset loading
        if (lower.includes('load') && (lower.includes('preset') || lower.includes('scenario') || lower.includes('template'))) {
            let presetKey = '';
            if (lower.includes('balanced')) presetKey = 'balanced';
            else if (lower.includes('cpu') || lower.includes('bottleneck')) presetKey = 'cpu';
            else if (lower.includes('deadline')) presetKey = 'deadlines';
            else if (lower.includes('priority')) presetKey = 'priority';
            else if (lower.includes('chain') || lower.includes('depend')) presetKey = 'dependencies';

            if (presetKey) {
                loadPreset(presetKey);
                return {
                    id: 'reply_' + Date.now(),
                    sender: 'assistant',
                    text: `Successfully loaded the **${presetKey.toUpperCase()}** template. I've refreshed all metrics!`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            }
        }

        // Deadlocks diagnostics
        if (lower.includes('check deadlock') || lower.includes('any deadlock') || lower.includes('check for deadlock') || lower.trim() === 'deadlock') {
            return checkDeadlocks();
        }

        // Suggestions/optimization recommendations
        if (lower.includes('suggest algorithm') || lower.includes('which algorithm') || lower.includes('recommend algorithm') || lower.trim() === 'suggest') {
            return recommendAlgorithm();
        }

        // How to add task guide
        if (lower.includes('how to add task') || lower.includes('how do i add')) {
            return {
                id: 'reply_' + Date.now(),
                sender: 'assistant',
                text: "To add a task via text, type: \n`Add task [Name], duration [X], deadline [Y], priority [Z]` \n\n*Example:* \n`Add task Code Review, duration 3, deadline 10, priority 1` \n\n(Parameters are optional, duration defaults to 3, deadline to 15, and priority to 3)",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }

        // Task addition matcher
        if (lower.startsWith('add task') || lower.startsWith('create task')) {
            return parseAndAddTask(text);
        }

        return null; // Passes through to LLM
    };

    // Actions processors (for quick chips)
    const processAction = (action) => {
        if (action === 'suggest') return recommendAlgorithm();
        if (action === 'deadlock') return checkDeadlocks();
        if (action === 'how_to_add') {
            return {
                id: 'reply_' + Date.now(),
                sender: 'assistant',
                text: "To add a task via text, write: \n`Add task [Name], duration [X], deadline [Y], priority [Z]` \n\n*Example:* \n`Add task E2E Verification, duration 4, deadline 20, priority 2` \n\nI will automatically parse the parameters, create a new ID, and update the scheduler pool.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }
        if (action === 'load_balanced') {
            loadPreset('balanced');
            return {
                id: 'reply_' + Date.now(),
                sender: 'assistant',
                text: "Loaded the **Balanced Development** scenario template! All metrics have been recalculated.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }
        return {
            id: 'reply_' + Date.now(),
            sender: 'assistant',
            text: `Action "${action}" processed.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    };

    // Algorithm recommendation local logic
    const recommendAlgorithm = () => {
        if (tasks.length === 0) {
            return {
                id: 'reply_' + Date.now(),
                sender: 'assistant',
                text: "Your task pool is currently empty! Please add tasks first in the Task Manager or load a preset scenario.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }

        const metricsList = [];
        let hasDeadlock = false;

        Object.keys(algorithms).forEach(key => {
            const res = scheduleTasks(tasks, key);
            if (res.deadlockError) {
                hasDeadlock = true;
            } else {
                const metrics = calculateMetrics(res.scheduled);
                metricsList.push({
                    key: key,
                    name: key.toUpperCase(),
                    waitingTime: parseFloat(metrics.averageWaitingTime),
                    completionTime: metrics.totalCompletionTime
                });
            }
        });

        if (metricsList.length === 0 && hasDeadlock) {
            return {
                id: 'reply_' + Date.now(),
                sender: 'assistant',
                text: "⚠️ **Deadlock detected!** \nYour tasks cannot be scheduled due to a cycle. Go to 'Manage Tasks' or ask me to check for deadlocks to resolve it.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }

        metricsList.sort((a, b) => a.waitingTime - b.waitingTime);
        const best = metricsList[0];

        let summary = `I scheduled your **${tasks.length} tasks** across all algorithms. Here are the average waiting times:\n\n`;
        metricsList.forEach(m => {
            const isOptimal = m.key === best.key;
            summary += `• **${m.name}**: ${m.waitingTime} units ${isOptimal ? '⭐ (Optimal)' : ''}\n`;
        });

        const actionBtn = (
            <button 
                className="chatbot-action-btn"
                onClick={() => {
                    setSelectedAlgo(best.key);
                    setActiveTab('dashboard');
                    showToast('Algorithm Selected', `Switched dashboard scheduler to ${best.name}.`);
                }}
            >
                Apply {best.name} to Dashboard
            </button>
        );

        return {
            id: 'reply_' + Date.now(),
            sender: 'assistant',
            text: `${summary}\nI recommend using **${best.name}** since it provides the lowest average waiting time (${best.waitingTime} units).`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionElement: actionBtn
        };
    };

    // Cycle check local logic
    const checkDeadlocks = () => {
        if (tasks.length === 0) {
            return {
                id: 'reply_' + Date.now(),
                sender: 'assistant',
                text: "No tasks available to check. Go to the Task Manager to load a preset scenario.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }

        const cycle = findDependencyCycle(tasks);
        if (cycle) {
            const path = cycle.join(' ➔ ');
            return {
                id: 'reply_' + Date.now(),
                sender: 'assistant',
                text: `🛑 **Deadlock Found!** \nI found a cyclic dependency chain: \n\n**${path}**\n\nTask **${cycle[0]}** depends on succeeding tasks, which recursively point back to **${cycle[0]}**. \n\n**To resolve:** Go to 'Manage Tasks' and remove predecessors from one of these tasks to break the loop.`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        } else {
            return {
                id: 'reply_' + Date.now(),
                sender: 'assistant',
                text: "✅ **No Deadlocks!** \nI analyzed the predecessor constraints. Your task graph is an acyclic DAG. All algorithms can schedule the pool successfully.",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }
    };

    // Task parsing logic
    const parseAndAddTask = (text) => {
        const raw = text.replace(/^(add task|create task|add a task)\s+/i, '');
        const parts = raw.split(',');
        const name = parts[0]?.trim();

        if (!name) {
            return {
                id: 'reply_' + Date.now(),
                sender: 'assistant',
                text: "I couldn't identify the task name. Please write: \n`Add task [Name], duration [X]`",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
        }

        let duration = 3;
        let deadline = 15;
        let priority = 3;

        for (let i = 1; i < parts.length; i++) {
            const item = parts[i].toLowerCase();
            const num = parseInt(item.replace(/\D/g, ''), 10);
            if (!isNaN(num)) {
                if (item.includes('duration') || item.includes('dur') || item.includes('time')) {
                    duration = num;
                } else if (item.includes('deadline') || item.includes('dl') || item.includes('end')) {
                    deadline = num;
                } else if (item.includes('priority') || item.includes('pri') || item.includes('p')) {
                    priority = Math.max(1, Math.min(5, num));
                }
            }
        }

        const nextNum = tasks.reduce((max, t) => Math.max(max, parseInt(t.id.replace(/\D/g, '')) || 0), 0) + 1;
        const id = 'T' + nextNum;

        addTask({
            id,
            name,
            duration,
            deadline,
            priority,
            predecessors: []
        });

        return {
            id: 'reply_' + Date.now(),
            sender: 'assistant',
            text: `Added task **${id}: ${name}** successfully! \n• Duration: ${duration} units\n• Deadline: ${deadline}\n• Priority: ${priority}\n\nYou can see it now in the Task Manager.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
    };

    return (
        <>
            {/* Floating launcher toggler */}
            <button 
                className={`chatbot-launcher ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(prev => !prev)}
                title="Scheduling Assistant Chat"
            >
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                )}
            </button>

            {/* Chatbot Drawer panel */}
            {isOpen && (
                <div className="chatbot-drawer">
                    <header className="chatbot-header">
                        <div className="chatbot-title-group">
                            <span className="chatbot-status-dot"></span>
                            <h3>Scheduling Assistant</h3>
                        </div>
                        <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>&times;</button>
                    </header>

                    {/* Message Log */}
                    <div className="chatbot-messages">
                        {messages.map(msg => (
                            <div key={msg.id} className={`chat-bubble-wrapper ${msg.sender}`}>
                                <div className="chat-bubble">
                                    <div style={{ wordBreak: 'break-word' }}>
                                        {formatMessageText(msg.text)}
                                    </div>
                                    {msg.actionElement}
                                </div>
                                
                                <span className="chat-meta">{msg.timestamp}</span>

                                {msg.chips && msg.chips.length > 0 && (
                                    <div className="chat-chips-container">
                                        {msg.chips.map((chip, idx) => (
                                            <button 
                                                key={idx}
                                                className="chat-chip"
                                                onClick={() => handleChipClick(chip.value)}
                                            >
                                                {chip.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Typing Animation bubble */}
                        {isTyping && (
                            <div className="chat-bubble-wrapper assistant">
                                <div className="chat-bubble" style={{ padding: '8px 12px' }}>
                                    <div className="typing-indicator">
                                        <span className="typing-dot"></span>
                                        <span className="typing-dot"></span>
                                        <span className="typing-dot"></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form className="chatbot-input-area" onSubmit={handleSend}>
                        <input
                            type="text"
                            className="chatbot-input"
                            placeholder="Ask me anything (e.g. 'Explain convoy effect')..."
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                        />
                        <button 
                            type="button" 
                            className="chatbot-send-btn" 
                            style={{ 
                                background: isListening ? '#ef4444' : 'var(--hover-bg)', 
                                color: isListening ? '#ffffff' : 'var(--text-secondary)',
                                border: isListening ? 'none' : '1px solid var(--border-color)',
                                boxShadow: isListening ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none'
                            }}
                            onClick={toggleListening}
                            title="Speak input details"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: isListening ? 'typingBounce 1s infinite ease-in-out' : '' }}>
                                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="22"></line>
                            </svg>
                        </button>
                        <button type="submit" className="chatbot-send-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}

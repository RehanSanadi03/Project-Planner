import React from 'react';

export default function Sidebar({ activeTab, setActiveTab, theme, toggleTheme }) {
    const menuItems = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="9" rx="1"></rect>
                    <rect x="14" y="3" width="7" height="5" rx="1"></rect>
                    <rect x="14" y="12" width="7" height="9" rx="1"></rect>
                    <rect x="3" y="16" width="7" height="5" rx="1"></rect>
                </svg>
            )
        },
        {
            id: 'tasks',
            label: 'Manage Tasks',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
            )
        },
        {
            id: 'sandbox',
            label: 'Task Organizer',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
            )
        },
        {
            id: 'compare',
            label: 'Compare Algo',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18"></path>
                    <path d="m19 9-5 5-4-4-3 3"></path>
                </svg>
            )
        },
        {
            id: 'about',
            label: 'About Planner',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                </svg>
            )
        }
    ];

    return (
        <nav className="sidebar">
            <header className="sidebar-header">
                <div className="logo-wrapper">
                    <img src="/icon.png" alt="OptiSchedule Logo" className="app-logo" />
                    <div className="logo-text">
                        <span className="app-name">OptiSchedule</span>
                        <span className="app-tagline">Project-Planner</span>
                    </div>
                </div>
            </header>

            <ul className="menu-links">
                {menuItems.map(item => (
                    <li
                        key={item.id}
                        className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </li>
                ))}
            </ul>

            <div className="sidebar-footer">
                <button className="theme-toggle-btn" id="theme-toggle" onClick={toggleTheme}>
                    {theme === 'dark' ? (
                        <span className="sun-icon">☀️ Light Theme</span>
                    ) : (
                        <span className="moon-icon">🌙 Dark Theme</span>
                    )}
                </button>
            </div>
        </nav>
    );
}

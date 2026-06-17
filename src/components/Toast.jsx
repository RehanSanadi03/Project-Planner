import React, { useEffect } from 'react';

function ToastItem({ toast, onDismiss }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, 3000);
        return () => clearTimeout(timer);
    }, [toast.id, onDismiss]);

    return (
        <div 
            className="toast-alert glass-panel"
            style={{
                padding: '14px 20px',
                borderRadius: 'var(--border-radius-md)',
                boxShadow: 'var(--shadow-lg)',
                backgroundColor: 'var(--bg-secondary)',
                width: '280px',
                pointerEvents: 'auto',
                transition: 'opacity 0.4s ease'
            }}
        >
            <h4 style={{ fontWeight: 700, fontSize: '13px', color: 'var(--accent-color)', marginBottom: '4px' }}>
                {toast.title}
            </h4>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0 }}>
                {toast.message}
            </p>
        </div>
    );
}

export default function ToastContainer({ toasts, onDismiss }) {
    if (toasts.length === 0) return null;

    return (
        <div 
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                pointerEvents: 'none'
            }}
        >
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { useAgent } from '../context/AgentContext';

const SEVERITY_STYLES = {
    critical: {
        bg: 'bg-red-600',
        border: 'border-red-700',
        icon: 'warning',
        pulse: 'animate-pulse',
        sound: '🚨',
    },
    warning: {
        bg: 'bg-amber-500',
        border: 'border-amber-600',
        icon: 'info',
        pulse: '',
        sound: '⚠️',
    },
    expiry: {
        bg: 'bg-orange-500',
        border: 'border-orange-600',
        icon: 'calendar_today',
        pulse: '',
        sound: '📅',
    },
    info: {
        bg: 'bg-blue-500',
        border: 'border-blue-600',
        icon: 'trending_up',
        pulse: '',
        sound: '📈',
    },
};

export default function AgentNotifications() {
    const { notifications, dismissNotification, dismissAllNotifications } = useAgent();
    const [expanded, setExpanded] = useState(false);

    // Show latest 3 as floating toasts, rest in panel
    const toasts = notifications.slice(0, 3);
    const hasMore = notifications.length > 3;

    if (notifications.length === 0) return null;

    return (
        <>
            {/* Floating Toast Stack */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3 max-w-sm w-full pointer-events-none">
                {toasts.map((notif, idx) => {
                    const style = SEVERITY_STYLES[notif.severity] || SEVERITY_STYLES.info;
                    return (
                        <div
                            key={notif.id}
                            className={`pointer-events-auto ${style.bg} text-white rounded-xl shadow-2xl p-4 transform transition-all duration-500 ${style.pulse}`}
                            style={{
                                animation: `slideInRight 0.5s ease-out ${idx * 0.15}s both`,
                                opacity: 1 - idx * 0.1,
                            }}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    <span className="material-symbols-outlined text-lg">{notif.icon || style.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{notif.type}</span>
                                        <button
                                            onClick={() => dismissNotification(notif.id)}
                                            className="text-white/60 hover:text-white transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                    </div>
                                    <p className="text-sm font-semibold leading-tight mb-1">{notif.title}</p>
                                    <p className="text-xs opacity-90 leading-relaxed line-clamp-2">{notif.message}</p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[10px] opacity-60">→ {notif.recipient}</span>
                                        <span className="text-[10px] opacity-60">{notif.timeAgo}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* "More alerts" badge */}
                {hasMore && !expanded && (
                    <button
                        onClick={() => setExpanded(true)}
                        className="pointer-events-auto self-end bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:bg-slate-800 transition-colors"
                    >
                        +{notifications.length - 3} more alerts
                    </button>
                )}
            </div>

            {/* Expanded Panel */}
            {expanded && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end">
                    <div className="w-full max-w-md bg-white shadow-2xl h-full overflow-hidden flex flex-col animate-slideIn">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary">notifications_active</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Agent Alerts</h3>
                                    <p className="text-xs text-slate-500">{notifications.length} active notifications</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={dismissAllNotifications}
                                    className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                                >Clear All</button>
                                <button
                                    onClick={() => setExpanded(false)}
                                    className="p-1 rounded-full hover:bg-slate-100"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {notifications.map(notif => {
                                const style = SEVERITY_STYLES[notif.severity] || SEVERITY_STYLES.info;
                                return (
                                    <div
                                        key={notif.id}
                                        className={`border-l-4 ${notif.severity === 'critical' ? 'border-l-red-600' : notif.severity === 'warning' ? 'border-l-amber-500' : notif.severity === 'expiry' ? 'border-l-orange-500' : 'border-l-blue-500'} bg-white rounded-r-xl p-4 shadow-sm border border-slate-100`}
                                    >
                                        <div className="flex items-start justify-between mb-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${notif.severity === 'critical' ? 'text-red-600' : notif.severity === 'warning' ? 'text-amber-600' : notif.severity === 'expiry' ? 'text-orange-600' : 'text-blue-600'}`}>
                                                {notif.type}
                                            </span>
                                            <button onClick={() => dismissNotification(notif.id)} className="text-slate-400 hover:text-slate-600">
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-900 mb-1">{notif.title}</p>
                                        <p className="text-xs text-slate-600 leading-relaxed mb-2">{notif.message}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-slate-400">→ {notif.recipient}</span>
                                            {notif.actionRequired && (
                                                <button className={`text-[10px] font-bold px-2 py-1 rounded ${notif.severity === 'critical' ? 'bg-red-100 text-red-700' : notif.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {notif.actionLabel}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideIn { animation: slideIn 0.3s ease-out; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
        </>
    );
}

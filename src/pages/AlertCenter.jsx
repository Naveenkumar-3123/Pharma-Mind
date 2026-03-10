import React, { useState } from 'react';
import { useAgent } from '../context/AgentContext';

const filterOptions = ['All', 'Critical', 'Warning', 'Expiry', 'Info'];

export default function AlertCenter() {
    const { agentData, isScanning, lastScanTime, scanCount, runScan } = useAgent();
    const [activeFilter, setActiveFilter] = useState('All');
    const [dismissedAlerts, setDismissedAlerts] = useState([]);

    const allAlerts = agentData?.tieredAlerts || [];
    const filtered = allAlerts
        .filter(a => !dismissedAlerts.includes(a.id))
        .filter(a => {
            if (activeFilter === 'All') return true;
            if (activeFilter === 'Info') return a.type === 'INFO' || a.type === 'SUGGESTION';
            return a.type.toUpperCase() === activeFilter.toUpperCase();
        });

    const dismiss = (id) => setDismissedAlerts(prev => [...prev, id]);

    const getAlertStyle = (severity) => {
        const map = {
            critical: { border: 'border-l-red-600', bg: 'bg-red-50', text: 'text-red-600', btnBg: 'bg-red-600 hover:bg-red-700' },
            warning: { border: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-600', btnBg: 'bg-amber-500 hover:bg-amber-600' },
            expiry: { border: 'border-l-orange-500', bg: 'bg-orange-50', text: 'text-orange-600', btnBg: 'bg-orange-500 hover:bg-orange-600' },
            info: { border: 'border-l-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', btnBg: 'bg-blue-500 hover:bg-blue-600' },
        };
        return map[severity] || map.info;
    };

    const critCount = allAlerts.filter(a => a.type === 'CRITICAL').length;
    const warnCount = allAlerts.filter(a => a.type === 'WARNING').length;
    const expCount = allAlerts.filter(a => a.type === 'EXPIRY').length;
    const infoCount = allAlerts.filter(a => a.type === 'INFO' || a.type === 'SUGGESTION').length;

    return (
        <>
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-900">Alert Center</h2>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isScanning ? 'bg-blue-50 border border-blue-100' : 'bg-green-50 border border-green-100'}`}>
                        <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-blue-500 animate-ping' : 'bg-safe animate-pulse'}`}></span>
                        <span className={`text-xs font-medium ${isScanning ? 'text-blue-600' : 'text-safe'}`}>
                            {isScanning ? 'Scanning...' : 'Agent Active'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                        Scan #{scanCount} • {lastScanTime ? lastScanTime.toLocaleTimeString() : '—'}
                    </span>
                    <button
                        onClick={runScan}
                        disabled={isScanning}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors"
                    >
                        <span className={`material-symbols-outlined text-sm ${isScanning ? 'animate-spin' : ''}`}>refresh</span>
                        Re-scan Now
                    </button>
                </div>
            </header>

            {/* Agent Summary Cards */}
            {agentData && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <SummaryCard label="Critical" count={critCount} color="red" icon="warning" />
                    <SummaryCard label="Warnings" count={warnCount} color="amber" icon="info" />
                    <SummaryCard label="Expiry Risks" count={expCount} color="orange" icon="calendar_today" />
                    <SummaryCard label="Info / Suggestions" count={infoCount} color="blue" icon="lightbulb" />
                </div>
            )}

            {/* Auto-PO and Transfer Summary */}
            {agentData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
                    {/* Auto-drafted POs */}
                    {agentData.autoPOs.length > 0 && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-primary">robot_2</span>
                                <h4 className="font-bold text-sm text-primary">Auto-Drafted Purchase Orders ({agentData.autoPOs.length})</h4>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {agentData.autoPOs.map(po => (
                                    <div key={po.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-100 text-xs">
                                        <div>
                                            <p className="font-semibold">{po.drugName}</p>
                                            <p className="text-slate-500">{po.vendorName} • {po.quantity} units</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-primary">₹{po.totalCost.toLocaleString('en-IN')}</p>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${po.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' : po.priority === 'HIGH' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>{po.priority}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* Transfer Suggestions */}
                    {agentData.transferSuggestions.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-emerald-600">swap_horiz</span>
                                <h4 className="font-bold text-sm text-emerald-700">Transfer Suggestions ({agentData.transferSuggestions.length})</h4>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {agentData.transferSuggestions.slice(0, 5).map((t, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-slate-100 text-xs">
                                        <div>
                                            <p className="font-semibold">{t.drugName}</p>
                                            <p className="text-slate-500">{t.currentDepartment} → {t.bestTarget}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-600">{t.quantity} units</p>
                                            <p className="text-[9px] text-slate-400">{t.daysToExpiry}d to expiry</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-2 mb-6">
                {filterOptions.map(opt => (
                    <button
                        key={opt}
                        onClick={() => setActiveFilter(opt)}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeFilter === opt ? 'bg-primary text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {opt}
                    </button>
                ))}
                <span className="ml-auto text-xs text-slate-400">{filtered.length} alerts</span>
            </div>

            {/* Alert Cards */}
            <div className="space-y-3 max-w-4xl">
                {filtered.map(alert => {
                    const style = getAlertStyle(alert.severity);
                    return (
                        <div key={alert.id} className={`bg-white border-l-4 ${style.border} rounded-xl shadow-sm p-5 flex gap-5 transition-all hover:shadow-md hover:translate-x-1`}>
                            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${style.bg} flex items-center justify-center`}>
                                <span className={`material-symbols-outlined ${style.text}`}>{alert.icon}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>{alert.type}</span>
                                    <span className="text-xs text-slate-400">{alert.timeAgo}</span>
                                </div>
                                <p className="text-sm font-bold text-slate-900 mb-1">{alert.title}</p>
                                <p className="text-sm text-slate-600 leading-relaxed mb-3">{alert.message}</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-slate-400 mr-auto">→ {alert.recipient}</span>
                                    {alert.actionRequired && (
                                        <button className={`px-4 py-1.5 ${style.btnBg} text-white text-xs font-bold rounded-lg transition-colors`}>{alert.actionLabel}</button>
                                    )}
                                    <button onClick={() => dismiss(alert.id)} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Dismiss</button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                        <span className="material-symbols-outlined text-4xl text-slate-300">notifications_off</span>
                        <p className="text-slate-500 mt-2">No alerts in this category.</p>
                    </div>
                )}
            </div>
        </>
    );
}

function SummaryCard({ label, count, color, icon }) {
    return (
        <div className={`bg-${color}-50 border border-${color}-100 rounded-xl p-4`}>
            <div className="flex items-center justify-between">
                <span className={`material-symbols-outlined text-${color}-600 text-lg`}>{icon}</span>
                <span className={`text-2xl font-black text-${color}-700`}>{count}</span>
            </div>
            <p className={`text-xs font-semibold text-${color}-600 mt-1`}>{label}</p>
        </div>
    );
}

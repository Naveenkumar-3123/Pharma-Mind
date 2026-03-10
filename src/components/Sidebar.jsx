import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAgent } from '../context/AgentContext';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/dashboard/inventory', label: 'Inventory', icon: 'inventory_2' },
    { path: '/dashboard/procurement', label: 'Procurement', icon: 'shopping_cart' },
    { path: '/dashboard/expiry', label: 'Expiry Manager', icon: 'event_busy' },
    { path: '/dashboard/slow-movement', label: 'Slow Movement', icon: 'speed' },
    { path: '/dashboard/financial', label: 'Financial Summary', icon: 'query_stats' },
    { path: '/dashboard/community', label: 'Community Board', icon: 'groups' },
    { path: '/dashboard/patient-care', label: 'Patient Care', icon: 'medical_services' },
    { path: '/dashboard/dealer-network', label: 'Dealer Network', icon: 'hub' },
    { path: '/dashboard/alerts', label: 'Alert Center', icon: 'notifications_active' },
];

export default function Sidebar() {
    const { agentData, isScanning, notifications } = useAgent();
    const criticalCount = agentData?.summary?.criticalAlerts || 0;
    const unreadCount = notifications.length;

    return (
        <aside className="w-[240px] bg-white border-r border-slate-200 flex flex-col fixed h-full z-20">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <div className="bg-primary rounded-lg p-1.5 flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-2xl">pill</span>
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">PharmAgent</h1>
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-1">Inventory AI</p>
                </div>
            </div>

            {/* Agent Status */}
            <div className="mx-3 mb-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-blue-500 animate-ping' : 'bg-safe animate-pulse'}`}></span>
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                        {isScanning ? 'Scanning...' : 'Agent Active'}
                    </span>
                </div>
                <p className="text-[10px] text-slate-500">
                    {agentData ? `${agentData.summary.totalAlerts} alerts • ${agentData.summary.autoPOsGenerated} auto-POs` : 'Initializing...'}
                </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/dashboard'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative ${isActive
                                ? 'bg-primary/10 text-primary border-r-[3px] border-primary'
                                : 'text-slate-600 hover:bg-slate-100'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <span className={`material-symbols-outlined text-[22px] ${isActive ? 'fill-icon' : ''}`}>{item.icon}</span>
                                <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                                {/* Badge for alerts */}
                                {item.path === '/dashboard/alerts' && criticalCount > 0 && (
                                    <span className="absolute right-3 bg-critical text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                        {criticalCount}
                                    </span>
                                )}
                                {item.path === '/dashboard/procurement' && agentData?.autoPOs?.length > 0 && (
                                    <span className="absolute right-3 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                        {agentData.autoPOs.length}
                                    </span>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom section */}
            <div className="p-4 border-t border-slate-100 space-y-1">
                <NavLink
                    to="/dashboard/settings"
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 hover:bg-slate-100 font-medium'
                        }`
                    }
                >
                    <span className="material-symbols-outlined text-[22px]">settings</span>
                    <span className="text-sm">Settings</span>
                </NavLink>
                <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-slate-50">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">DM</div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">Dr. Meera S.</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">Chief Pharmacist</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}

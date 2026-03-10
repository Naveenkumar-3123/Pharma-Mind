import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('profile');
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('pharmAgent_resolvedShop');
            navigate('/pharmacy-login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Pharmacy Profile', icon: 'storefront' },
        { id: 'users', label: 'User Management', icon: 'manage_accounts' },
        { id: 'notifications', label: 'Notifications', icon: 'notifications_active' },
        { id: 'appearance', label: 'Appearance', icon: 'palette' },
    ];

    return (
        <div className="max-w-5xl mx-auto pb-12 animate-fade-in">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h2>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Manage your pharmacy profile and system preferences
                    </p>
                </div>
                <button className="px-5 py-2.5 bg-primary text-white rounded-xl shadow-md font-semibold text-sm hover:bg-primary-dark transition-colors flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    Save Changes
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Vertical Tabs Sidebar */}
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-1 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                    <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preferences</p>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-primary/10 text-primary font-bold shadow-sm'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[20px] ${activeTab === tab.id ? 'fill-icon' : ''}`}>
                                {tab.icon}
                            </span>
                            {tab.label}
                        </button>
                    ))}

                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                        <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session & Security</p>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all border border-transparent hover:border-slate-200"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                            Sign Out
                        </button>

                        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
                            <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                            Delete Pharmacy
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 w-full bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[500px]">

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="p-8 animate-fade-in-up origin-top">
                            <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">storefront</span>
                                Pharmacy Profile
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pharmacy Name</label>
                                    <input type="text" defaultValue="City Pharmacy" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Referral Code (Public)</label>
                                    <div className="relative">
                                        <input type="text" defaultValue="APO" readOnly className="w-full bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 text-slate-600 font-mono tracking-widest uppercase cursor-not-allowed" />
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Email</label>
                                    <input type="email" defaultValue="admin@citypharmacy.com" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Phone</label>
                                    <input type="tel" defaultValue="+1 (555) 019-2831" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900" />
                                </div>
                            </div>

                            <h4 className="font-bold text-sm text-slate-900 mb-4 border-b pb-2">Location Information</h4>
                            <div className="space-y-2 mb-4">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Street Address</label>
                                <input type="text" defaultValue="123 Care Avenue, Med District" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900" />
                            </div>
                        </div>
                    )}

                    {/* USERS TAB */}
                    {activeTab === 'users' && (
                        <div className="p-8 animate-fade-in-up origin-top">
                            <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">manage_accounts</span>
                                User Management
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">Manage staff accounts and their access levels.</p>

                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center justify-between mb-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex flex-col items-center justify-center font-bold text-primary">DM</div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">Dr. Meera S.</p>
                                        <p className="text-xs text-slate-500">meera@citypharmacy.com</p>
                                    </div>
                                </div>
                                <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">Admin</span>
                            </div>

                            <button className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all font-semibold text-sm">
                                <span className="material-symbols-outlined">add</span>
                                Invite New Staff Member
                            </button>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <div className="p-8 animate-fade-in-up origin-top">
                            <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">notifications_active</span>
                                Alert Preferences
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">Low Stock Auto-Purchase Orders</p>
                                        <p className="text-xs text-slate-500 mt-1">Automatically notify vendors when stock reaches critical levels.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">Patient Expiry Reminders</p>
                                        <p className="text-xs text-slate-500 mt-1">Send SMS/Email reminders to patients 3 days before meds run out.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">Dealer Network Transfer Requests</p>
                                        <p className="text-xs text-slate-500 mt-1">Receive alerts when connected pharmacies request stock.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* APPEARANCE TAB */}
                    {activeTab === 'appearance' && (
                        <div className="p-8 animate-fade-in-up origin-top">
                            <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">palette</span>
                                Appearance Settings
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">Customize the look and feel of the dashboard.</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="border-2 border-primary bg-primary/5 rounded-xl p-4 cursor-pointer relative overflow-hidden">
                                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white">
                                        <span className="material-symbols-outlined text-[14px]">check</span>
                                    </div>
                                    <div className="h-24 bg-white border border-slate-200 rounded-lg mb-3 shadow-sm flex">
                                        <div className="w-1/4 bg-slate-100 h-full border-r border-slate-200 flex flex-col gap-1 p-2">
                                            <div className="w-full h-2 bg-slate-200 rounded-full"></div>
                                            <div className="w-3/4 h-2 bg-slate-200 rounded-full"></div>
                                        </div>
                                        <div className="flex-1 bg-white p-2">
                                            <div className="w-1/2 h-3 bg-primary/20 rounded-full mb-2"></div>
                                            <div className="w-full h-12 bg-slate-50 rounded-md border border-slate-100"></div>
                                        </div>
                                    </div>
                                    <p className="font-bold text-sm text-center text-primary">Light Theme (Default)</p>
                                </div>

                                <div className="border border-slate-200 hover:border-slate-400 bg-white rounded-xl p-4 cursor-pointer relative overflow-hidden transition-colors">
                                    <div className="h-24 bg-slate-900 border border-slate-700 rounded-lg mb-3 shadow-sm flex">
                                        <div className="w-1/4 bg-slate-800 h-full border-r border-slate-700 flex flex-col gap-1 p-2">
                                            <div className="w-full h-2 bg-slate-600 rounded-full"></div>
                                            <div className="w-3/4 h-2 bg-slate-600 rounded-full"></div>
                                        </div>
                                        <div className="flex-1 bg-slate-900 p-2">
                                            <div className="w-1/2 h-3 bg-primary/40 rounded-full mb-2"></div>
                                            <div className="w-full h-12 bg-slate-800 rounded-md border border-slate-700"></div>
                                        </div>
                                    </div>
                                    <p className="font-bold text-sm text-center text-slate-600">Dark Theme (Coming Soon)</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

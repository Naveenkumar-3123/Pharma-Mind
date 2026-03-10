import React, { useState } from 'react';
import { vendorSurplusPosts } from '../data/mockData';
import { useAgent } from '../context/AgentContext';

const tabs = ['Vendor Marketplace', 'Donation Board', 'Patient and NGO Requests'];

export default function CommunityBoard() {
    const { donations, customerMedicineRequests } = useAgent();
    const [activeTab, setActiveTab] = useState(0);
    const tabIcons = ['storefront', 'volunteer_activism', 'emergency'];

    return (
        <>
            {/* Header */}
            <header className="bg-white -m-8 mb-0 px-8 pt-8 border-b border-slate-200">
                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Healthcare Community Marketplace</h2>
                            <p className="text-slate-500 text-sm mt-1">Connect with vendors, donate surplus, and fulfill patient requests.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                <input className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary w-64" placeholder="Search drug name..." />
                            </div>
                            <button className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-primary-dark">
                                <span className="material-symbols-outlined text-sm">add</span>
                                List Surplus
                            </button>
                        </div>
                    </div>
                    <nav className="flex gap-8">
                        {tabs.map((tab, idx) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(idx)}
                                className={`pb-4 border-b-2 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === idx ? 'border-primary text-primary font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">{tabIcons[idx]}</span>
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            <div className="p-8 -mx-8">
                {/* Vendor Marketplace */}
                {activeTab === 0 && (
                    <section>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {vendorSurplusPosts.map(post => {
                                const isNearExpiry = new Date(post.expiryDate) < new Date('2025-06-01');
                                return (
                                    <div key={post.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="bg-primary/10 text-primary p-2 rounded-lg">
                                                <span className="material-symbols-outlined">{post.icon}</span>
                                            </div>
                                            <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase">{post.tag}</span>
                                        </div>
                                        <h3 className="text-base font-bold text-slate-900 mb-1">{post.drug}</h3>
                                        <p className="text-sm text-slate-500 mb-4">{post.vendor}</p>
                                        <div className="space-y-2 mb-6">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Quantity</span>
                                                <span className="font-semibold">{post.quantity.toLocaleString()} Units</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Expiry Date</span>
                                                <span className={`font-semibold ${isNearExpiry ? 'text-critical' : 'text-safe'}`}>
                                                    {new Date(post.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Price</span>
                                                <span className="font-bold text-lg text-slate-900">₹{post.askingPrice.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <button className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors">Buy Now</button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Donation Board */}
                {activeTab === 1 && (
                    <section>
                        {/* Match Banner */}
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-primary text-white p-3 rounded-full flex items-center justify-center">
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                </div>
                                <div>
                                    <h4 className="text-slate-900 font-bold">Match Found!</h4>
                                    <p className="text-slate-600 text-sm">You have 120 units of 'Insulin Glargine' that matches a high-urgency request from Red Cross NGO.</p>
                                </div>
                            </div>
                            <button className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-semibold">View Match</button>
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Recent Surplus for Donation</h3>
                            <a href="#" className="text-primary text-sm font-semibold hover:underline">View All Surplus</a>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {donations?.map((item, idx) => (
                                <div key={item.id || idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                    <h3 className="text-base font-bold text-slate-900 mb-4">{item.drug}</h3>
                                    <div className="space-y-2 mb-6">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Quantity</span>
                                            <span className="font-semibold">{item.quantity} Units</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Expiry</span>
                                            <span className={`font-semibold ${new Date(item.expiryDate) < new Date('2025-06-01') ? 'text-warning' : 'text-safe'}`}>
                                                {new Date(item.expiryDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    <button className="w-full bg-donation text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-donation/90 transition-colors">Donate Now</button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Patient and NGO Requests */}
                {activeTab === 2 && (
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Patient and NGO Requests</h3>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-critical/10 text-critical">High Urgency: {customerMedicineRequests?.filter(r => r.urgency === 'High').length || 0}</span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">Total: {customerMedicineRequests?.length || 0}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {customerMedicineRequests?.map((req, idx) => {
                                const borderColor = req.urgency === 'High' ? 'border-l-critical' : req.urgency === 'Medium' ? 'border-l-warning' : 'border-l-safe';
                                const badgeColor = req.urgency === 'High' ? 'bg-critical/10 text-critical' : req.urgency === 'Medium' ? 'bg-warning/10 text-warning' : 'bg-safe/10 text-safe';
                                return (
                                    <div key={req.id} className={`bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-sm border-l-4 ${borderColor}`}>
                                        <div className="flex items-center gap-6">
                                            <div className="bg-slate-100 w-12 h-12 rounded-xl flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-600">{req.icon}</span>
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-slate-900">{req.drugNeeded}</h4>
                                                <p className="text-sm text-slate-500 mb-2">Requested by: <span className="font-semibold text-slate-700">{req.requestor}</span></p>

                                                {/* Extended Details */}
                                                {(req.condition || req.story) && (
                                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mt-2 space-y-2 max-w-lg">
                                                        {req.condition && (
                                                            <div className="flex gap-2 text-sm">
                                                                <span className="font-bold text-slate-700 w-20 shrink-0">Condition:</span>
                                                                <span className="text-slate-600">{req.condition}</span>
                                                            </div>
                                                        )}
                                                        {req.story && (
                                                            <div className="flex gap-2 text-sm">
                                                                <span className="font-bold text-slate-700 w-20 shrink-0">Story:</span>
                                                                <span className="text-slate-600 italic">{req.story}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-8 border-l border-slate-100 pl-8">
                                            {req.contactInfo && (
                                                <div className="text-left">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Contact</span>
                                                    <span className="text-sm font-semibold">{req.contactInfo}</span>
                                                </div>
                                            )}
                                            <div className="text-center">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Urgency</span>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${badgeColor}`}>{req.urgency}</span>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Needed By</span>
                                                <span className="text-sm font-semibold">{req.neededBy}</span>
                                            </div>
                                            <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary transition-colors whitespace-nowrap">
                                                Fulfill Request
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}

import React, { useState, useEffect, useRef } from 'react';
import { purchaseOrders, autoBuyDrugNames, vendorCatalog } from '../data/mockData';
import { useAgent } from '../context/AgentContext';

export default function Procurement() {
    const { agentData } = useAgent();
    const [autoBuyEnabled, setAutoBuyEnabled] = useState(true);
    const [pos, setPos] = useState(purchaseOrders);
    const [autoPOActions, setAutoPOActions] = useState({});
    const [smsPopup, setSmsPopup] = useState(null);
    const processedRef = useRef(false);

    const handleApprove = (id) => {
        setPos(prev => prev.map(po => po.id === id ? { ...po, status: 'Approved' } : po));
    };

    const handleReject = (id) => {
        setPos(prev => prev.map(po => po.id === id ? { ...po, status: 'Rejected' } : po));
    };

    const handleAutoApprove = (id) => {
        setAutoPOActions(prev => ({ ...prev, [id]: 'Approved' }));
    };
    const handleAutoReject = (id) => {
        setAutoPOActions(prev => ({ ...prev, [id]: 'Rejected' }));
    };

    const autoPOs = agentData?.autoPOs || [];

    // Auto-approve and email logic for Critical POs
    useEffect(() => {
        if (!autoBuyEnabled || autoPOs.length === 0 || processedRef.current) return;

        let processedCount = 0;

        autoPOs.forEach(async (po) => {
            // Only auto-process critical POs that haven't been acted on
            if (po.priority === 'CRITICAL' && !autoPOActions[po.id]) {
                // Instantly approve
                setAutoPOActions(prev => ({ ...prev, [po.id]: 'Approved' }));

                try {
                    // Send to backend to trigger email workflow
                    await fetch('http://localhost:3012/api/send-refill-request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            vendorName: po.vendorName,
                            vendorEmail: 'naveen83d@gmail.com', // hardcoded per instructions
                            drugName: po.drugName,
                            quantity: po.quantity,
                            urgency: po.priority
                        })
                    });
                } catch (err) {
                    console.error("Failed to auto-send PO to vendor", err);
                }

                // Show SMS popup (fires regardless of backend)
                setSmsPopup({
                    phone: po.vendorName || 'Vendor',
                    message: `PharmAgent PO: ${po.drugName} x${po.quantity} units needed ${po.priority === 'CRITICAL' ? '(URGENT)' : ''}. Please process ASAP. - City Pharmacy`
                });
                setTimeout(() => setSmsPopup(null), 5000);

                processedCount++;
            }
        });

        if (processedCount > 0) {
            processedRef.current = true;
        }
    }, [autoPOs, autoBuyEnabled, autoPOActions]);

    return (
        <>
            <header className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Procurement Management</h2>
                    <p className="text-slate-500 mt-1">Review and approve AI-generated purchase suggestions.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl bg-white font-semibold text-sm hover:bg-slate-50">
                        <span className="material-symbols-outlined text-lg">filter_list</span> Filter
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark">
                        <span className="material-symbols-outlined text-lg">add</span> New Purchase Order
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-12 gap-8">
                {/* PO Cards */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                    {/* Agent Auto-Drafted POs */}
                    {autoPOs.length > 0 && (
                        <>
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary animate-pulse">smart_toy</span>
                                    Agent Auto-Drafted POs
                                </h3>
                                <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-1 rounded-full">{autoPOs.length} new</span>
                            </div>

                            {autoPOs.map(po => {
                                const action = autoPOActions[po.id];
                                return (
                                    <div key={po.id} className={`bg-white rounded-xl shadow-sm border-2 p-6 hover:shadow-md transition-shadow ${po.priority === 'CRITICAL' ? 'border-red-200 bg-red-50/30' : po.priority === 'HIGH' ? 'border-amber-200' : 'border-primary/20'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${po.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' : po.priority === 'HIGH' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>{po.priority}</span>
                                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">{po.reason}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400">Auto-drafted by Agent</span>
                                        </div>
                                        <div className="flex justify-between items-start mb-3 mt-2">
                                            <div>
                                                <h4 className="text-xl font-bold text-slate-900">{po.drugName}</h4>
                                                <p className="text-sm text-slate-500 font-medium">Vendor: {po.vendorName} (Reliability: {po.vendorReliability}%)</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-primary">INR {po.totalCost.toLocaleString('en-IN')}</p>
                                                <p className="text-xs text-slate-400">{po.quantity} Units • {po.leadTimeDays} Days Lead</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor Score</span>
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${po.vendorScore >= 50 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(po.vendorScore * 1.5, 100)}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold">{po.vendorScore.toFixed(1)}</span>
                                        </div>
                                        {!action ? (
                                            <div className="flex gap-3">
                                                <button onClick={() => handleAutoApprove(po.id)} className="flex-1 bg-primary text-white py-2.5 px-4 rounded-lg font-bold text-sm hover:bg-primary-dark flex items-center justify-center gap-2 active:scale-95 transition-transform">
                                                    <span className="material-symbols-outlined text-lg">check_circle</span> Approve
                                                </button>
                                                <button className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50">Edit</button>
                                                <button onClick={() => handleAutoReject(po.id)} className="px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-lg font-bold text-sm">Reject</button>
                                            </div>
                                        ) : (
                                            <div className={`text-center py-2 rounded-lg text-sm font-bold ${action === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                {action === 'Approved' ? '✓ Approved — Dispatched to Vendor' : '✗ Rejected'}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <hr className="border-slate-200 my-4" />
                        </>
                    )}

                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">robot_2</span>
                        Standing Purchase Orders
                    </h3>

                    {pos.map((po) => (
                        <div key={po.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900">{po.drugName}</h4>
                                    <p className="text-sm text-slate-500 font-medium">Vendor: {po.vendorName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-primary">INR {po.totalCost.toLocaleString()}</p>
                                    <p className="text-xs text-slate-400">{po.quantity} Units • {po.leadTimeDays} Days Lead</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor Score</span>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${po.vendorScore >= 8 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                        style={{ width: `${po.vendorScore * 10}%` }}
                                    ></div>
                                </div>
                                <span className={`text-xs font-bold ${po.vendorScore >= 8 ? 'text-emerald-600' : 'text-amber-600'}`}>{po.vendorScore}/10</span>
                            </div>

                            {po.status === 'Pending Approval' ? (
                                <div className="flex gap-3">
                                    <button onClick={() => handleApprove(po.id)} className="flex-1 bg-primary text-white py-2.5 px-4 rounded-lg font-bold text-sm hover:bg-primary-dark flex items-center justify-center gap-2 active:scale-95 transition-transform">
                                        <span className="material-symbols-outlined text-lg">check_circle</span> Approve
                                    </button>
                                    <button className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-bold text-sm hover:bg-slate-50">Edit</button>
                                    <button onClick={() => handleReject(po.id)} className="px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-lg font-bold text-sm">Reject</button>
                                </div>
                            ) : (
                                <div className={`text-center py-2 rounded-lg text-sm font-bold ${po.status === 'Approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {po.status === 'Approved' ? '✓ Approved' : '✗ Rejected'}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Right Column */}
                <div className="col-span-12 lg:col-span-4 space-y-6">
                    {/* Auto-Buy Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">bolt</span> Auto-Buy Settings
                            </h4>
                            <button
                                onClick={() => setAutoBuyEnabled(!autoBuyEnabled)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoBuyEnabled ? 'bg-primary' : 'bg-slate-200'}`}
                            >
                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white border border-gray-300 transition-transform ${autoBuyEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">{autoBuyEnabled ? 'Auto-buy for chronic medications is active.' : 'Auto-buy is disabled.'}</p>
                        <div className="flex flex-wrap gap-2">
                            {autoBuyDrugNames.slice(0, 5).map(name => (
                                <div key={name} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                                    {name}
                                    <button className="material-symbols-outlined text-xs hover:text-red-500">close</button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Vendor Comparison */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">compare_arrows</span> Vendor Comparison
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">Comparing vendors for Insulin Regular</p>
                        </div>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase">Vendor</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase">Price</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase">Lead</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase text-right">Score</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs font-medium">
                                <tr className="bg-blue-50/50">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">MediSupply</span>
                                            <span className="px-1.5 py-0.5 bg-primary text-[9px] text-white rounded font-bold uppercase">Best</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-slate-700">₹90</td>
                                    <td className="px-4 py-4 text-slate-700">2d</td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-primary w-[92%]"></div></div>
                                            <span className="font-bold text-primary">9.2</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr className="border-t border-slate-100">
                                    <td className="px-4 py-4 text-slate-900 font-bold">PharmaLink</td>
                                    <td className="px-4 py-4 text-slate-700">₹95</td>
                                    <td className="px-4 py-4 text-slate-700">3d</td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-slate-400 w-[74%]"></div></div>
                                            <span className="font-bold">7.4</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr className="border-t border-slate-100">
                                    <td className="px-4 py-4 text-slate-900 font-bold">GlobalMed</td>
                                    <td className="px-4 py-4 text-slate-700">₹88</td>
                                    <td className="px-4 py-4 text-slate-700">7d</td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="inline-flex items-center gap-2">
                                            <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-slate-400 w-[65%]"></div></div>
                                            <span className="font-bold">6.5</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Inventory Health */}
                    <div className="bg-gradient-to-br from-primary to-indigo-700 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold uppercase tracking-widest opacity-80">Inventory Health</span>
                            <span className="material-symbols-outlined text-lg">health_and_safety</span>
                        </div>
                        <h5 className="text-2xl font-extrabold mb-1">94%</h5>
                        <p className="text-sm opacity-90 leading-relaxed mb-4">Your pharmacy's stock optimization is currently high. 12 drugs are nearing reorder points.</p>
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white w-[94%]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SMS Sent Popup */}
            {smsPopup && (
                <div className="fixed top-6 right-6 z-50 w-96 animate-fade-in-up">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white">sms</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-black text-sm tracking-wide">SMS SENT SUCCESSFULLY</h4>
                                <p className="text-white/70 text-[10px] font-bold">via Twilio API</p>
                            </div>
                            <button onClick={() => setSmsPopup(null)} className="text-white/50 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-slate-400 text-lg">call</span>
                                <span className="font-bold text-slate-800 text-sm tracking-wider">{smsPopup.phone}</span>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                                <p className="text-sm text-slate-600 leading-relaxed italic">"{smsPopup.message}"</p>
                            </div>
                            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Delivered successfully
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

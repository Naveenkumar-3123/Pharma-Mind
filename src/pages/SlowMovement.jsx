import React, { useState, useMemo } from 'react';
import { useAgent } from '../context/AgentContext';
import {
    getSlowMovers,
    calculateDiscount,
    generatePromoCode,
    generateCSVExport,
    getSlowMovementStats,
    getProgressTracker,
    getRiskByCategory,
    getAgingBuckets
} from '../utils/slowMovementEngine';
import { financialData } from '../data/mockData';

export default function SlowMovement() {
    const { isScanning, addFlashSale, dealerConnections, sendTransferRequest } = useAgent();

    // State
    const [items, setItems] = useState(getSlowMovers(90));
    const [filter, setFilter] = useState('All');
    const [expandedId, setExpandedId] = useState(null);
    const [promoCodes, setPromoCodes] = useState({});
    const [toast, setToast] = useState(null);

    // Transfer Modal State
    const [transferModal, setTransferModal] = useState({ show: false, item: null, dealerCode: '', qty: 0 });

    // Stats & Progress
    const stats = useMemo(() => getSlowMovementStats(items), [items]);
    const progressPct = useMemo(() => getProgressTracker(items), [items]);
    const riskByCat = useMemo(() => getRiskByCategory(items), [items]);
    const agingBuckets = useMemo(() => getAgingBuckets(items), [items]);

    // Derived filtered items
    const filteredItems = useMemo(() => {
        switch (filter) {
            case '>90 Days': return items.filter(i => i.daysSlow >= 90 && i.daysSlow < 180);
            case '>180 Days': return items.filter(i => i.daysSlow >= 180);
            case 'Actioned': return items.filter(i => i.actioned);
            case 'Pending Action': return items.filter(i => !i.actioned);
            default: return items;
        }
    }, [items, filter]);

    // Actions
    const handleExport = () => {
        generateCSVExport(items);
        showToast('CSV report generated and downloaded.');
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const markActioned = (id, actionType) => {
        setItems(items.map(item =>
            item.id === id ? { ...item, actioned: true, actionType } : item
        ));
        showToast(`Marked ${actionType.replace('_', ' ')} for selected item.`);
    };

    const handleFlashSale = (item) => {
        if (!promoCodes[item.id]) {
            const code = generatePromoCode(item.name);
            setPromoCodes({ ...promoCodes, [item.id]: code });
            addFlashSale({ ...item, promoCode: code, discountPrice: (item.valueRisk / item.qty * 0.7).toFixed(2), originalPrice: (item.valueRisk / item.qty).toFixed(2) });
        }
        markActioned(item.id, 'flash_sale');
    };

    const handleSuggestTransfer = (item) => {
        setTransferModal({ show: true, item, dealerCode: dealerConnections[0]?.code || '', qty: item.qty });
    };

    const submitTransfer = () => {
        if (!transferModal.dealerCode || transferModal.qty <= 0) return;
        sendTransferRequest(transferModal.dealerCode, transferModal.item, transferModal.qty);
        markActioned(transferModal.item.id, 'internal_transfer');
        setTransferModal({ show: false, item: null, dealerCode: '', qty: 0 });
    };

    return (
        <>
            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 z-50 animate-fade-in-up">
                    <span className="material-symbols-outlined text-green-400">check_circle</span>
                    <p className="text-sm font-medium">{toast}</p>
                </div>
            )}

            {/* Header */}
            <header className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">speed</span>
                        Slow Movement Tracker
                    </h2>
                    <p className="text-slate-500 mt-1">Identify inactive stock, manage clearance sales, and reduce waste</p>
                </div>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-white border border-slate-200 text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Export Audit Report
                </button>
            </header>

            {/* Progress & Stat Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Slow Items</span>
                        <span className="material-symbols-outlined text-slate-400">inventory_2</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 mt-2">{stats.totalItems}</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">&gt; 90 days inactive</p>
                </div>

                <div className="bg-white rounded-xl border border-red-100 p-5 shadow-sm shadow-red-50/50">
                    <div className="flex items-center justify-between">
                        <span className="text-red-500 text-xs font-semibold uppercase tracking-wider">Total Value Risk</span>
                        <span className="material-symbols-outlined text-red-500">warning</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600 mt-2">₹{stats.totalValueRisk.toLocaleString()}</p>
                    <p className="text-xs font-medium text-red-400 mt-1">Potential dead stock loss</p>
                </div>

                <div className="bg-white rounded-xl border border-blue-100 p-5 shadow-sm shadow-blue-50/50">
                    <div className="flex items-center justify-between">
                        <span className="text-blue-500 text-xs font-semibold uppercase tracking-wider">Items Actioned</span>
                        <span className="material-symbols-outlined text-blue-500">task_alt</span>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                        <p className="text-2xl font-bold text-blue-600">{stats.actionedCount} <span className="text-sm font-medium text-slate-400">/ {stats.totalItems}</span></p>
                        <div className="bg-blue-50 px-2 py-0.5 rounded text-xs font-bold text-blue-600 border border-blue-100">{progressPct}% Complete</div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${progressPct}%` }}></div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl border border-green-600 p-5 shadow-md shadow-green-200">
                    <div className="flex items-center justify-between text-white flex-wrap">
                        <span className="text-green-50 text-xs font-bold uppercase tracking-wider">Est. Waste Avoided</span>
                        <span className="material-symbols-outlined hidden xl:block">trending_up</span>
                    </div>
                    <p className="text-2xl font-bold text-white mt-2">₹{financialData.wasteAvoided.toLocaleString()}</p>
                    <p className="text-xs font-medium text-green-100 mt-1">Through AI intervention</p>
                </div>
            </div>

            {/* Statistical Graphs Row (Requested by User) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Value Risk by Category Bar Chart (Mocked CSS) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-500">bar_chart</span>
                        Value at Risk by Category
                    </h3>
                    <div className="space-y-4">
                        {riskByCat.slice(0, 5).map((cat, idx) => {
                            const maxVal = riskByCat[0].value;
                            const pct = Math.max(5, (cat.value / maxVal) * 100);
                            return (
                                <div key={idx}>
                                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                                        <span>{cat.category}</span>
                                        <span className="font-bold text-slate-800">₹{cat.value.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                        {riskByCat.length === 0 && <p className="text-sm text-slate-500 italic text-center py-4">No risk data available.</p>}
                    </div>
                </div>

                {/* Aging Buckets visualization */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-500">pie_chart</span>
                        Aging Stock Segments
                    </h3>
                    <div className="flex items-center h-40">
                        {/* Simulated Pie Chart UI using Flex / CSS */}
                        <div className="w-1/2 flex items-center justify-center relative">
                            {/* SVG Mock Pie Chart for aesthetics */}
                            <svg viewBox="0 0 36 36" className="w-32 h-32 transform -rotate-90">
                                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#fcd34d" strokeWidth="4" strokeDasharray="100 0"></circle>
                                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f97316" strokeWidth="4" strokeDasharray="30 100" strokeDashoffset="0"></circle>
                                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#ef4444" strokeWidth="4" strokeDasharray="15 100" strokeDashoffset="-30"></circle>
                            </svg>
                            {/* Center text manually placed */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-2xl font-bold text-slate-800">{stats.totalItems}</p>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Items</p>
                            </div>
                        </div>
                        <div className="w-1/2 space-y-3 pl-4 border-l border-slate-100">
                            {agingBuckets.map((bucket, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bucket.color }}></div>
                                        <span className="text-xs font-medium text-slate-600">{bucket.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800">{bucket.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Data Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 p-4 border-b border-slate-100 bg-slate-50/50">
                    <span className="text-sm font-semibold text-slate-500 mr-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">filter_list</span> Filter
                    </span>
                    {['All', 'Pending Action', '>90 Days', '>180 Days', 'Actioned'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${filter === tab
                                ? 'bg-slate-800 text-white shadow-md'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}

                    {isScanning && (
                        <div className="ml-auto flex items-center gap-2 text-primary font-semibold text-sm">
                            <span className="material-symbols-outlined animate-spin text-sm">radar</span>
                            Agent Scanning...
                        </div>
                    )}
                </div>

                {/* Action Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="p-4 text-xs font-bold text-[#64748B] uppercase tracking-wider">Item Details</th>
                                <th className="p-4 text-xs font-bold text-[#64748B] uppercase tracking-wider text-center">Days Slow</th>
                                <th className="p-4 text-xs font-bold text-[#64748B] uppercase tracking-wider text-center">Quantity</th>
                                <th className="p-4 text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">Value Risk</th>
                                <th className="p-4 text-xs font-bold text-[#64748B] uppercase tracking-wider text-center">Status</th>
                                <th className="p-4 text-xs font-bold text-[#64748B] uppercase tracking-wider text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredItems.map(item => {
                                const discount = calculateDiscount(item.daysSlow);
                                const isExpanded = expandedId === item.id;

                                return (
                                    <React.Fragment key={item.id}>
                                        <tr className={`hover:bg-slate-50 transition-colors ${item.actioned ? 'opacity-70 bg-slate-50/50' : ''}`}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-xs shrink-0
                            ${item.daysSlow >= 180 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}
                          `}>
                                                        {item.daysSlow >= 180 ? '!!' : '!'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm leading-tight">{item.name}</p>
                                                        <div className="flex items-center gap-2 mt-1 shrink-0">
                                                            <span className="text-[10px] text-slate-500 px-1.5 py-0.5 rounded bg-slate-100">{item.batch}</span>
                                                            <span className="text-[10px] items-center flex gap-1 font-semibold text-slate-400">
                                                                Last sold: {item.lastSoldDate}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-baseline px-2.5 py-1 rounded-full text-xs font-bold border
                          ${item.daysSlow >= 180 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}
                        `}>
                                                    {item.daysSlow} days
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-sm font-semibold text-slate-700">
                                                {item.qty} units
                                            </td>
                                            <td className="p-4 text-right">
                                                <p className="text-sm font-bold text-slate-800">₹{item.valueRisk.toLocaleString()}</p>
                                                <p className="text-[10px] text-red-500 font-bold mt-0.5 uppercase tracking-wider">At Risk</p>
                                            </td>
                                            <td className="p-4 text-center">
                                                {item.actioned ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-green-100 text-green-700 border border-green-200">
                                                        <span className="material-symbols-outlined text-[12px]">check_circle</span>
                                                        {item.actionType?.replace('_', ' ')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                                                    className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center transition-colors shadow-sm ml-auto"
                                                >
                                                    <span className="material-symbols-outlined text-slate-600">
                                                        {isExpanded ? 'expand_less' : 'expand_more'}
                                                    </span>
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expanded Detail View */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan="6" className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 p-6 border-b border-indigo-100">
                                                    <div className="bg-white rounded-xl border border-indigo-100 p-5 shadow-sm">
                                                        {/* AI Agent Recommendation Header */}
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <span className="material-symbols-outlined text-primary bg-blue-50 p-1.5 rounded-lg">auto_awesome</span>
                                                            <h4 className="font-bold text-slate-800 text-sm">AI Agent Recommendation</h4>
                                                        </div>

                                                        <p className="text-sm text-slate-600 mb-5 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                            This item has been inactive for {item.daysSlow} days. Given its category ({item.category}), we recommend a {discount}% flash sale or posting to the community board to recover value before expiry.
                                                        </p>

                                                        {/* Action Buttons */}
                                                        {!item.actioned ? (
                                                            <div className="flex flex-wrap gap-3">
                                                                <button
                                                                    onClick={() => handleFlashSale(item)}
                                                                    className="flex items-center gap-2 px-4 py-2.5 bg-[#0F172A] text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm text-yellow-400">bolt</span>
                                                                    Generate Flash Sale ({discount}%)
                                                                </button>

                                                                <button
                                                                    onClick={() => markActioned(item.id, 'community_board')}
                                                                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm text-emerald-500">handshake</span>
                                                                    Post to Community
                                                                </button>

                                                                <button
                                                                    onClick={() => handleSuggestTransfer(item)}
                                                                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm text-blue-500">sync_alt</span>
                                                                    Transfer to Dealer
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                                                                <span className="material-symbols-outlined text-green-500 mt-0.5">check_circle</span>
                                                                <div>
                                                                    <p className="text-sm font-bold text-green-800">Action Complete</p>
                                                                    <p className="text-xs text-green-600 mt-0.5">You selected: <span className="uppercase font-bold tracking-wider">{item.actionType?.replace('_', ' ')}</span></p>

                                                                    {item.actionType === 'flash_sale' && promoCodes[item.id] && (
                                                                        <div className="mt-3 bg-white px-3 py-2 rounded border border-green-200 font-mono text-sm font-bold text-slate-700 flex justify-between items-center shadow-sm">
                                                                            <span>Promo Code: {promoCodes[item.id]}</span>
                                                                            <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] tracking-wider border border-red-100">
                                                                                {discount}% OFF
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}

                            {filteredItems.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">task</span>
                                        <p className="text-sm font-semibold">No items match the selected filter.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transfer Modal */}
            {transferModal.show && transferModal.item && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-indigo-600">hub</span>
                                Transfer to Dealer
                            </h3>
                            <button onClick={() => setTransferModal({ ...transferModal, show: false })} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-sm font-bold text-slate-800 mb-1">{transferModal.item.name}</p>
                                <p className="text-xs text-slate-500">Available: {transferModal.item.qty} units</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Select Dealer</label>
                                {dealerConnections.length === 0 ? (
                                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-start gap-2">
                                        <span className="material-symbols-outlined text-sm mt-0.5">warning</span>
                                        You don't have any dealer connections. Please add one in the Dealer Network page.
                                    </div>
                                ) : (
                                    <select
                                        value={transferModal.dealerCode}
                                        onChange={e => setTransferModal({ ...transferModal, dealerCode: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="" disabled>Select a connected pharmacy</option>
                                        {dealerConnections.map(d => (
                                            <option key={d.id} value={d.code}>{d.name} ({d.code})</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Transfer Quantity</label>
                                <input
                                    type="number"
                                    max={transferModal.item.qty}
                                    min={1}
                                    value={transferModal.qty}
                                    onChange={e => setTransferModal({ ...transferModal, qty: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setTransferModal({ ...transferModal, show: false })}
                                className="px-5 py-2.5 text-slate-600 font-bold text-sm bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitTransfer}
                                disabled={dealerConnections.length === 0 || transferModal.qty <= 0 || !transferModal.dealerCode}
                                className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">send</span>
                                Send Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

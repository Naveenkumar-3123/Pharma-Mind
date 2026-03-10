import React, { useState } from 'react';
import { getExpiryRiskDrugs } from '../utils/inventoryEngine';
import { generatePromoCode } from '../utils/slowMovementEngine';
import { useNavigate } from 'react-router-dom';
import { useAgent } from '../context/AgentContext';

export default function ExpiryManager() {
    const navigate = useNavigate();
    const { addDonation, addFlashSale } = useAgent();
    const [activeFilter, setActiveFilter] = useState('HIGH');
    const [expiryDrugs, setExpiryDrugs] = useState(getExpiryRiskDrugs());

    const handleAction = (drugId, actionStr, drugObj) => {
        if (actionStr === 'Donation' && drugObj) {
            addDonation(drugObj.name, drugObj.riskBatch.quantity, drugObj.riskBatch.expiryDate);
        } else if (actionStr === 'FlashDiscount' && drugObj) {
            const code = generatePromoCode(drugObj.name);
            addFlashSale({
                name: drugObj.name,
                batch: drugObj.riskBatch.batchId,
                qty: Math.min(drugObj.riskBatch.quantity, 100),
                discountPrice: (drugObj.valueAtRisk * 0.5).toFixed(2),
                originalPrice: drugObj.valueAtRisk.toFixed(2),
                promoCode: code,
            });
        }

        // Remove it from the list here
        setExpiryDrugs(prev => prev.filter(d => d.id !== drugId));
        console.log(`Action [${actionStr}] performed on drug ID: ${drugId}`);
    };

    const highCount = expiryDrugs.filter(d => d.expiryRisk === 'HIGH').length;
    const medCount = expiryDrugs.filter(d => d.expiryRisk === 'MEDIUM').length;
    const totalExposure = expiryDrugs.reduce((s, d) => s + d.riskBatch.financialExposure, 0);

    const filtered = activeFilter === 'ALL' ? expiryDrugs : expiryDrugs.filter(d => d.expiryRisk === activeFilter);

    return (
        <>
            <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Expiry Risk Management</h2>
                <p className="text-slate-500 mt-1">Predictive analysis and inventory optimization for near-expiry pharmaceuticals.</p>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Left Column: Risk Categories */}
                <div className="col-span-12 lg:col-span-3 space-y-4">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Risk Levels</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => setActiveFilter('HIGH')}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${activeFilter === 'HIGH' ? 'bg-red-50 border border-red-100 ring-2 ring-red-200' : 'bg-white border border-slate-200 hover:bg-red-50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-600"></div>
                                    <span className={`text-sm font-bold ${activeFilter === 'HIGH' ? 'text-red-700' : 'text-slate-700'}`}>High Risk</span>
                                </div>
                                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{highCount}</span>
                            </button>
                            <button
                                onClick={() => setActiveFilter('MEDIUM')}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${activeFilter === 'MEDIUM' ? 'bg-amber-50 border border-amber-100 ring-2 ring-amber-200' : 'bg-white border border-slate-200 hover:bg-amber-50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    <span className="text-sm font-medium text-slate-700">Medium Risk</span>
                                </div>
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{medCount}</span>
                            </button>
                            <button
                                onClick={() => setActiveFilter('ALL')}
                                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${activeFilter === 'ALL' ? 'bg-emerald-50 border border-emerald-100 ring-2 ring-emerald-200' : 'bg-white border border-slate-200 hover:bg-emerald-50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-sm font-medium text-slate-700">All Batches</span>
                                </div>
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{expiryDrugs.length}</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-primary">analytics</span>
                            <h4 className="text-sm font-bold text-primary">Summary Stats</h4>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-slate-500">Total Exposure</p>
                                <p className="text-lg font-bold text-slate-900">₹{totalExposure.toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Potential Loss Avoidance</p>
                                <p className="text-lg font-bold text-emerald-600">₹{Math.round(totalExposure * 0.66).toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Drug Cards */}
                <div className="col-span-12 lg:col-span-9 space-y-6">
                    {filtered.map((drug, idx) => (
                        <div key={`${drug.id}-${drug.riskBatch.batchId}`} className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${idx > 0 ? 'opacity-90' : ''}`}>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                                            <span className="material-symbols-outlined text-3xl text-slate-400">pill</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xl font-bold text-slate-900">{drug.name}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${drug.expiryRisk === 'HIGH' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    {drug.expiryRisk} Risk
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                                <span>Batch: <b className="text-slate-700">#{drug.riskBatch.batchId}</b></span>
                                                <span>Expiry: <b className="text-slate-700">{new Date(drug.riskBatch.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</b></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400 font-medium">Financial Exposure</p>
                                        <p className="text-2xl font-black text-slate-900">₹{drug.riskBatch.financialExposure.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-6 mb-6">
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1">Units Remaining</p>
                                        <p className="text-lg font-bold">{drug.riskBatch.quantity} Units</p>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                            <div className={`h-full rounded-full ${drug.expiryRisk === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(drug.riskBatch.quantity / 2, 100)}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1">Time to Expiry</p>
                                        <p className={`text-lg font-bold ${drug.riskBatch.daysToExpiry < 30 ? 'text-red-600' : 'text-amber-600'}`}>{drug.riskBatch.daysToExpiry} Days</p>
                                        {drug.riskBatch.daysToExpiry < 30 && <p className="text-[10px] text-slate-400 mt-1 italic">Critically low turnaround</p>}
                                    </div>
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1">Avg. Monthly Usage</p>
                                        <p className="text-lg font-bold">18 Units</p>
                                        <p className="text-[10px] text-red-500 mt-1">Predicted Surplus: {Math.max(0, drug.riskBatch.quantity - 18)} Units</p>
                                    </div>
                                </div>

                                {/* Action Options for all drugs */}
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mt-6">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm">
                                                <span className="material-symbols-outlined text-slate-500">inventory_2</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-800 mb-1">Actions</p>
                                                <div className="flex gap-3 mt-4">
                                                    <button
                                                        onClick={() => handleAction(drug.id, 'Donation', drug)}
                                                        className="px-4 py-2 bg-donation text-white rounded-lg text-sm font-semibold hover:bg-opacity-90 flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">share</span>
                                                        Post to Donation Board
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            navigate('/dashboard/dealer-network');
                                                            // Could also handleAction(drug.id, 'Transfer')
                                                        }}
                                                        className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50"
                                                    >
                                                        Transfer to Dealers
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(drug.id, 'FlashDiscount', drug)}
                                                        className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 flex items-center gap-2 shadow-sm shadow-amber-500/20"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">bolt</span>
                                                        Flash Discount
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(drug.id, 'Loss')}
                                                        className="px-4 py-2 text-red-600 border border-red-200 bg-red-50 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors ml-auto"
                                                    >
                                                        Mark as Loss
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                            <span className="material-symbols-outlined text-4xl text-slate-300">check_circle</span>
                            <p className="text-slate-500 mt-2">No drugs in this risk category.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

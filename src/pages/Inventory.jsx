import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getInventorySnapshot, addInventoryItem } from '../utils/inventoryEngine';

export default function Inventory() {
    const [expandedRow, setExpandedRow] = useState('DRG004');
    const [showScanner, setShowScanner] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [inventory, setInventory] = useState(getInventorySnapshot());

    // Add Inventory State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newItemData, setNewItemData] = useState({ name: '', expiryDate: '', quantity: '', startingDate: '' });

    const handleAddSubmit = (e) => {
        e.preventDefault();
        if (!newItemData.name || !newItemData.expiryDate || !newItemData.quantity) return;
        addInventoryItem(newItemData.name, newItemData.expiryDate, newItemData.quantity, newItemData.startingDate);
        setInventory(getInventorySnapshot());
        setShowAddModal(false);
        setNewItemData({ name: '', expiryDate: '', quantity: '', startingDate: '' });
    };

    // Camera
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [facingMode, setFacingMode] = useState('environment');

    const startCamera = useCallback(async (facing) => {
        setCameraError('');
        setCameraReady(false);
        // Stop existing stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing || 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraReady(true);
                };
            }
        } catch (err) {
            console.error('Camera error:', err);
            setCameraError(err.name === 'NotAllowedError' ? 'Camera permission denied. Please allow camera access.' : 'Could not access camera. Ensure a camera is connected.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraReady(false);
    }, []);

    const openScanner = () => {
        setShowScanner(true);
        setTimeout(() => startCamera(facingMode), 100);
    };

    const closeScanner = () => {
        stopCamera();
        setShowScanner(false);
    };

    const switchCamera = () => {
        const next = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(next);
        startCamera(next);
    };

    // Cleanup on unmount
    useEffect(() => () => stopCamera(), [stopCamera]);

    // Filter logic
    const filteredInventory = inventory.filter(d => {
        const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'ALL' || d.stockStatus === statusFilter;
        return matchSearch && matchStatus;
    });

    const filterOptions = [
        { value: 'ALL', label: 'All Items', icon: 'list', color: 'text-slate-600' },
        { value: 'CRITICAL', label: 'Critical', icon: 'error', color: 'text-red-600' },
        { value: 'WARNING', label: 'Expiry Risk', icon: 'warning', color: 'text-orange-600' },
        { value: 'ADEQUATE', label: 'Safe', icon: 'check_circle', color: 'text-green-600' },
    ];

    const activeFilter = filterOptions.find(f => f.value === statusFilter);

    const getStatusBadge = (status) => {
        const map = {
            CRITICAL: { bg: 'bg-red-100 text-red-700 border-red-200', label: 'Critical' },
            WARNING: { bg: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Expiry Risk' },
            ADEQUATE: { bg: 'bg-green-100 text-green-700 border-green-200', label: 'Safe' },
        };
        const s = map[status] || map.ADEQUATE;
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} border`}>{s.label}</span>;
    };

    return (
        <div className="relative">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-6">
                    <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
                    <div className="relative w-72">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                        <input
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 text-slate-900 placeholder:text-slate-500"
                            placeholder="Search drugs, batches, SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Filter Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${statusFilter !== 'ALL'
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">filter_list</span>
                            {statusFilter === 'ALL' ? 'Filters' : activeFilter.label}
                            {statusFilter !== 'ALL' && (
                                <span className="w-5 h-5 bg-primary text-white rounded-full text-[10px] font-bold flex items-center justify-center">{filteredInventory.length}</span>
                            )}
                        </button>

                        {/* Filter Dropdown */}
                        {showFilterMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-100">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Filter by Status</p>
                                    </div>
                                    {filterOptions.map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => { setStatusFilter(opt.value); setShowFilterMenu(false); }}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${statusFilter === opt.value ? 'bg-primary/5 font-bold text-primary' : 'text-slate-700 hover:bg-slate-50'
                                                }`}
                                        >
                                            <span className={`material-symbols-outlined text-[18px] ${statusFilter === opt.value ? 'text-primary' : opt.color}`}>{opt.icon}</span>
                                            {opt.label}
                                            {statusFilter === opt.value && <span className="material-symbols-outlined text-primary ml-auto text-[16px]">check</span>}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Add Inventory
                    </button>

                    <button
                        onClick={openScanner}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                        QR Scan
                    </button>
                </div>
            </header>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Drug Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reorder Level</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiry</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredInventory.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                    No items match your current filter.
                                </td>
                            </tr>
                        ) : filteredInventory.map((drug) => (
                            <React.Fragment key={drug.id}>
                                <tr
                                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedRow === drug.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''}`}
                                    onClick={() => setExpandedRow(expandedRow === drug.id ? null : drug.id)}
                                >
                                    <td className="px-6 py-4 text-sm font-medium">{drug.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{drug.totalQuantity} units</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{drug.reorderLevel}</td>
                                    <td className="px-6 py-4">{getStatusBadge(drug.stockStatus)}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {drug.nearestExpiry ? new Date(drug.nearestExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="material-symbols-outlined text-slate-400">
                                            {expandedRow === drug.id ? 'keyboard_arrow_down' : 'chevron_right'}
                                        </span>
                                    </td>
                                </tr>
                                {expandedRow === drug.id && (
                                    <tr className="bg-primary/[0.02]">
                                        <td className="px-10 py-6 border-b border-slate-200" colSpan="6">
                                            <div className="flex items-start gap-12">
                                                <div className="space-y-4">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Batch Details</h4>
                                                    {drug.batches.map((batch) => (
                                                        <div key={batch.batchId} className="grid grid-cols-2 gap-x-12 gap-y-3">
                                                            <div>
                                                                <p className="text-[10px] text-slate-500">Batch ID</p>
                                                                <p className="text-sm font-semibold">#{batch.batchId}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-slate-500">Quantity</p>
                                                                <p className="text-sm font-semibold">{batch.quantity} units</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-slate-500">Expiry Date</p>
                                                                <p className="text-sm font-semibold">{new Date(batch.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-slate-500">Recommendation</p>
                                                                {batch.dispenseFirst ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold mt-0.5">FEFO: DISPENSE FIRST</span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold mt-0.5">{batch.expiryRisk} RISK</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="h-24 w-px bg-slate-200"></div>
                                                <div className="flex-1 space-y-3">
                                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</h4>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2 text-xs">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                            <p><span className="font-medium">10 units</span> dispensed for RX-9201</p>
                                                            <span className="ml-auto text-slate-400">2h ago</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                            <p>Stock verification completed</p>
                                                            <span className="ml-auto text-slate-400">Yesterday</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <p>Showing {filteredInventory.length} of {inventory.length} drugs</p>
                    {statusFilter !== 'ALL' && (
                        <button onClick={() => setStatusFilter('ALL')} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">close</span> Clear filter
                        </button>
                    )}
                </div>
            </div>

            {/* ═══ Live Camera Scanner Modal ═══ */}
            {showScanner && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">qr_code_scanner</span>
                                <h3 className="text-lg font-bold">QR / Barcode Scanner</h3>
                            </div>
                            <button onClick={closeScanner} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Live Camera Feed */}
                            <div className="relative aspect-video rounded-xl bg-slate-900 overflow-hidden ring-4 ring-slate-100">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="absolute inset-0 w-full h-full object-cover"
                                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                                />

                                {/* Scanning overlay */}
                                {cameraReady && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-48 h-48 border-2 border-primary/50 rounded-2xl relative">
                                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl -translate-x-1 -translate-y-1"></div>
                                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl translate-x-1 -translate-y-1"></div>
                                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl -translate-x-1 translate-y-1"></div>
                                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl translate-x-1 translate-y-1"></div>
                                            <div className="absolute left-2 right-2 h-0.5 bg-primary/80 shadow-[0_0_15px_rgba(99,102,241,0.8)] scan-line"></div>
                                        </div>
                                    </div>
                                )}

                                {/* Camera status */}
                                {!cameraReady && !cameraError && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="material-symbols-outlined text-white/30 text-4xl animate-pulse mb-2">videocam</span>
                                        <span className="text-white/40 text-xs font-bold">Initializing camera...</span>
                                    </div>
                                )}

                                {cameraError && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                                        <span className="material-symbols-outlined text-red-400 text-4xl mb-2">videocam_off</span>
                                        <p className="text-white/70 text-xs text-center font-bold leading-relaxed">{cameraError}</p>
                                        <button onClick={() => startCamera(facingMode)} className="mt-3 px-4 py-1.5 bg-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/20 transition-colors">
                                            Try Again
                                        </button>
                                    </div>
                                )}

                                {cameraReady && (
                                    <div className="absolute bottom-3 left-0 right-0 text-center">
                                        <span className="bg-black/50 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-md uppercase tracking-wider font-semibold flex items-center gap-1.5 w-fit mx-auto">
                                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Camera Live — Point at barcode
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Quick Result Demo */}
                            <div className="bg-primary/10 border border-primary/30 rounded-xl p-5 flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white shrink-0">
                                    <span className="material-symbols-outlined text-[28px]">pill</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-bold truncate">Scan a barcode to identify</h4>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">WAITING</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-1">Aim your camera at a medicine barcode or QR code</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-slate-500">
                                <span className="material-symbols-outlined text-[18px]">videocam</span>
                                <span className="text-xs font-medium">{cameraReady ? 'Camera Active' : cameraError ? 'Camera Error' : 'Starting...'}</span>
                            </div>
                            <button onClick={switchCamera} className="text-xs font-bold text-primary hover:underline uppercase tracking-widest flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">cameraswitch</span> Switch Camera
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Add Inventory Modal ═══ */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold flex items-center gap-2"><span className="material-symbols-outlined text-primary">add_box</span> Add New Inventory</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Medicine Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                    placeholder="e.g. Amoxicillin 500mg"
                                    value={newItemData.name}
                                    onChange={e => setNewItemData({ ...newItemData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                        placeholder="e.g. 150"
                                        value={newItemData.quantity}
                                        onChange={e => setNewItemData({ ...newItemData, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Expiry Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none"
                                        value={newItemData.expiryDate}
                                        onChange={e => setNewItemData({ ...newItemData, expiryDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Starting Date (Optional)</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none text-slate-500"
                                    value={newItemData.startingDate}
                                    onChange={e => setNewItemData({ ...newItemData, startingDate: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Leaves empty to use today's date.</p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors shadow-md shadow-primary/20 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">save</span> Save Inventory
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

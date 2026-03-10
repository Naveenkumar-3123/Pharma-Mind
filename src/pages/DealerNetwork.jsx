import React, { useState } from 'react';
import { useAgent } from '../context/AgentContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function DealerNetwork() {
    const { dealerConnections, addDealerConnection, transferRequests, setTransferRequests, outgoingTransfers } = useAgent();
    const [referralInput, setReferralInput] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectError, setConnectError] = useState('');

    const handleConnect = async () => {
        const code = referralInput.trim().toUpperCase();
        if (!code || code.length !== 3) return;
        setIsConnecting(true);
        setConnectError('');

        // Check if already connected
        if (dealerConnections.find(d => d.code === code)) {
            setConnectError('Already connected to this pharmacy.');
            setIsConnecting(false);
            return;
        }

        try {
            const q = query(collection(db, 'pharmacies'), where('referralCode', '==', code));
            const snap = await getDocs(q);
            if (snap.empty) {
                setConnectError('No pharmacy found with this referral code.');
            } else {
                const data = snap.docs[0].data();
                addDealerConnection(code, data.shopName, data.location);
                setReferralInput('');
            }
        } catch (err) {
            setConnectError('Failed to validate. Please try again.');
        }
        setIsConnecting(false);
    };

    const handleApproveTransfer = (id) => {
        setTransferRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'approved' } : req));
    };

    const handleRejectTransfer = (id) => {
        setTransferRequests(prev => prev.map(req => req.id === id ? { ...req, status: 'rejected' } : req));
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dealer Network</h1>
                <p className="text-slate-500 mt-2 text-sm max-w-2xl leading-relaxed">Connect with other pharmacies using referral codes to transfer excess medicines and collaborate on patient care.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Connect & List */}
                <div className="space-y-6">
                    {/* Connect Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500"></div>
                        <div className="relative">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Connect with Dealer</h2>
                            <p className="text-xs text-slate-500 mb-4">Enter a 3-letter Pharmacy Referral Code to establish a transfer connection.</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={referralInput}
                                    onChange={(e) => setReferralInput(e.target.value)}
                                    placeholder="e.g. APO"
                                    maxLength={3}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-black tracking-[0.2em] uppercase focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                                />
                                <button
                                    onClick={handleConnect}
                                    disabled={isConnecting || referralInput.length !== 3}
                                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm active:scale-95 flex items-center gap-2"
                                >
                                    {isConnecting ? <span className="material-symbols-outlined text-sm animate-spin">sync</span> : 'Connect'}
                                </button>
                            </div>
                            {connectError && (
                                <p className="text-xs font-bold text-red-600 mt-3 bg-red-50 py-2 px-3 rounded-lg border border-red-200">{connectError}</p>
                            )}
                        </div>
                    </div>

                    {/* Dealer List */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">My Dealers</h2>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{dealerConnections.length} Active</span>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto space-y-3">
                            {dealerConnections.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined text-4xl mb-2 opacity-50">hub</span>
                                    <span className="text-xs">No connected dealers yet.</span>
                                </div>
                            ) : (
                                dealerConnections.map(dealer => (
                                    <div key={dealer.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-200 transition-colors group cursor-default">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{dealer.name}</h3>
                                                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{dealer.location}</p>
                                            </div>
                                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded tracking-widest border border-indigo-200">{dealer.code}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Requests */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Incoming Requests */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-amber-50/30 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-amber-800 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                Incoming Transfer Requests
                            </h2>
                            {transferRequests.filter(r => r.status === 'pending').length > 0 && (
                                <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                </span>
                            )}
                        </div>
                        <div className="p-5">
                            {transferRequests.length === 0 ? (
                                <div className="py-8 flex text-center flex-col items-center justify-center text-slate-400 italic text-sm">
                                    <span className="material-symbols-outlined text-3xl mb-2 opacity-50">inbox</span>
                                    No incoming transfer requests.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {transferRequests.map(req => (
                                        <div key={req.id} className="border border-slate-200 rounded-xl p-4 relative overflow-hidden bg-white hover:shadow-md transition-shadow">
                                            {req.status === 'approved' && <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100 rounded-bl-full border-l border-b border-emerald-200 z-0 flex justify-end p-2"><span className="material-symbols-outlined text-emerald-600 text-[18px]">check_circle</span></div>}
                                            {req.status === 'rejected' && <div className="absolute top-0 right-0 w-16 h-16 bg-red-100 rounded-bl-full border-l border-b border-red-200 z-0 flex justify-end p-2"><span className="material-symbols-outlined text-red-600 text-[18px]">cancel</span></div>}

                                            <div className="relative z-10">
                                                <div className="flex gap-2 items-center mb-3">
                                                    <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded tracking-widest">{req.fromCode}</span>
                                                    <span className="text-xs font-bold text-slate-600 truncate">{req.fromName}</span>
                                                </div>
                                                <h3 className="font-extrabold text-slate-900 text-sm mb-1">{req.drug}</h3>
                                                <p className="text-xs font-medium text-slate-500 mb-4">{req.qty} units requested</p>

                                                {req.status === 'pending' ? (
                                                    <div className="flex gap-2 mt-4">
                                                        <button onClick={() => handleApproveTransfer(req.id)} className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-lg hover:bg-emerald-600 hover:text-white transition-colors">Approve</button>
                                                        <button onClick={() => handleRejectTransfer(req.id)} className="flex-1 py-1.5 bg-red-50 text-red-700 border border-red-200 font-bold text-xs rounded-lg hover:bg-red-600 hover:text-white transition-colors">Reject</button>
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-bold" style={{ color: req.status === 'approved' ? '#10B981' : '#EF4444' }}>
                                                        {req.status.toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Outgoing Requests */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">outbox</span>
                                Outgoing Transfer Requests
                            </h2>
                        </div>
                        <div className="p-5">
                            {outgoingTransfers.length === 0 ? (
                                <div className="py-8 flex text-center flex-col items-center justify-center text-slate-400 italic text-sm">
                                    <span className="material-symbols-outlined text-3xl mb-2 opacity-50">send</span>
                                    You haven't sent any transfer requests.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {outgoingTransfers.map(req => (
                                        <div key={req.id} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-xl">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="material-symbols-outlined text-sm text-slate-400">arrow_forward</span>
                                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-widest">{req.toCode}</span>
                                                </div>
                                                <h3 className="font-bold text-slate-800 text-sm">{req.drug} <span className="text-slate-500 font-normal">({req.qty} units)</span></h3>
                                            </div>
                                            <div>
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                                    req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                        'bg-amber-100 text-amber-700 animate-pulse'
                                                    }`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

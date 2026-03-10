import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getMedicalDiagnosis } from '../utils/aiService';
import { drugInventory } from '../data/mockData';
import { useAgent } from '../context/AgentContext';

export default function CustomerPortal() {
    const navigate = useNavigate();
    const { flashSales, addCustomerRequest, donations } = useAgent();

    // Views: 'landing' | 'add' | 'portal' | 'shop'
    const [view, setView] = useState('landing');
    const [referralInput, setReferralInput] = useState('');
    const [resolvedShops, setResolvedShops] = useState([]);
    const [isResolving, setIsResolving] = useState(false);
    const [activeShop, setActiveShop] = useState(null);
    const [toast, setToast] = useState(null);
    const [resolveError, setResolveError] = useState('');

    // Medicine Request
    const [reqMedicine, setReqMedicine] = useState('');
    const [reqQty, setReqQty] = useState(1);

    // AI
    const [symptoms, setSymptoms] = useState('');
    const [aiResponse, setAiResponse] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Tab on portal
    const [portalTab, setPortalTab] = useState('flash-sales');

    // Donation Request Modal
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [reqForm, setReqForm] = useState({
        customerName: '',
        contactInfo: '',
        medicine: '',
        condition: '',
        story: ''
    });

    // Flash Sale Checkout Modal
    const [activeFlashSale, setActiveFlashSale] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [isCouponApplied, setIsCouponApplied] = useState(false);
    const [couponError, setCouponError] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const docRef = doc(db, 'customers', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const savedCodes = data.savedPharmacies || [];
                        if (savedCodes.length > 0) {
                            // Firestore 'in' queries are restricted to 10 max, batching if needed
                            const chunks = [];
                            for (let i = 0; i < savedCodes.length; i += 10) {
                                chunks.push(savedCodes.slice(i, i + 10));
                            }
                            let fetchedShops = [];
                            for (const chunk of chunks) {
                                const q = query(collection(db, 'pharmacies'), where('referralCode', 'in', chunk));
                                const snap = await getDocs(q);
                                if (!snap.empty) {
                                    fetchedShops = [...fetchedShops, ...snap.docs.map(d => d.data())];
                                }
                            }
                            setResolvedShops(fetchedShops);
                        }
                    } else {
                        // Document doesn't exist, handle edge case if they bypassed signup flow
                        console.log("No profile found.");
                    }
                } catch (err) {
                    console.error("Error fetching patient profile:", err);
                }
            } else {
                navigate('/customer-login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const handleResolveCodes = async () => {
        if (!referralInput.trim()) return;
        setIsResolving(true);
        setResolveError('');
        const codes = referralInput.split('\n').map(c => c.trim().toUpperCase().slice(-3)).filter(c => c.length === 3);
        const newShops = [];
        const newCodes = [];
        for (const code of codes) {
            if (resolvedShops.find(s => s.referralCode === code)) continue;
            const q = query(collection(db, 'pharmacies'), where('referralCode', '==', code));
            const snap = await getDocs(q);
            if (!snap.empty) {
                newShops.push(snap.docs[0].data());
                newCodes.push(code);
            }
        }
        if (newShops.length > 0) {
            const updated = [...resolvedShops, ...newShops];
            setResolvedShops(updated);

            if (auth.currentUser && newCodes.length > 0) {
                try {
                    await updateDoc(doc(db, 'customers', auth.currentUser.uid), {
                        savedPharmacies: arrayUnion(...newCodes)
                    });
                } catch (err) {
                    console.error("Failed to sync pharmacies manually", err);
                }
            }

            showToast(`Added ${newShops.length} pharmacy(ies) successfully!`);
        } else {
            setResolveError('No valid pharmacies found for the entered code(s).');
        }
        setReferralInput('');
        setIsResolving(false);
    };

    const handleAskAI = async () => {
        if (!symptoms.trim()) return;
        setIsAnalyzing(true); setAiResponse(null);
        const result = await getMedicalDiagnosis(symptoms);
        setAiResponse(result); setIsAnalyzing(false);
    };

    const handleSendMedicineRequest = () => {
        if (!reqMedicine.trim() || !activeShop) return;
        addCustomerRequest({ customerName: 'James Patel', medicine: reqMedicine, qty: reqQty, pharmacyCode: activeShop.referralCode });
        showToast(`Request for "${reqMedicine}" sent to ${activeShop.shopName}!`);
        setReqMedicine(''); setReqQty(1);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            localStorage.removeItem('medflow_customer_shops');
            navigate('/');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const handleDonationSubmit = (e) => {
        e.preventDefault();
        addCustomerRequest(reqForm);
        setReqForm({ customerName: '', contactInfo: '', medicine: '', condition: '', story: '' });
        setShowRequestModal(false);
        showToast('Your request has been submitted to the pharmacy network!');
    };

    // ─── RENDER ────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#0B0F19] text-white font-display relative overflow-hidden">
            {/* Ambient BG */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[80px]"></div>
            </div>

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 z-[99] font-bold text-sm">
                    <span className="material-symbols-outlined text-lg">check_circle</span>{toast}
                </div>
            )}

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <span className="material-symbols-outlined text-white text-xl">medication_liquid</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight leading-none">PharmAgent</h1>
                        <p className="text-[9px] text-indigo-400 uppercase tracking-[0.3em] font-bold">Customer Portal</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/40 hover:text-white/80">
                    <span className="material-symbols-outlined text-xl">logout</span>
                </button>
            </nav>

            <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-8">

                {/* ════════════════════════════════════════════════════════════════
                    SCREEN 1 — LANDING (Two Buttons: Add + Go)
                   ════════════════════════════════════════════════════════════════ */}
                {view === 'landing' && (
                    <div className="flex items-center justify-center min-h-[70vh]">
                        <div className="w-full max-w-lg text-center">
                            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-8">
                                <span className="material-symbols-outlined text-white text-4xl">storefront</span>
                            </div>
                            <h1 className="text-4xl font-black tracking-tight mb-3">Customer Portal</h1>
                            <p className="text-white/40 text-sm leading-relaxed max-w-md mx-auto mb-10">
                                Connect to pharmacies using referral codes to browse medicines, claim flash discounts, and request donations.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
                                {/* ADD Button */}
                                <button
                                    onClick={() => setView('add')}
                                    className="group bg-white/[0.04] border border-white/10 rounded-2xl p-8 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all text-center relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-indigo-500/15 transition-all"></div>
                                    <div className="relative">
                                        <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                                            <span className="material-symbols-outlined text-indigo-400 text-2xl">add_circle</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1">Add Pharmacy</h3>
                                        <p className="text-xs text-white/30 leading-relaxed">Enter a referral code to connect with a new pharmacy</p>
                                    </div>
                                </button>

                                {/* GO Button */}
                                <button
                                    onClick={() => {
                                        if (resolvedShops.length > 0) {
                                            setView('portal');
                                        } else {
                                            showToast('Please add a pharmacy first!');
                                        }
                                    }}
                                    className={`group border rounded-2xl p-8 transition-all text-center relative overflow-hidden ${resolvedShops.length > 0
                                        ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/40'
                                        : 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-emerald-500/15 transition-all"></div>
                                    <div className="relative">
                                        <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-colors ${resolvedShops.length > 0 ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-white/5'
                                            }`}>
                                            <span className={`material-symbols-outlined text-2xl ${resolvedShops.length > 0 ? 'text-emerald-400' : 'text-white/20'}`}>arrow_forward</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-1">Go to My Pharmacies</h3>
                                        <p className="text-xs text-white/30 leading-relaxed">
                                            {resolvedShops.length > 0
                                                ? `${resolvedShops.length} pharmacy(ies) connected`
                                                : 'No pharmacies added yet'
                                            }
                                        </p>
                                    </div>
                                </button>
                            </div>

                            <button onClick={() => navigate('/')} className="mt-8 text-xs text-white/20 hover:text-white/40 transition-colors">
                                ← Back to Home
                            </button>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════════
                    SCREEN 2 — ADD PHARMACY (Referral Code Input)
                   ════════════════════════════════════════════════════════════════ */}
                {view === 'add' && (
                    <div className="flex items-center justify-center min-h-[70vh]">
                        <div className="w-full max-w-md">
                            <button onClick={() => setView('landing')} className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors mb-8 group text-sm font-bold">
                                <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span> Back
                            </button>

                            <div className="text-center mb-8">
                                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-6">
                                    <span className="material-symbols-outlined text-white text-3xl">hub</span>
                                </div>
                                <h1 className="text-3xl font-black tracking-tight mb-2">Add Pharmacy</h1>
                                <p className="text-white/40 text-sm leading-relaxed max-w-sm mx-auto">
                                    Enter the 3-letter referral code from your pharmacy. You can add multiple codes, one per line.
                                </p>
                            </div>

                            <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl shadow-black/20">
                                <label className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] block mb-3">Referral Code</label>
                                <textarea
                                    value={referralInput}
                                    onChange={e => { setReferralInput(e.target.value); setResolveError(''); }}
                                    rows="3"
                                    placeholder={"e.g. APO\nCIT"}
                                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-lg font-mono uppercase tracking-[0.3em] text-white placeholder:text-white/15 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none mb-4 text-center"
                                />
                                {resolveError && (
                                    <p className="text-xs font-bold text-red-400 mb-3 text-center bg-red-400/10 py-2 rounded-xl border border-red-400/20">{resolveError}</p>
                                )}
                                <button
                                    onClick={handleResolveCodes}
                                    disabled={isResolving || !referralInput.trim()}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-base rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-30 active:scale-[0.97] flex items-center justify-center gap-2"
                                >
                                    {isResolving ? (
                                        <><span className="material-symbols-outlined animate-spin text-lg">progress_activity</span> Validating...</>
                                    ) : (
                                        <><span className="material-symbols-outlined text-lg">add_circle</span> Add</>
                                    )}
                                </button>

                                {/* Show resolved count */}
                                {resolvedShops.length > 0 && (
                                    <div className="mt-5 pt-5 border-t border-white/5">
                                        <p className="text-[10px] text-emerald-400 font-bold text-center mb-3">✓ {resolvedShops.length} pharmacy(ies) connected</p>
                                        <button
                                            onClick={() => setView('portal')}
                                            className="w-full py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-sm rounded-xl hover:bg-emerald-500/30 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">arrow_forward</span> Go to My Pharmacies
                                        </button>
                                    </div>
                                )}

                                <p className="text-[10px] text-white/15 mt-4 text-center">Ask your pharmacist for their referral code</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════════════════════════
                    SCREEN 3 — MAIN PORTAL (Pharmacies + Flash Sales + Donations)
                   ════════════════════════════════════════════════════════════════ */}
                {view === 'portal' && (
                    <>
                        <button onClick={() => setView('landing')} className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors mb-6 group text-sm font-bold">
                            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span> Back
                        </button>

                        {/* Portal Header */}
                        <div className="mb-8">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                <div>
                                    <p className="text-indigo-400 text-xs font-bold uppercase tracking-[0.3em] mb-2">Welcome</p>
                                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                                        My <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">Pharmacies</span>
                                    </h1>
                                </div>
                                <div className="flex gap-3">
                                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-md text-center">
                                        <p className="text-xl font-black text-indigo-400">{resolvedShops.length}</p>
                                        <p className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Shops</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 backdrop-blur-md text-center">
                                        <p className="text-xl font-black text-amber-400">{flashSales.length}</p>
                                        <p className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Flash Deals</p>
                                    </div>
                                    <button onClick={() => setView('add')} className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3 hover:bg-indigo-500/20 transition-colors flex items-center gap-2">
                                        <span className="material-symbols-outlined text-indigo-400 text-lg">add</span>
                                        <span className="text-xs font-bold text-indigo-400">Add More</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Connected Shops */}
                        <div className="mb-8">
                            <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-4">Connected Pharmacies — Click to browse</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {resolvedShops.map((shop, i) => (
                                    <div
                                        key={i}
                                        onClick={() => { setActiveShop(shop); setView('shop'); }}
                                        className="group bg-white/[0.03] border border-white/10 rounded-2xl p-5 cursor-pointer hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all hover:shadow-lg hover:shadow-indigo-500/5 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl -mr-6 -mt-6 group-hover:bg-indigo-500/10 transition-all"></div>
                                        <div className="relative">
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors">{shop.shopName}</h4>
                                                <span className="text-[10px] font-black tracking-[0.15em] text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-lg border border-indigo-400/20">{shop.referralCode}</span>
                                            </div>
                                            <p className="text-xs text-white/30 flex items-center gap-1 mb-2"><span className="material-symbols-outlined text-[12px]">location_on</span>{shop.location}</p>
                                            <p className="text-[10px] text-white/15 italic line-clamp-1">"{shop.description}"</p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-[10px] text-amber-400/50 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">star</span> 4.8</span>
                                                <span className="text-[10px] text-indigo-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                                    Browse <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Category Tabs: Flash Sales | Request Donation */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() => setPortalTab('flash-sales')}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${portalTab === 'flash-sales' ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400' : 'bg-white/[0.02] border border-white/10 text-white/40 hover:text-white/60'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">bolt</span> Flash Discounts
                            </button>
                            <button
                                onClick={() => setPortalTab('donations')}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${portalTab === 'donations' ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400' : 'bg-white/[0.02] border border-white/10 text-white/40 hover:text-white/60'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">volunteer_activism</span> Request Donation
                            </button>
                        </div>

                        {/* Flash Discounts Tab */}
                        {portalTab === 'flash-sales' && (
                            <div>
                                {flashSales.length === 0 ? (
                                    <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-2xl py-16 flex flex-col items-center justify-center">
                                        <span className="material-symbols-outlined text-4xl text-white/10 mb-3">flash_off</span>
                                        <p className="text-sm text-white/25 font-bold mb-1">No Flash Discounts Available</p>
                                        <p className="text-xs text-white/15">When your connected pharmacies create flash sales, they'll appear here instantly.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {flashSales.map(fs => (
                                            <div key={fs.flashId} className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-5 hover:border-amber-400/40 transition-all group">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <span className="text-[9px] font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded uppercase tracking-[0.2em] animate-pulse">Flash Sale</span>
                                                        <h4 className="font-extrabold text-white mt-2 text-lg">{fs.name}</h4>
                                                        <p className="text-[10px] text-white/30 mt-1">{fs.batch}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-black text-amber-400">₹{fs.discountPrice}</p>
                                                        <p className="text-xs text-white/30 line-through">₹{fs.originalPrice}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-rose-400 font-bold mb-2">{fs.qty} units remaining</p>
                                                {fs.promoCode && (
                                                    <div className="flex items-center gap-2 mb-3 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
                                                        <span className="material-symbols-outlined text-amber-400 text-sm">confirmation_number</span>
                                                        <span className="text-[10px] font-black text-amber-300 tracking-[0.15em] font-mono">{fs.promoCode}</span>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => { setActiveFlashSale(fs); setCouponCode(''); setIsCouponApplied(false); setCouponError(''); }}
                                                    className="w-full py-2.5 bg-amber-500 text-black font-bold text-sm rounded-xl hover:bg-amber-400 transition-colors active:scale-[0.97] shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                                                    <span className="material-symbols-outlined text-sm">local_mall</span> Claim Deal
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Request Donation Tab */}
                        {portalTab === 'donations' && (
                            <div>
                                <p className="text-xs text-white/30 mb-4">Free medicine donations available from community pharmacies.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {donations?.map((dn, idx) => (
                                        <div key={dn.id || idx} className="bg-teal-500/5 border border-teal-500/20 rounded-2xl p-5 hover:border-teal-400/40 transition-all">
                                            <span className="text-[9px] font-black text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded uppercase tracking-[0.2em]">Free Donation</span>
                                            <h4 className="font-bold text-white mt-2 text-lg mb-1">{dn.drug}</h4>
                                            <p className="text-xs text-white/30 mb-1">{dn.quantity} units available</p>
                                            <p className="text-[10px] text-white/20 mb-4">Expires: {dn.expiryDate}</p>
                                            <button className="w-full py-2.5 bg-teal-600 text-white font-bold text-sm rounded-xl hover:bg-teal-500 transition-colors shadow-lg shadow-teal-500/10 active:scale-[0.97] flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined text-sm">volunteer_activism</span> Request Donation
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ════════════════════════════════════════════════════════════════
                    SCREEN 4 — INDIVIDUAL SHOP VIEW (Catalog + Request + AI)
                   ════════════════════════════════════════════════════════════════ */}
                {view === 'shop' && activeShop && (
                    <>
                        <button onClick={() => { setView('portal'); setActiveShop(null); }} className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors mb-6 group text-sm font-bold">
                            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span> Back to Pharmacies
                        </button>

                        {/* Shop Header */}
                        <div className="bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent border border-white/10 rounded-3xl p-8 mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -mr-12 -mt-12"></div>
                            <div className="relative">
                                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-2 block">{activeShop.referralCode} · Active Shop</span>
                                <h2 className="text-3xl font-black text-white mb-1">{activeShop.shopName}</h2>
                                <p className="text-sm text-white/40 mb-4">{activeShop.location}</p>
                                <div className="flex flex-wrap gap-6 pt-4 border-t border-white/5">
                                    <div><p className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Contact</p><p className="text-xs font-bold text-white/70 mt-1">{activeShop.mobile}</p></div>
                                    <div><p className="text-[9px] text-white/30 uppercase tracking-wider font-bold">Email</p><p className="text-xs font-bold text-white/70 mt-1">{activeShop.email}</p></div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left: Request + AI */}
                            <div className="space-y-6">
                                {/* Medicine Request */}
                                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                                    <h3 className="text-sm font-bold text-white/90 mb-1 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-violet-400 text-lg">prescription</span>
                                        Request Medicine
                                    </h3>
                                    <p className="text-[11px] text-white/30 mb-4">Ask this pharmacy directly for specific medicine.</p>
                                    <input type="text" value={reqMedicine} onChange={e => setReqMedicine(e.target.value)} placeholder="Medicine name & dosage..."
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-violet-500 mb-3" />
                                    <div className="flex gap-2 mb-3">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-white/30 font-bold uppercase tracking-wider block mb-1">Qty</label>
                                            <input type="number" value={reqQty} min={1} onChange={e => setReqQty(parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-violet-500" />
                                        </div>
                                    </div>
                                    <button onClick={handleSendMedicineRequest} disabled={!reqMedicine.trim()}
                                        className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 transition-all disabled:opacity-40 active:scale-[0.97] flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined text-sm">send</span>Send Request
                                    </button>
                                </div>

                                {/* AI Helpdesk */}
                                <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                                    <div className="px-5 py-3 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-b border-white/5 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-emerald-400">psychology</span>
                                            <span className="text-white font-bold text-sm">Symptom AI</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 border border-emerald-400/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Safe
                                        </span>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex gap-2 mb-3">
                                            <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} placeholder="Describe symptoms..." rows="2"
                                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:ring-2 focus:ring-emerald-500 resize-none" />
                                            <button onClick={handleAskAI} disabled={isAnalyzing || !symptoms.trim()}
                                                className="px-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 disabled:opacity-40 transition-colors flex items-center">
                                                {isAnalyzing ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">auto_awesome</span>}
                                            </button>
                                        </div>
                                        {aiResponse ? (
                                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white/70 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">{aiResponse.message}</div>
                                        ) : (
                                            <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-xl p-4 text-center text-white/15 text-xs italic">AI output appears here</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Catalog */}
                            <div className="lg:col-span-2">
                                <h3 className="text-sm font-bold text-white/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg text-indigo-400">inventory_2</span> Catalog
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {drugInventory.slice(0, 8).map(drug => (
                                        <div key={drug.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-indigo-500/20 transition-all flex flex-col justify-between group">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className="font-bold text-white group-hover:text-indigo-300 transition-colors">{drug.name}</h5>
                                                    <span className="text-sm font-black text-indigo-400">₹{(drug.unitCost * 1.5).toFixed(0)}</span>
                                                </div>
                                                <p className="text-[10px] text-white/20 uppercase tracking-wider font-bold">{drug.category}</p>
                                                <p className="text-xs font-bold text-emerald-400/60 mt-1">{drug.batches[0].quantity + drug.batches[1].quantity} in stock</p>
                                            </div>
                                            <div className="flex gap-2 mt-3">
                                                <select className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white/60">
                                                    <option>1</option><option>2</option><option>3</option>
                                                </select>
                                                <button className="flex-1 bg-indigo-600/80 hover:bg-indigo-500 text-white text-sm font-bold py-2 rounded-xl transition-colors shadow-md shadow-indigo-500/10 active:scale-[0.97]">
                                                    Purchase
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

            </div>
            {/* Floating Donation Request Button */}
            <div className="fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => setShowRequestModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-3.5 rounded-2xl shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:-translate-y-1 transition-all active:scale-95 font-bold"
                >
                    <span className="material-symbols-outlined text-lg">volunteer_activism</span>
                    Request Custom Donation
                </button>
            </div>

            {/* Donation Modal overlay */}
            {showRequestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1E293B] border border-white/10 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                <span className="material-symbols-outlined text-pink-400">volunteer_activism</span>
                                Request Medical Support
                            </h3>
                            <button onClick={() => setShowRequestModal(false)} className="text-white/40 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <p className="text-sm text-white/60 mb-6 leading-relaxed">
                            Submit a custom request for medicines to our connected pharmacy network. Pharmacists can review your story and offer donated or discounted supplies.
                        </p>

                        <form onSubmit={handleDonationSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1 block">Your Name</label>
                                    <input required type="text" value={reqForm.customerName} onChange={e => setReqForm({ ...reqForm, customerName: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 outline-none text-white placeholder:text-white/20" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1 block">Contact Number</label>
                                    <input required type="tel" value={reqForm.contactInfo} onChange={e => setReqForm({ ...reqForm, contactInfo: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 outline-none text-white placeholder:text-white/20" placeholder="+91 98765 43210" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1 block">Medicine Needed</label>
                                <input required type="text" value={reqForm.medicine} onChange={e => setReqForm({ ...reqForm, medicine: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 outline-none text-white placeholder:text-white/20" placeholder="e.g. Insulin Glargine 100 IU" />
                            </div>

                            <div>
                                <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1 block">Medical Condition</label>
                                <input required type="text" value={reqForm.condition} onChange={e => setReqForm({ ...reqForm, condition: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 outline-none text-white placeholder:text-white/20" placeholder="e.g. Type 1 Diabetes" />
                            </div>

                            <div>
                                <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider mb-1 block">Your Story (Optional)</label>
                                <textarea rows="3" value={reqForm.story} onChange={e => setReqForm({ ...reqForm, story: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-pink-500 outline-none text-white placeholder:text-white/20 resize-none" placeholder="Briefly explain your situation so pharmacies can understand your urgency..." />
                            </div>

                            <button type="submit" className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 mt-4 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm">send</span>
                                Submit Request to Pharmacies
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Flash Sale Checkout Modal overlay */}
            {activeFlashSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#1E293B] border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -z-10 pointer-events-none"></div>

                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black flex items-center gap-2 text-white">
                                <span className="material-symbols-outlined text-amber-400">bolt</span>
                                Flash Checkout
                            </h3>
                            <button onClick={() => setActiveFlashSale(null)} className="text-white/40 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                            <h4 className="font-bold text-white text-lg mb-1">{activeFlashSale.name}</h4>
                            <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-4">{activeFlashSale.batch}</p>

                            <div className="space-y-2 border-t border-white/10 pt-4">
                                <div className="flex justify-between text-xs font-bold text-white/40">
                                    <span>Original Price</span>
                                    <span className="line-through">₹{activeFlashSale.originalPrice}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-white">
                                    <span>Flash Discount</span>
                                    <span className="text-amber-400">₹{activeFlashSale.discountPrice}</span>
                                </div>
                                {isCouponApplied && (
                                    <div className="flex justify-between text-sm font-bold text-emerald-400 bg-emerald-400/10 px-3 py-2 rounded-xl mt-2 animate-pulse border border-emerald-400/20">
                                        <span>Extra Coupon Savings</span>
                                        <span>- ₹{(activeFlashSale.discountPrice * 0.1).toFixed(0)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Coupon Code Section */}
                        <div className="mb-6">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">Apply Promo / Coupon Code</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                                    disabled={isCouponApplied}
                                    placeholder="Enter promo code..."
                                    className={`flex-1 px-4 py-3 bg-white/5 border rounded-xl text-sm font-bold tracking-widest text-white placeholder:text-white/20 focus:ring-2 focus:ring-amber-500/50 disabled:opacity-50 ${couponError ? 'border-red-500/50' : 'border-white/10'}`}
                                />
                                <button
                                    onClick={() => {
                                        if (activeFlashSale.promoCode && couponCode.trim() === activeFlashSale.promoCode) {
                                            setIsCouponApplied(true);
                                            setCouponError('');
                                        } else {
                                            setCouponError('Invalid coupon code. Please check and try again.');
                                        }
                                    }}
                                    disabled={isCouponApplied || couponCode.length < 3}
                                    className="px-5 py-3 bg-white/10 text-white font-bold text-sm rounded-xl hover:bg-white/20 disabled:opacity-40 transition-colors"
                                >
                                    {isCouponApplied ? '✓ Applied' : 'Apply'}
                                </button>
                            </div>
                            {couponError && (
                                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">error</span>
                                    {couponError}
                                </p>
                            )}
                            {isCouponApplied && (
                                <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                    Coupon applied successfully! Extra 10% off.
                                </p>
                            )}
                        </div>

                        {/* Final Total Checkout */}
                        <div className="border-t border-white/10 pt-5">
                            <div className="flex justify-between items-center mb-5">
                                <span className="text-sm font-bold text-white/50 uppercase tracking-wider">Final Total</span>
                                <span className="text-3xl font-black text-amber-400">
                                    ₹{isCouponApplied
                                        ? (activeFlashSale.discountPrice * 0.9).toFixed(0)
                                        : activeFlashSale.discountPrice}
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    showToast(`Successfully purchased ${activeFlashSale.name}!`);
                                    setActiveFlashSale(null);
                                }}
                                className="w-full py-4 bg-amber-500 text-black font-black text-base rounded-2xl shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">shopping_cart_checkout</span>
                                Confirm Purchase
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

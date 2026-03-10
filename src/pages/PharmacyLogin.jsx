import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Generate unique 3-letter referral code
const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
};

export default function PharmacyLogin() {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [generatedCode, setGeneratedCode] = useState('');
    const [matchedStore, setMatchedStore] = useState(null);

    // Sign In fields
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Sign Up fields
    const [form, setForm] = useState({
        shopName: '', location: '', email: '', mobile: '', password: '', confirmPassword: '', description: ''
    });

    const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    // ─── SIGN UP ───
    const handleSignUp = async () => {
        setError('');
        if (!form.shopName || !form.email || !form.mobile || !form.password || !form.location) {
            setError('Please fill in all required fields.');
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        try {
            // 1. Create Firebase Auth user
            const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);

            // 2. Generate a unique 3-letter referral code
            let code = generateReferralCode();
            // Ensure uniqueness
            let exists = true;
            let attempts = 0;
            while (exists && attempts < 20) {
                const q = query(collection(db, 'pharmacies'), where('referralCode', '==', code));
                const snap = await getDocs(q);
                if (snap.empty) { exists = false; } else { code = generateReferralCode(); attempts++; }
            }

            // 3. Save pharmacy profile to Firestore
            await setDoc(doc(db, 'pharmacies', cred.user.uid), {
                shopName: form.shopName,
                location: form.location,
                email: form.email,
                mobile: form.mobile,
                description: form.description || `Welcome to ${form.shopName}. We are a trusted pharmacy serving your healthcare needs.`,
                referralCode: code,
                createdAt: new Date().toISOString(),
            });

            setGeneratedCode(code);
            setMatchedStore({ name: form.shopName, location: form.location, code });
            setShowSuccess(true);
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please sign in instead.');
            } else {
                setError(err.message || 'Signup failed. Please try again.');
            }
        }
        setIsLoading(false);
    };

    // ─── SIGN IN ───
    const handleSignIn = async () => {
        setError('');
        if (!loginEmail || !loginPassword) {
            setError('Please enter your email and password.');
            return;
        }
        setIsLoading(true);
        try {
            const cred = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
            const snap = await getDoc(doc(db, 'pharmacies', cred.user.uid));
            if (snap.exists()) {
                const data = snap.data();
                setMatchedStore({ name: data.shopName, location: data.location, code: data.referralCode });
            }
            setShowSuccess(true);
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (err) {
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                setError('Invalid email or password.');
            } else {
                setError(err.message || 'Sign in failed.');
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-display flex">
            {/* Left Panel — Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#2563EB] to-indigo-700 p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="bg-white/20 rounded-xl p-2">
                            <span className="material-symbols-outlined text-white text-2xl">pill</span>
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">PharmAgent</span>
                    </div>
                </div>

                <div className="relative z-10">
                    <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
                        Manage Your Pharmacy<br />With AI Intelligence
                    </h2>
                    <p className="text-lg text-white/80 leading-relaxed max-w-md">
                        Access your complete pharmacy dashboard — inventory, procurement, expiry management, financials, and patient care — all in one place.
                    </p>
                    <div className="flex gap-8 mt-10">
                        <div>
                            <p className="text-3xl font-black text-white">24/7</p>
                            <p className="text-xs text-white/60 font-medium mt-1">AI Monitoring</p>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-white">₹18L</p>
                            <p className="text-xs text-white/60 font-medium mt-1">Avg. Savings/Year</p>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-white">99.8%</p>
                            <p className="text-xs text-white/60 font-medium mt-1">Uptime</p>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-white/40 relative z-10">© 2026 PharmAgent. Built for GKM_4 Hackathon.</p>
            </div>

            {/* Right Panel — Auth Form */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-10 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="bg-[#2563EB] rounded-xl p-2 text-white">
                            <span className="material-symbols-outlined text-xl">pill</span>
                        </div>
                        <span className="text-xl font-bold">PharmAgent</span>
                    </div>

                    {showSuccess ? (
                        /* ─── SUCCESS STATE ─── */
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-[#16A34A] text-4xl">check_circle</span>
                            </div>
                            <h2 className="text-2xl font-extrabold text-[#0F172A] mb-2">
                                {isSignUp ? 'Account Created!' : 'Access Granted!'}
                            </h2>
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm my-6 text-left">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#64748B]">Store Name</span>
                                        <span className="font-bold">{matchedStore?.name}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#64748B]">Location</span>
                                        <span className="font-bold">{matchedStore?.location}</span>
                                    </div>
                                    {matchedStore?.code && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[#64748B]">Referral Code</span>
                                            <span className="font-black text-[#2563EB] text-lg tracking-widest">{matchedStore.code}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {isSignUp && generatedCode && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                                    <p className="text-xs text-[#2563EB] font-bold mb-1">Your Unique Pharmacy Referral Code:</p>
                                    <p className="text-4xl font-black tracking-[0.3em] text-[#2563EB]">{generatedCode}</p>
                                    <p className="text-[10px] text-slate-500 mt-2">Share this code with patients so they can connect to your pharmacy.</p>
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="mt-4 w-full py-2.5 bg-[#2563EB] text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Go to Dashboard →
                                    </button>
                                </div>
                            )}

                            {!isSignUp && (
                                <p className="text-sm text-[#64748B] flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                    Loading dashboard...
                                </p>
                            )}
                        </div>
                    ) : (
                        /* ─── AUTH FORMS ─── */
                        <>
                            <div className="mb-8">
                                <h1 className="text-3xl font-extrabold text-[#0F172A]">
                                    {isSignUp ? 'Register Your Pharmacy' : 'Pharmacy Admin Login'}
                                </h1>
                                <p className="text-[#64748B] mt-2">
                                    {isSignUp ? 'Create your pharmacy account and get a unique referral code.' : 'Sign in with your email and password.'}
                                </p>
                            </div>

                            {/* Toggle Sign In / Sign Up */}
                            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                                <button
                                    onClick={() => { setIsSignUp(false); setError(''); }}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${!isSignUp ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'}`}
                                >Sign In</button>
                                <button
                                    onClick={() => { setIsSignUp(true); setError(''); }}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${isSignUp ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#64748B]'}`}
                                >Sign Up</button>
                            </div>

                            {isSignUp ? (
                                /* ─── SIGN UP FORM ─── */
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Shop Name *</label>
                                        <input type="text" value={form.shopName} onChange={e => updateForm('shopName', e.target.value)}
                                            placeholder="e.g. City Pharmacy" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] placeholder:text-slate-300" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Location *</label>
                                        <input type="text" value={form.location} onChange={e => updateForm('location', e.target.value)}
                                            placeholder="e.g. Chennai, Tamil Nadu" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] placeholder:text-slate-300" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email *</label>
                                            <input type="email" value={form.email} onChange={e => updateForm('email', e.target.value)}
                                                placeholder="admin@shop.com" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] placeholder:text-slate-300" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile *</label>
                                            <input type="tel" value={form.mobile} onChange={e => updateForm('mobile', e.target.value)}
                                                placeholder="+91 98765 43210" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] placeholder:text-slate-300" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password *</label>
                                            <input type="password" value={form.password} onChange={e => updateForm('password', e.target.value)}
                                                placeholder="Min 6 characters" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] placeholder:text-slate-300" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm Password *</label>
                                            <input type="password" value={form.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)}
                                                placeholder="Repeat password" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] placeholder:text-slate-300" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Shop Description <span className="text-slate-400 font-normal">(optional)</span></label>
                                        <textarea value={form.description} onChange={e => updateForm('description', e.target.value)}
                                            rows="2" placeholder="Brief description of your pharmacy for patients..."
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] placeholder:text-slate-300 resize-none" />
                                    </div>

                                    {error && (
                                        <p className="text-sm text-[#DC2626] flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">error</span>{error}
                                        </p>
                                    )}

                                    <button onClick={handleSignUp} disabled={isLoading}
                                        className="w-full py-3.5 bg-[#2563EB] text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]">
                                        {isLoading ? (
                                            <><span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>Creating Account...</>
                                        ) : (
                                            <><span className="material-symbols-outlined text-lg">storefront</span>Register Pharmacy</>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                /* ─── SIGN IN FORM ─── */
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-[#0F172A] mb-2">Email Address</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">mail</span>
                                            <input type="email" value={loginEmail} onChange={e => { setLoginEmail(e.target.value); setError(''); }}
                                                onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                                                placeholder="admin@pharmacy.com"
                                                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-base font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] placeholder:text-slate-300 transition-all" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#0F172A] mb-2">Password</label>
                                        <div className="relative">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]">lock</span>
                                            <input type="password" value={loginPassword} onChange={e => { setLoginPassword(e.target.value); setError(''); }}
                                                onKeyDown={e => e.key === 'Enter' && handleSignIn()}
                                                placeholder="Enter your password"
                                                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-base font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] placeholder:text-slate-300 transition-all" />
                                        </div>
                                    </div>

                                    {error && (
                                        <p className="text-sm text-[#DC2626] flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">error</span>{error}
                                        </p>
                                    )}

                                    <button onClick={handleSignIn} disabled={isLoading}
                                        className="w-full py-3.5 bg-[#2563EB] text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]">
                                        {isLoading ? (
                                            <><span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>Signing In...</>
                                        ) : (
                                            <><span className="material-symbols-outlined text-lg">login</span>Sign In</>
                                        )}
                                    </button>
                                </div>
                            )}

                            <div className="mt-8 text-center">
                                <p className="text-sm text-[#64748B]">
                                    Are you a customer? <button onClick={() => navigate('/customer-login')} className="text-[#2563EB] font-semibold hover:underline">Customer Portal →</button>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

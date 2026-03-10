import React from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
    { icon: 'monitoring', title: 'Smart Inventory Monitoring', desc: 'Real-time stock tracking with AI-powered reorder alerts and FEFO optimization.' },
    { icon: 'event_busy', title: 'AI Expiry Prediction', desc: 'Predict and prevent medicine waste with intelligent expiry risk detection.' },
    { icon: 'shopping_cart', title: 'Automated Procurement', desc: 'Auto-generate purchase orders with vendor scoring and cost optimization.' },
    { icon: 'groups', title: 'Community Medicine Exchange', desc: 'Redistribute surplus medicine across pharmacies and donate to NGOs.' },
    { icon: 'notifications_active', title: 'Customer Medicine Reminders', desc: 'Track chronic customers and send automated refill reminders via email.' },
    { icon: 'auto_awesome', title: 'AI Symptom Suggestions', desc: 'Customers describe symptoms and receive pharmacist-guided medicine suggestions.' },
];

const steps = [
    { num: '01', title: 'Register Pharmacy', desc: 'Pharmacies register using their unique medical store code. All data loads instantly.', icon: 'storefront' },
    { num: '02', title: 'AI Monitors Everything', desc: 'The AI agent continuously scans stock, expiry risks, demand spikes, and procurement needs.', icon: 'psychology' },
    { num: '03', title: 'Customers Get Help', desc: 'Customers describe symptoms and receive pharmacist-guided medicine suggestions with safety notes.', icon: 'medical_services' },
];

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-display text-[#0F172A]">
            {/* ── Top Navigation ── */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-slate-100 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-[#2563EB] rounded-xl p-2 text-white">
                            <span className="material-symbols-outlined text-xl">pill</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight">PharmAgent</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors">How It Works</a>
                        <a href="#about" className="text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors">About</a>
                        <a href="#contact" className="text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors">Contact</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/customer-login')}
                            className="px-4 py-2 text-sm font-semibold text-[#2563EB] bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                        >Customer Portal</button>
                        <button
                            onClick={() => navigate('/pharmacy-login')}
                            className="px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors"
                        >Pharmacy Admin</button>
                    </div>
                </div>
            </nav>

            {/* ── Hero Section ── */}
            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-[#2563EB]/5 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-100/40 rounded-full blur-3xl -z-10"></div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full mb-6">
                            <span className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse"></span>
                            <span className="text-xs font-semibold text-[#2563EB]">AI Agent Active — Monitoring 24/7</span>
                        </div>
                        <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                            AI-Powered<br />
                            <span className="text-[#2563EB]">Pharmacy Intelligence</span><br />
                            Platform
                        </h1>
                        <p className="text-lg text-[#64748B] mt-6 leading-relaxed max-w-lg">
                            Optimize pharmacy inventory, reduce medicine waste, and help customers get the right medicines — all powered by autonomous AI agents.
                        </p>
                        <div className="flex gap-4 mt-8">
                            <button
                                onClick={() => navigate('/pharmacy-login')}
                                className="px-6 py-3.5 bg-[#2563EB] text-white font-bold rounded-xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                                Login as Pharmacy Admin
                            </button>
                            <button
                                onClick={() => navigate('/customer-login')}
                                className="px-6 py-3.5 bg-white text-[#0F172A] font-bold rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">person</span>
                                Login as Customer
                            </button>
                        </div>
                        {/* Trust badges */}
                        <div className="flex items-center gap-6 mt-10 pt-8 border-t border-slate-200">
                            <div className="text-center">
                                <p className="text-2xl font-black text-[#0F172A]">500+</p>
                                <p className="text-[10px] text-[#64748B] font-medium uppercase">Pharmacies Active</p>
                            </div>
                            <div className="w-px h-8 bg-slate-200"></div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-[#0F172A]">12K</p>
                                <p className="text-[10px] text-[#64748B] font-medium uppercase">Customers Served</p>
                            </div>
                            <div className="w-px h-8 bg-slate-200"></div>
                            <div className="text-center">
                                <p className="text-2xl font-black text-[#16A34A]">₹2.4Cr</p>
                                <p className="text-[10px] text-[#64748B] font-medium uppercase">Waste Prevented</p>
                            </div>
                        </div>
                    </div>

                    {/* Hero Illustration — Dashboard Preview */}
                    <div className="relative hidden lg:block">
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                <span className="text-xs text-[#64748B] ml-2">PharmAgent Dashboard</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                                    <p className="text-[9px] text-[#64748B] font-bold uppercase">Critical</p>
                                    <p className="text-xl font-black text-[#DC2626]">05</p>
                                </div>
                                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                                    <p className="text-[9px] text-[#64748B] font-bold uppercase">Warning</p>
                                    <p className="text-xl font-black text-[#D97706]">12</p>
                                </div>
                                <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                    <p className="text-[9px] text-[#64748B] font-bold uppercase">Healthy</p>
                                    <p className="text-xl font-black text-[#16A34A]">89</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="bg-slate-50 h-6 rounded-lg w-full"></div>
                                <div className="bg-blue-50 h-6 rounded-lg w-3/4"></div>
                                <div className="bg-slate-50 h-6 rounded-lg w-5/6"></div>
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -left-4 bg-blue-50 rounded-xl border border-blue-100 p-4 shadow-lg w-48">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-[#2563EB] text-sm">auto_awesome</span>
                                <span className="text-xs font-bold text-[#2563EB]">AI Insight</span>
                            </div>
                            <p className="text-[10px] text-[#64748B]">Paracetamol demand spike expected this week based on seasonal data.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Features Section ── */}
            <section id="features" className="py-20 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB] bg-blue-50 px-4 py-1.5 rounded-full">Features</span>
                        <h2 className="text-3xl font-extrabold mt-4">Everything Your Pharmacy Needs</h2>
                        <p className="text-[#64748B] mt-3 max-w-lg mx-auto">An autonomous AI-powered platform that handles inventory, procurement, patient care, and community redistribution.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((f, idx) => (
                            <div key={idx} className="bg-[#F8FAFC] p-6 rounded-2xl border border-slate-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                                <div className="w-12 h-12 bg-[#2563EB]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[#2563EB] group-hover:text-white">{f.icon}</span>
                                </div>
                                <h3 className="font-bold text-lg text-[#0F172A] mb-2">{f.title}</h3>
                                <p className="text-sm text-[#64748B] leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section id="how-it-works" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-14">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB] bg-blue-50 px-4 py-1.5 rounded-full">How It Works</span>
                        <h2 className="text-3xl font-extrabold mt-4">Three Simple Steps</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((s, idx) => (
                            <div key={idx} className="relative bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center hover:shadow-lg transition-all">
                                <div className="w-16 h-16 bg-[#2563EB] rounded-2xl flex items-center justify-center text-white mx-auto mb-5">
                                    <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                                </div>
                                <span className="text-5xl font-black text-slate-100 absolute top-4 right-6">{s.num}</span>
                                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                                <p className="text-sm text-[#64748B] leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── About Section ── */}
            <section id="about" className="py-20 px-6 bg-white">
                <div className="max-w-4xl mx-auto text-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#2563EB] bg-blue-50 px-4 py-1.5 rounded-full">About</span>
                    <h2 className="text-3xl font-extrabold mt-4 mb-4">Built for Modern Pharmacies</h2>
                    <p className="text-[#64748B] leading-relaxed max-w-2xl mx-auto">
                        PharmAgent is an AI-powered pharmacy supply chain platform designed to eliminate stockouts, predict waste, automate procurement,
                        and connect pharmacies with customers and communities. Our autonomous agent monitors your inventory 24/7 and takes proactive action
                        to keep your pharmacy running at peak efficiency.
                    </p>
                    <div className="flex justify-center gap-8 mt-10">
                        <div className="p-6 bg-[#F8FAFC] rounded-2xl border border-slate-100 w-40">
                            <span className="material-symbols-outlined text-3xl text-[#2563EB] mb-2">verified</span>
                            <p className="text-sm font-bold">CDSCO Compliant</p>
                        </div>
                        <div className="p-6 bg-[#F8FAFC] rounded-2xl border border-slate-100 w-40">
                            <span className="material-symbols-outlined text-3xl text-[#16A34A] mb-2">security</span>
                            <p className="text-sm font-bold">HIPAA Ready</p>
                        </div>
                        <div className="p-6 bg-[#F8FAFC] rounded-2xl border border-slate-100 w-40">
                            <span className="material-symbols-outlined text-3xl text-indigo-600 mb-2">cloud_done</span>
                            <p className="text-sm font-bold">Cloud Native</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Contact / CTA Section ── */}
            <section id="contact" className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-[#2563EB] to-indigo-700 rounded-3xl p-12 text-white text-center shadow-2xl">
                        <h2 className="text-3xl font-extrabold mb-4">Ready to Transform Your Pharmacy?</h2>
                        <p className="text-base opacity-90 mb-8 max-w-lg mx-auto">Join 500+ pharmacies already using PharmAgent to reduce waste, prevent stockouts, and deliver better customer care.</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => navigate('/pharmacy-login')}
                                className="px-8 py-3.5 bg-white text-[#2563EB] font-bold rounded-xl hover:bg-blue-50 transition-colors active:scale-95"
                            >Get Started — Free</button>
                            <button className="px-8 py-3.5 border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 transition-colors active:scale-95">
                                Contact Sales
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="bg-white border-t border-slate-100 py-10 px-6">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-[#2563EB] rounded-lg p-1.5 text-white">
                            <span className="material-symbols-outlined text-sm">pill</span>
                        </div>
                        <span className="font-bold">PharmAgent</span>
                        <span className="text-xs text-[#64748B] ml-2">© 2026 All rights reserved.</span>
                    </div>
                    <div className="flex gap-6 text-sm text-[#64748B]">
                        <a href="#" className="hover:text-[#0F172A]">Privacy</a>
                        <a href="#" className="hover:text-[#0F172A]">Terms</a>
                        <a href="#" className="hover:text-[#0F172A]">Support</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInventorySnapshot, getExpiryRiskDrugs, getCriticalDrugs, daysUntil } from '../utils/inventoryEngine';
import { computeDemandSpikes } from '../utils/demandEngine';
import { alerts, financialData, otSchedule, admissionForecast } from '../data/mockData';
import { getInventorySuggestions, getMedicalDiagnosis } from '../utils/aiService';
import { predictDisease, extractSymptomIndices, loadPredictorModel } from '../utils/symptomPredictor';

export default function Dashboard() {
    const navigate = useNavigate();
    const [showSearch, setShowSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // AI Assistant chat state
    const [showAIChat, setShowAIChat] = useState(false);
    const [aiChatInput, setAiChatInput] = useState('');
    const [aiChatHistory, setAiChatHistory] = useState([]);
    const [aiChatLoading, setAiChatLoading] = useState(false);

    // AI Symptom Checker State
    const [symptomInput, setSymptomInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [groqPrediction, setGroqPrediction] = useState(null);
    const [localPredictions, setLocalPredictions] = useState([]);

    // Load ML model on mount
    React.useEffect(() => {
        loadPredictorModel();
    }, []);

    const handleSymptomAnalysis = async () => {
        if (!symptomInput.trim()) return;
        setIsAnalyzing(true);
        setGroqPrediction(null);
        setLocalPredictions([]);

        try {
            // 1. Run local fast ML prediction
            const activeIndices = extractSymptomIndices(symptomInput);
            if (activeIndices.length > 0) {
                const predictions = await predictDisease(activeIndices);
                setLocalPredictions(predictions);
            }

            // 2. Run Groq LLM prediction
            const result = await getMedicalDiagnosis(symptomInput);
            if (result.success) {
                setGroqPrediction(result.message);
            } else {
                setGroqPrediction('Failed to connect to AI service. Please try again.');
            }
        } catch (error) {
            console.error('Symptom analysis failed:', error);
            setGroqPrediction('An error occurred during analysis.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAIChatSend = async () => {
        if (!aiChatInput.trim() || aiChatLoading) return;
        const userMsg = aiChatInput;
        setAiChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
        setAiChatInput('');
        setAiChatLoading(true);
        const context = `Critical Alerts: ${criticalCount}, Warning Alerts: ${warningCount}, Expiry Risks: ${expiryRiskCount}`;
        const result = await getInventorySuggestions(userMsg, context);
        setAiChatHistory(prev => [...prev, { role: 'ai', text: result.success ? result.message : 'Sorry, AI service is unavailable right now.' }]);
        setAiChatLoading(false);
    };

    const inventory = getInventorySnapshot();
    const criticalDrugs = getCriticalDrugs();
    const expiryRiskDrugs = getExpiryRiskDrugs();
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const warningAlerts = alerts.filter(a => a.severity === 'warning');

    // compute stats
    const criticalCount = criticalAlerts.length;
    const warningCount = warningAlerts.length;
    const expiryRiskCount = expiryRiskDrugs.length;
    const fd = financialData;

    // top 2 urgent replenishment items  
    const urgentItems = criticalDrugs.filter(d => d.stockStatus === 'CRITICAL').slice(0, 2);

    // Near expiry risk items
    const nearExpiryTop = expiryRiskDrugs.slice(0, 3);

    // financial leaks
    const topLeaks = fd.topLossDrugs.slice(0, 3);
    const totalLeakage = topLeaks.reduce((s, d) => s + d.loss, 0);

    // search panel
    const searchResults = searchTerm.length > 1
        ? inventory.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5)
        : [];

    // upcoming surgeries
    const upcomingSurgeries = otSchedule.length;
    const admissions48h = admissionForecast.filter(p => {
        const days = daysUntil(p.admissionDate);
        return days >= 0 && days <= 2;
    }).length;

    return (
        <>
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Good Morning, Dr. Meera</h2>
                    <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5">
                            <span className="flex h-2 w-2 rounded-full bg-safe animate-pulse"></span>
                            <span className="text-xs font-semibold text-safe uppercase tracking-wider">Agent Active</span>
                        </div>
                        <div className="h-4 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-1 text-slate-500">
                            <span className="material-symbols-outlined text-sm">history</span>
                            <span className="text-xs">Last Scan: 3 mins ago</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                            <span className="material-symbols-outlined">search</span>
                        </button>
                        {showSearch && (
                            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-30">
                                <input
                                    autoFocus
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/50"
                                    placeholder="Quick search drugs..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchResults.length > 0 && (
                                    <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                                        {searchResults.map(d => (
                                            <button
                                                key={d.id}
                                                onClick={() => { setShowSearch(false); setSearchTerm(''); navigate('/dashboard/inventory'); }}
                                                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-primary/5 transition-colors"
                                            >
                                                <span className="text-sm font-medium">{d.name}</span>
                                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${d.stockStatus === 'CRITICAL' ? 'bg-red-100 text-red-600' : d.stockStatus === 'WARNING' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>{d.totalQuantity} units</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {searchTerm.length > 1 && searchResults.length === 0 && (
                                    <p className="text-xs text-slate-400 mt-3 text-center">No drugs found.</p>
                                )}
                            </div>
                        )}
                    </div>
                    <button onClick={() => navigate('/dashboard/alerts')} className="p-2 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 relative">
                        <span className="material-symbols-outlined">notifications</span>
                        {criticalCount > 0 && <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-critical rounded-full border-2 border-white"></span>}
                    </button>
                </div>
            </header>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Critical Alerts" value={String(criticalCount).padStart(2, '0')}
                    icon="error" color="critical"
                    subtitle={`${criticalCount} active now`} subtitleIcon="trending_up"
                    onClick={() => navigate('/dashboard/alerts')}
                />
                <StatCard
                    title="Warnings" value={String(warningCount).padStart(2, '0')}
                    icon="warning" color="warning"
                    subtitle="Stock levels fluctuating"
                    onClick={() => navigate('/dashboard/alerts')}
                />
                <StatCard
                    title="Expiry Risk" value={String(expiryRiskCount).padStart(2, '0')}
                    icon="event_note" color="expiry"
                    subtitle="Action required < 30d" subtitleIcon="priority_high"
                    onClick={() => navigate('/dashboard/expiry')}
                />
                <StatCard
                    title="PO's Today" value="08"
                    icon="local_shipping" color="info"
                    subtitle="3 Delivered" subtitleIcon="check_circle" subtitleColor="safe"
                    onClick={() => navigate('/dashboard/procurement')}
                />
            </div>

            {/* Critical Alerts Panel */}
            <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-critical">notification_important</span>
                        Urgent Replenishment Required
                    </h3>
                    <button onClick={() => navigate('/dashboard/alerts')} className="text-primary text-sm font-bold hover:underline">View All Alerts</button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {urgentItems.length > 0 ? urgentItems.map(drug => (
                        <AlertCard
                            key={drug.id}
                            icon="emergency"
                            name={drug.name}
                            stock={`${drug.totalQuantity} Units`}
                            stockout={drug.totalQuantity < 10 ? 'Tomorrow' : 'In 2 Days'}
                            onOrder={() => navigate('/dashboard/procurement')}
                            onDetails={() => navigate('/dashboard/inventory')}
                        />
                    )) : (
                        <>
                            <AlertCard icon="emergency" name="Amoxicillin 500mg (Cap)" stock="15 Units" stockout="In 2 Days" onOrder={() => navigate('/dashboard/procurement')} onDetails={() => navigate('/dashboard/inventory')} />
                            <AlertCard icon="vaccines" name="Insulin Glargine 100 IU" stock="04 Vials" stockout="Tomorrow" onOrder={() => navigate('/dashboard/procurement')} onDetails={() => navigate('/dashboard/inventory')} />
                        </>
                    )}
                </div>
            </section>

            {/* Middle section: Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Budget Gauge */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/dashboard/financial')}>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900">Monthly Procurement Budget</h3>
                        <span className="text-xs font-semibold text-slate-500">{fd.cycle}</span>
                    </div>
                    <div className="flex items-end justify-between mb-2">
                        <p className="text-3xl font-bold text-slate-900">₹ {(fd.spent / 100000).toFixed(1)}L <span className="text-sm font-normal text-slate-400">/ {(fd.monthlyBudget / 100000).toFixed(1)}L</span></p>
                        <p className="text-sm font-bold text-expiry">{Math.round(fd.spent / fd.monthlyBudget * 100)}% Used</p>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
                        <div className="bg-gradient-to-r from-primary to-expiry h-full rounded-full transition-all" style={{ width: `${Math.round(fd.spent / fd.monthlyBudget * 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                        <p>Remaining: ₹ {(fd.remaining / 1000).toFixed(0)}K</p>
                        <p>Projected: ₹ {((fd.spent + fd.expiryRiskAmount) / 100000).toFixed(1)}L (Overbudget)</p>
                    </div>
                </div>

                {/* Demand Forecast */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900">Demand Drivers (Next 48h)</h3>
                        <div className="flex gap-2">
                            <span className="w-3 h-3 rounded-full bg-info/20 border border-info"></span>
                            <span className="w-3 h-3 rounded-full bg-donation/20 border border-donation"></span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-info/5 border border-info/10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-info text-lg">surgical</span>
                                <p className="text-xs font-bold text-info uppercase">Scheduled Surgeries</p>
                            </div>
                            <p className="text-2xl font-black text-slate-900">{upcomingSurgeries}</p>
                            <p className="text-[10px] text-slate-500 mt-1">+15% vs Avg</p>
                        </div>
                        <div className="p-4 rounded-xl bg-donation/5 border border-donation/10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-donation text-lg">bed</span>
                                <p className="text-xs font-bold text-donation uppercase">Emergency Admissions</p>
                            </div>
                            <p className="text-2xl font-black text-slate-900">{admissions48h}</p>
                            <p className="text-[10px] text-slate-500 mt-1">Steady flow</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Symptom Checker & Triage Analyzer */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mb-8">
                <h4 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">stethoscope</span>
                    AI Symptom & Triage Analyzer
                </h4>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Describe Patient Symptoms</label>
                        <textarea
                            className="w-full p-4 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 bg-slate-50 outline-none transition-shadow"
                            rows="2"
                            placeholder="e.g., Patient is experiencing severe headache, nausea, and sensitivity to light for the past 2 days..."
                            value={symptomInput}
                            onChange={(e) => setSymptomInput(e.target.value)}
                        ></textarea>
                    </div>

                    <button
                        onClick={handleSymptomAnalysis}
                        disabled={isAnalyzing || !symptomInput.trim()}
                        className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        {isAnalyzing ? (
                            <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> Analyzing with ML Models...</>
                        ) : (
                            <><span className="material-symbols-outlined text-sm">magic_button</span> Generate Medicine Suggestion</>
                        )}
                    </button>

                    {/* Local ML Diagnostics Panel */}
                    {localPredictions.length > 0 && (
                        <div className="mt-6 border border-indigo-100 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-gradient-to-r from-indigo-50 to-white px-5 py-3 border-b border-indigo-100 flex items-center gap-2">
                                <span className="material-symbols-outlined text-indigo-600">biotech</span>
                                <h5 className="font-bold text-indigo-900 text-sm">Local ML Diagnostics (Trained on 5K Clinical Records)</h5>
                            </div>
                            <div className="p-5 bg-white space-y-5">
                                {localPredictions.slice(0, 2).map((pred, i) => (
                                    <div key={i} className={i > 0 ? "pt-5 border-t border-slate-100" : ""}>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-bold text-slate-800 text-lg">{pred.disease}</span>
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200`}>
                                                {pred.confidence}% Match
                                            </span>
                                        </div>
                                        {pred.details && (
                                            <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <p className="font-semibold text-slate-800 mb-2">Recommended Primary Care:</p>
                                                <ul className="list-inside list-disc space-y-1.5 text-sm">
                                                    {pred.details.medicines.map((med, j) => (
                                                        <li key={j}><span className="font-semibold text-slate-700">{med.name}</span> <span className="text-slate-500">— {med.dosage} ({med.type})</span></li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Groq AI Response Panel */}
                    {groqPrediction && (
                        <div className="mt-4 border border-blue-100 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-gradient-to-r from-blue-50 to-white px-5 py-3 border-b border-blue-100 flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-600">psychology</span>
                                <h5 className="font-bold text-blue-900 text-sm">Groq LLM Clinical Guidance</h5>
                            </div>
                            <div className="p-6 bg-white prose prose-sm max-w-none text-slate-700">
                                <div className="whitespace-pre-wrap leading-relaxed text-sm">
                                    {groqPrediction.split('\n\n').map((para, i) => {
                                        if (para.includes('**')) {
                                            const formatted = para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
                                            return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} className="mb-4" />;
                                        }
                                        return <p key={i} className="mb-4">{para}</p>;
                                    })}
                                </div>
                            </div>
                            <div className="bg-slate-50 px-5 py-3 text-[11px] font-medium text-slate-500 border-t border-slate-100 flex items-start gap-2">
                                <span className="material-symbols-outlined text-[14px] mt-0.5 text-blue-500">info</span>
                                This is AI-generated clinical assistance. Final diagnosis and prescription must be verified by a registered medical practitioner.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Near-Expiry Risk List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-slate-900">Near-Expiry Risk List</h3>
                        <button onClick={() => navigate('/dashboard/expiry')} className="text-primary text-xs font-bold hover:underline">Batch Relocation</button>
                    </div>
                    <div className="space-y-4">
                        {nearExpiryTop.length > 0 ? nearExpiryTop.map((drug, idx) => (
                            <ExpiryItem
                                key={`${drug.id}-${drug.riskBatch.batchId}`}
                                name={drug.name}
                                batch={`Batch #${drug.riskBatch.batchId} • ${drug.riskBatch.quantity} Units`}
                                days={`${drug.riskBatch.daysToExpiry} Days Left`}
                                risk={`${drug.expiryRisk} Risk`}
                                color={drug.expiryRisk === 'HIGH' ? 'expiry' : 'warning'}
                                icon={drug.expiryRisk === 'HIGH' ? 'hourglass_top' : 'hourglass_bottom'}
                                onClick={() => navigate('/dashboard/expiry')}
                            />
                        )) : (
                            <>
                                <ExpiryItem name="Ceftriaxone 1g Inj." batch="Batch #TX-2210 • 45 Units" days="12 Days Left" risk="High Risk" color="expiry" icon="hourglass_top" onClick={() => navigate('/dashboard/expiry')} />
                                <ExpiryItem name="Metoprolol 25mg" batch="Batch #MP-9881 • 210 Units" days="28 Days Left" risk="Medium Risk" color="warning" icon="hourglass_bottom" onClick={() => navigate('/dashboard/expiry')} />
                            </>
                        )}
                    </div>
                </div>

                {/* Top Financial Leaks */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-slate-900">Top Financial Leaks (This Month)</h3>
                        <button onClick={() => navigate('/dashboard/financial')} className="material-symbols-outlined text-slate-400 hover:text-primary">info</button>
                    </div>
                    <div className="space-y-4">
                        {topLeaks.map((drug, idx) => (
                            <LeakItem key={idx} rank={String(idx + 1).padStart(2, '0')} name={drug.name} reason={`Reason: ${drug.reason}`} amount={`₹ ${drug.loss.toLocaleString('en-IN')}`} />
                        ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                            <p className="text-xs font-bold text-slate-500">Total Loss Leakage</p>
                            <p className="text-lg font-black text-slate-900">₹ {totalLeakage.toLocaleString('en-IN')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating AI Assistant Widget */}
            <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
                {showAIChat && (
                    <div className="w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col" style={{ maxHeight: '480px' }}>
                        <div className="px-5 py-3 bg-gradient-to-r from-[#2563EB] to-indigo-600 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-sm">auto_awesome</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-bold text-sm">AI Assistant</h4>
                                <p className="text-white/60 text-[10px]">Ask about medicines, symptoms, or inventory</p>
                            </div>
                            <button onClick={() => setShowAIChat(false)} className="text-white/60 hover:text-white transition-colors">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-slate-50/50" style={{ maxHeight: '300px' }}>
                            {aiChatHistory.length === 0 && (
                                <div className="text-center py-8 text-slate-400">
                                    <span className="material-symbols-outlined text-3xl">smart_toy</span>
                                    <p className="text-xs font-medium mt-2">Hi! How can I help you today?</p>
                                    <div className="mt-4 space-y-1.5">
                                        {['What medicine for fever?', 'Low stock suggestions', 'Drug interaction check'].map(q => (
                                            <button key={q} onClick={() => { setAiChatInput(q); }}
                                                className="block mx-auto px-3 py-1.5 bg-white border border-slate-200 rounded-full text-[11px] font-medium text-slate-500 hover:bg-blue-50 hover:text-[#2563EB] hover:border-blue-200 transition-colors">
                                                {q}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {aiChatHistory.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-[#2563EB] text-white rounded-br-sm'
                                        : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm shadow-sm'
                                        }`}>
                                        <div className="whitespace-pre-wrap text-xs">{msg.text}</div>
                                    </div>
                                </div>
                            ))}
                            {aiChatLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-slate-100 px-3.5 py-2.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2 text-xs text-slate-500">
                                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                        Thinking...
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-slate-100 flex gap-2">
                            <input
                                type="text" value={aiChatInput}
                                onChange={e => setAiChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAIChatSend()}
                                placeholder="Ask anything..."
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400"
                            />
                            <button onClick={handleAIChatSend} disabled={aiChatLoading || !aiChatInput.trim()}
                                className="px-3 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                                <span className="material-symbols-outlined text-sm">send</span>
                            </button>
                        </div>
                    </div>
                )}

                <button onClick={() => setShowAIChat(!showAIChat)}
                    className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-90 ${showAIChat ? 'bg-slate-700 hover:bg-slate-800' : 'bg-[#2563EB] hover:bg-blue-700 shadow-blue-200'}`}>
                    <span className="material-symbols-outlined text-white text-2xl">{showAIChat ? 'close' : 'auto_awesome'}</span>
                </button>
            </div>
        </>
    );
}

function StatCard({ title, value, icon, color, subtitle, subtitleIcon, subtitleColor, onClick }) {
    const sc = subtitleColor || color;
    return (
        <div
            onClick={onClick}
            className={`bg-white p-5 rounded-2xl border-l-4 border-${color} shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]`}
        >
            <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{title}</p>
                <span className={`material-symbols-outlined text-${color} bg-${color}/10 p-1.5 rounded-lg`}>{icon}</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            <p className={`text-xs font-medium text-${sc} mt-1 flex items-center gap-1`}>
                {subtitleIcon && <span className="material-symbols-outlined text-xs">{subtitleIcon}</span>}
                {subtitle}
            </p>
        </div>
    );
}

function AlertCard({ icon, name, stock, stockout, onOrder, onDetails }) {
    return (
        <div className="bg-white rounded-2xl border border-critical/20 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-all">
            <div className="bg-critical/5 rounded-xl p-3 flex-shrink-0">
                <span className="material-symbols-outlined text-critical text-3xl">{icon}</span>
            </div>
            <div className="flex-1">
                <div className="flex justify-between">
                    <h4 className="font-bold text-slate-900 text-base">{name}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-critical/10 text-critical text-[10px] font-bold uppercase">Critical</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Remaining Stock</p>
                        <p className="text-sm font-bold text-slate-900">{stock}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold text-right">Predicted Stockout</p>
                        <p className="text-sm font-bold text-critical text-right">{stockout}</p>
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <button onClick={onOrder} className="flex-1 bg-critical text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-critical/90 transition-colors active:scale-95">Order Now</button>
                    <button onClick={onDetails} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 active:scale-95">View Details</button>
                </div>
            </div>
        </div>
    );
}

function ExpiryItem({ name, batch, days, risk, color, icon, onClick }) {
    return (
        <div onClick={onClick} className="flex items-center gap-3 p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
            <div className={`w-10 h-10 rounded-lg bg-${color}/10 flex items-center justify-center text-${color}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{name}</p>
                <p className="text-[10px] text-slate-500">{batch}</p>
            </div>
            <div className="text-right">
                <p className={`text-xs font-bold text-${color}`}>{days}</p>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{risk}</span>
            </div>
        </div>
    );
}

function LeakItem({ rank, name, reason, amount }) {
    return (
        <div className="flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 w-4">{rank}</span>
                <div>
                    <p className="text-sm font-bold text-slate-900">{name}</p>
                    <p className="text-[10px] text-slate-500">{reason}</p>
                </div>
            </div>
            <p className="text-sm font-bold text-critical">{amount}</p>
        </div>
    );
}

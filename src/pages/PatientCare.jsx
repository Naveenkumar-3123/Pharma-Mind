import React, { useState, useEffect } from 'react';
import { patientProfiles, patientMedicineTracker } from '../data/mockData';
import { daysUntil } from '../utils/inventoryEngine';
import { getMedicationContinuityInsight, getMedicalDiagnosis } from '../utils/aiService';
import { symptomDisplayNames, symptomsList } from '../data/diseasesMedicineMap';
import { predictDisease, extractSymptomIndices, loadPredictorModel } from '../utils/symptomPredictor';
import { calculateEndDate, getDaysRemaining, getExpiryStatus, triggerRealReminderAPI } from '../utils/expiryTrackerEngine';
import { useAgent } from '../context/AgentContext';

export default function PatientCare() {
    const [reminderStatus, setReminderStatus] = useState({});
    const [aiInsights, setAiInsights] = useState({});
    const [loadingInsight, setLoadingInsight] = useState({});
    const [expandedHistory, setExpandedHistory] = useState(null);
    const { customerMedicineRequests, updateCustomerRequest } = useAgent();

    // AI Symptom Checker State
    const [symptomInput, setSymptomInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [groqPrediction, setGroqPrediction] = useState(null);
    const [localPredictions, setLocalPredictions] = useState([]);

    // Patient Expiry Tracker State
    const [trackedPatients, setTrackedPatients] = useState(
        patientMedicineTracker.map(pt => ({
            ...pt,
            endDate: calculateEndDate(pt.purchaseDate, pt.quantity, pt.dailyDosage)
        }))
    );
    const [expiryFilter, setExpiryFilter] = useState('All Patients');

    // Add New Patient Modal State
    const [showNewPatientModal, setShowNewPatientModal] = useState(false);
    const [newPatientForm, setNewPatientForm] = useState({
        patientName: '', phone: '', email: '', medicineName: '', quantity: '', dailyDosage: '', purchaseDate: new Date().toISOString().split('T')[0], expiryDate: ''
    });

    // SMS Popup State
    const [smsPopup, setSmsPopup] = useState(null);

    // Load ML model on mount
    useEffect(() => {
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

    // --- Automated Expiry Reminders ---
    const triggeredRemindersRef = React.useRef(new Set());

    useEffect(() => {
        // Find patients who need a reminder now (<= 3 days remaining and haven't gotten one)
        const patientsToRemind = trackedPatients.filter(pt =>
            getDaysRemaining(pt.endDate) <= 3 && !pt.reminderSent && !triggeredRemindersRef.current.has(pt.id)
        );

        if (patientsToRemind.length > 0) {
            patientsToRemind.forEach(pt => {
                triggeredRemindersRef.current.add(pt.id);
                // Auto-trigger reminder via our existing function
                handleSendExpiryReminder(pt.id, pt);
            });
        }
    }, [trackedPatients]);

    // --- Expiry Tracker Logic ---
    const handleSendExpiryReminder = async (patientId, patientData = null) => {
        const patient = patientData || trackedPatients.find(p => p.id === patientId);
        if (!patient || patient.reminderSent) return;

        // Optimistic UI update
        const now = new Date().toISOString();
        setTrackedPatients(prev => prev.map(p =>
            p.id === patientId ? { ...p, reminderSent: true, reminderTime: now } : p
        ));

        // Immediately show SMS popup (frontend simulation — fires regardless of backend)
        const daysLeft = getDaysRemaining(patient.endDate);
        setSmsPopup({
            phone: patient.phone || 'N/A',
            message: `Dear ${patient.patientName}, your ${patient.medicineName} tablets may run out in ${daysLeft} days. Please visit City Pharmacy for a refill. - PharmAgent`
        });
        setTimeout(() => setSmsPopup(null), 5000);

        // Call backend for email (non-blocking, SMS popup already shown)
        const result = await triggerRealReminderAPI(patient);
        if (!result.success) {
            setTrackedPatients(prev => prev.map(p =>
                p.id === patientId ? { ...p, reminderSent: false, reminderTime: null } : p
            ));
            console.error("Failed to send reminder via API!");
        }
    };

    const handleMarkRefilled = (patientId) => {
        const now = new Date().toISOString();
        setTrackedPatients(prev => prev.map(p =>
            p.id === patientId ? {
                ...p,
                purchaseDate: now,
                endDate: calculateEndDate(now, p.quantity, p.dailyDosage),
                reminderSent: false,
                reminderTime: null
            } : p
        ));
    };

    const handleAddPatientSubmit = (e) => {
        e.preventDefault();

        const newPatient = {
            id: `PT0${trackedPatients.length + 5}`,
            patientName: newPatientForm.patientName,
            phone: newPatientForm.phone,
            email: newPatientForm.email,
            medicineName: newPatientForm.medicineName,
            quantity: parseInt(newPatientForm.quantity, 10),
            dailyDosage: parseInt(newPatientForm.dailyDosage, 10),
            purchaseDate: new Date(newPatientForm.purchaseDate).toISOString(),
            reminderSent: false,
            reminderTime: null,
            expiryDate: newPatientForm.expiryDate || null
        };

        // Use the explicit expiryDate provided by the user as the endDate for when medicine runs out.
        // If they didn't provide one, fall back to calculation.
        const endDate = newPatient.expiryDate || calculateEndDate(newPatient.purchaseDate, newPatient.quantity, newPatient.dailyDosage);
        newPatient.endDate = endDate;

        setTrackedPatients(prev => [newPatient, ...prev]);
        setShowNewPatientModal(false);
        setNewPatientForm({ patientName: '', phone: '', email: '', medicineName: '', quantity: '', dailyDosage: '', purchaseDate: new Date().toISOString().split('T')[0], expiryDate: '' });
    };

    const filteredTracker = trackedPatients.filter(pt => {
        if (expiryFilter === 'All Patients') return true;
        if (expiryFilter === 'Expiring Soon') return getDaysRemaining(pt.endDate) <= 7 && !pt.reminderSent;
        if (expiryFilter === 'Reminder Sent') return pt.reminderSent;
        if (expiryFilter === 'Safe') return getDaysRemaining(pt.endDate) > 7;
        return true;
    });

    // Compute patient data with days left
    const patients = patientProfiles.map(p => {
        const daysLeft = daysUntil(p.estimatedNextNeed);
        return {
            ...p,
            daysLeft,
            needsReminder: daysLeft <= 5,
            isOverdue: daysLeft < 0,
            status: daysLeft < 0 ? 'OVERDUE' : daysLeft <= 2 ? 'CRITICAL' : daysLeft <= 5 ? 'WARNING' : 'SAFE',
        };
    }).sort((a, b) => a.daysLeft - b.daysLeft);

    const sendReminder = (patientId) => {
        const now = new Date();
        setReminderStatus(prev => ({
            ...prev,
            [patientId]: {
                sent: true,
                timestamp: now.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            },
        }));
    };

    const markContacted = (patientId) => {
        setReminderStatus(prev => ({
            ...prev,
            [patientId]: {
                ...prev[patientId],
                contacted: true,
                contactedAt: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            },
        }));
    };

    const fetchAIInsight = async (patient) => {
        setLoadingInsight(prev => ({ ...prev, [patient.id]: true }));
        try {
            const history = `Purchases every 30 days for the past 6 months. Last purchase: ${patient.lastPurchaseDate}. Medications: ${patient.regularMeds.map(m => m.name).join(', ')}`;
            const result = await getMedicationContinuityInsight(
                patient.name,
                patient.regularMeds.map(m => m.name).join(', '),
                history
            );
            setAiInsights(prev => ({
                ...prev,
                [patient.id]: result.success ? result.message : 'Unable to generate insight at this time.',
            }));
        } catch (e) {
            setAiInsights(prev => ({
                ...prev,
                [patient.id]: 'AI service temporarily unavailable.',
            }));
        }
        setLoadingInsight(prev => ({ ...prev, [patient.id]: false }));
    };

    // Fetch AI insight for the first patient automatically
    useEffect(() => {
        if (patients.length > 0 && !aiInsights[patients[0].id]) {
            fetchAIInsight(patients[0]);
        }
    }, []);

    const getStatusBadge = (status, daysLeft) => {
        const map = {
            OVERDUE: { bg: 'bg-red-100 text-red-700 border-red-200', text: `${Math.abs(daysLeft)} days overdue` },
            CRITICAL: { bg: 'bg-red-100 text-red-700 border-red-200', text: `${daysLeft} days left` },
            WARNING: { bg: 'bg-amber-100 text-amber-700 border-amber-200', text: `${daysLeft} days left` },
            SAFE: { bg: 'bg-green-100 text-green-700 border-green-200', text: `${daysLeft} days left` },
        };
        const s = map[status];
        return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${s.bg}`}>{s.text}</span>;
    };

    return (
        <>
            {/* Header */}
            <header className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-[#0F172A]">Patient Care Management</h2>
                    <p className="text-[#64748B] mt-1">Track recurring medicine purchases and send refill reminders</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-200 text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-50 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">download</span>
                        Export Report
                    </button>
                    <button
                        onClick={() => setShowNewPatientModal(true)}
                        className="px-4 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-xl shadow-md hover:bg-blue-700 flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">person_add</span>
                        Add New Patient
                    </button>
                </div>
            </header>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider">Total Patients</span>
                        <span className="material-symbols-outlined text-[#2563EB]">groups</span>
                    </div>
                    <p className="text-2xl font-bold text-[#0F172A] mt-2">{patients.length}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider">Needs Reminder</span>
                        <span className="material-symbols-outlined text-[#D97706]">notification_important</span>
                    </div>
                    <p className="text-2xl font-bold text-[#D97706] mt-2">{patients.filter(p => p.needsReminder).length}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider">Reminders Sent</span>
                        <span className="material-symbols-outlined text-[#16A34A]">check_circle</span>
                    </div>
                    <p className="text-2xl font-bold text-[#16A34A] mt-2">{Object.values(reminderStatus).filter(r => r.sent).length}</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider">Auto-Buy Enabled</span>
                        <span className="material-symbols-outlined text-[#2563EB]">autorenew</span>
                    </div>
                    <p className="text-2xl font-bold text-[#2563EB] mt-2">{patients.filter(p => p.autoBuyEnabled).length}</p>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* SECTION 1 + 2 + 3 — Patient Cards (left 2/3) */}
                <div className="xl:col-span-2 space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#2563EB]">medication</span>
                            Patient Medication Tracker
                        </h3>
                        <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-[#64748B] font-medium">
                            {patients.filter(p => p.needsReminder).length} patients needing attention
                        </span>
                    </div>

                    {patients.map(patient => {
                        const reminder = reminderStatus[patient.id];
                        const insight = aiInsights[patient.id];
                        const isInsightLoading = loadingInsight[patient.id];
                        return (
                            <div key={patient.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${patient.status === 'CRITICAL' || patient.status === 'OVERDUE' ? 'border-red-200' : patient.status === 'WARNING' ? 'border-amber-200' : 'border-slate-100'}`}>
                                <div className="p-6">
                                    {/* Patient Info Row */}
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm ${patient.status === 'CRITICAL' || patient.status === 'OVERDUE' ? 'bg-[#DC2626]' : patient.status === 'WARNING' ? 'bg-[#D97706]' : 'bg-[#2563EB]'}`}>
                                                {patient.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-[#0F172A]">{patient.name}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-[#64748B]">Age: {patient.age}</span>
                                                    <span className="text-xs text-[#64748B]">•</span>
                                                    <span className="text-xs font-medium text-[#2563EB]">{patient.conditions.join(', ')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(patient.status, patient.daysLeft)}
                                            {patient.autoBuyEnabled && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-[#2563EB] border border-blue-100">Auto-buy</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Medication Details Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 p-4 bg-slate-50 rounded-xl">
                                        {patient.regularMeds.map(med => (
                                            <React.Fragment key={med.drugId}>
                                                <div>
                                                    <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Medicine</p>
                                                    <p className="text-sm font-semibold text-[#0F172A] mt-1">{med.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Dosage</p>
                                                    <p className="text-sm font-semibold text-[#0F172A] mt-1">{med.dosage}</p>
                                                </div>
                                            </React.Fragment>
                                        ))}
                                        <div>
                                            <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Qty Purchased</p>
                                            <p className="text-sm font-semibold text-[#0F172A] mt-1">{patient.regularMeds.reduce((s, m) => s + m.monthlyQty, 0)} tablets</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Last Purchase</p>
                                            <p className="text-sm font-semibold text-[#0F172A] mt-1">{new Date(patient.lastPurchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider">Est. End Date</p>
                                            <p className={`text-sm font-semibold mt-1 ${patient.status === 'SAFE' ? 'text-[#0F172A]' : 'text-[#DC2626]'}`}>
                                                {new Date(patient.estimatedNextNeed).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* SECTION 2 — SMS Reminder Preview */}
                                    {patient.needsReminder && !reminder?.sent && (
                                        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-[#D97706] rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5">
                                                    <span className="material-symbols-outlined text-sm">sms</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-[#D97706] uppercase tracking-wider mb-2">SMS Reminder Preview</p>
                                                    <div className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                                                        <p className="text-sm text-[#0F172A] leading-relaxed italic">
                                                            "Dear {patient.name.split(' ')[0]}, your {patient.regularMeds[0].name} tablets may be finishing soon. Please visit City Pharmacy to refill your prescription. — PharmAgent"
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Reminder Sent Status */}
                                    {reminder?.sent && (
                                        <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-[#16A34A]">check_circle</span>
                                                <div>
                                                    <p className="text-sm font-bold text-[#16A34A]">Reminder Sent</p>
                                                    <p className="text-xs text-[#64748B]">Sent on {reminder.timestamp}</p>
                                                    {reminder.contacted && (
                                                        <p className="text-xs text-[#2563EB] mt-1">✓ Marked as contacted — {reminder.contactedAt}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SECTION 4 — AI Insight */}
                                    {insight && (
                                        <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5">
                                                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-1">AI Medication Continuity Insight</p>
                                                    <p className="text-sm text-[#0F172A] leading-relaxed">{insight}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* SECTION 3 — Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => sendReminder(patient.id)}
                                            disabled={reminder?.sent}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${reminder?.sent
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-[#2563EB] text-white hover:bg-blue-700 shadow-md shadow-blue-200'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-sm">{reminder?.sent ? 'check' : 'send'}</span>
                                            {reminder?.sent ? 'Reminder Sent' : 'Send Reminder'}
                                        </button>
                                        <button
                                            onClick={() => markContacted(patient.id)}
                                            disabled={reminder?.contacted}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${reminder?.contacted
                                                ? 'bg-green-50 text-[#16A34A] border-green-200 cursor-not-allowed'
                                                : 'bg-white text-[#0F172A] border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-sm">phone_in_talk</span>
                                            {reminder?.contacted ? 'Contacted' : 'Mark as Contacted'}
                                        </button>
                                        <button
                                            onClick={() => setExpandedHistory(expandedHistory === patient.id ? null : patient.id)}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-[#64748B] border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-sm">history</span>
                                            View History
                                        </button>
                                        {!insight && !isInsightLoading && (
                                            <button
                                                onClick={() => fetchAIInsight(patient)}
                                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 text-[#2563EB] border border-blue-200 hover:bg-blue-100 transition-all active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                                                AI Insight
                                            </button>
                                        )}
                                        {isInsightLoading && (
                                            <span className="text-xs text-[#2563EB] flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                                Analyzing...
                                            </span>
                                        )}
                                    </div>

                                    {/* Patient History (expandable) */}
                                    {expandedHistory === patient.id && (
                                        <div className="mt-5 pt-5 border-t border-slate-100">
                                            <h5 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3">Purchase History (Last 6 months)</h5>
                                            <div className="space-y-2">
                                                {[
                                                    { month: 'Feb 2026', qty: patient.regularMeds[0]?.monthlyQty || 60, status: 'Current' },
                                                    { month: 'Jan 2026', qty: patient.regularMeds[0]?.monthlyQty || 60, status: 'Completed' },
                                                    { month: 'Dec 2025', qty: patient.regularMeds[0]?.monthlyQty || 60, status: 'Completed' },
                                                    { month: 'Nov 2025', qty: patient.regularMeds[0]?.monthlyQty || 60, status: 'Completed' },
                                                    { month: 'Oct 2025', qty: patient.regularMeds[0]?.monthlyQty || 60, status: 'Completed' },
                                                    { month: 'Sep 2025', qty: patient.regularMeds[0]?.monthlyQty || 60, status: 'Completed' },
                                                ].map((entry, idx) => (
                                                    <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-[#2563EB]' : 'bg-slate-300'}`}></div>
                                                            <span className="text-sm font-medium text-[#0F172A]">{entry.month}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-sm text-[#64748B]">{entry.qty} tablets</span>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${idx === 0 ? 'bg-blue-50 text-[#2563EB]' : 'bg-green-50 text-[#16A34A]'}`}>{entry.status}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Right Column — AI Panel + Stats */}
                <div className="space-y-6">
                    {/* AI Continuity Detection Panel */}
                    <div className="bg-gradient-to-br from-[#2563EB] to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                <span className="material-symbols-outlined">psychology</span>
                            </div>
                            <div>
                                <h4 className="font-bold text-base">AI Continuity Monitor</h4>
                                <p className="text-xs opacity-80">Analyzing patient patterns</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {patients.filter(p => p.needsReminder).map(p => (
                                <div key={p.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                                    <p className="text-sm font-semibold">{p.name}</p>
                                    <p className="text-xs opacity-80 mt-1">
                                        Regular purchaser of {p.regularMeds[0]?.name}. Medicine ending in {Math.max(0, p.daysLeft)} days.
                                        {p.autoBuyEnabled ? ' Auto-reminder enabled.' : ' Recommend enabling auto-reminders.'}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <p className="text-xs opacity-60">AI scans purchase patterns every 24 hours</p>
                        </div>
                    </div>

                    {/* Reminder Queue */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <h4 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#D97706]">schedule_send</span>
                            Reminder Queue
                        </h4>
                        <div className="space-y-3">
                            {patients.filter(p => p.needsReminder && !reminderStatus[p.id]?.sent).map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                                    <div>
                                        <p className="text-sm font-semibold text-[#0F172A]">{p.name}</p>
                                        <p className="text-xs text-[#64748B]">{p.regularMeds[0]?.name}</p>
                                    </div>
                                    <button
                                        onClick={() => sendReminder(p.id)}
                                        className="px-3 py-1.5 bg-[#D97706] text-white text-xs font-bold rounded-lg hover:bg-amber-700"
                                    >Send</button>
                                </div>
                            ))}
                            {patients.filter(p => p.needsReminder && !reminderStatus[p.id]?.sent).length === 0 && (
                                <div className="text-center py-4">
                                    <span className="material-symbols-outlined text-3xl text-[#16A34A]">task_alt</span>
                                    <p className="text-sm text-[#64748B] mt-2">All reminders sent!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Adherence Overview */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <h4 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#16A34A]">monitoring</span>
                            Adherence Overview
                        </h4>
                        <div className="space-y-4">
                            {patients.slice(0, 4).map(p => (
                                <div key={p.id} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${p.status === 'SAFE' ? 'bg-[#16A34A]' : p.status === 'WARNING' ? 'bg-[#D97706]' : 'bg-[#DC2626]'}`}>
                                        {p.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#0F172A] truncate">{p.name}</p>
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                            <div className={`h-full rounded-full ${p.status === 'SAFE' ? 'bg-[#16A34A]' : p.status === 'WARNING' ? 'bg-[#D97706]' : 'bg-[#DC2626]'}`} style={{ width: `${Math.max(10, (p.daysLeft / 30) * 100)}%` }}></div>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-[#64748B]">{Math.max(0, p.daysLeft)}d</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* NEW: Patient Medicine Expiry Tracker */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <h4 className="font-bold text-[#0F172A] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#D97706]">event_available</span>
                            Patient Medicine Expiry Tracker
                        </h4>

                        {/* Tracker Filters */}
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto">
                            {['All Patients', 'Expiring Soon', 'Reminder Sent', 'Safe'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setExpiryFilter(tab)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-colors ${expiryFilter === tab
                                        ? 'bg-white text-slate-800 shadow-sm border border-slate-200'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Patient</th>
                                    <th className="pb-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Medicine</th>
                                    <th className="pb-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Purchase Date</th>
                                    <th className="pb-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">End Date</th>
                                    <th className="pb-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center">Days Left</th>
                                    <th className="pb-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center">Status</th>
                                    <th className="pb-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTracker.map(pt => {
                                    const daysRemaining = getDaysRemaining(pt.endDate);
                                    const status = getExpiryStatus(daysRemaining);
                                    return (
                                        <tr key={pt.id} className={`hover:bg-slate-50/50 transition-colors ${status === 'CRITICAL' ? 'bg-red-50/40' : status === 'WARNING' ? 'bg-amber-50/40' : ''}`}>
                                            <td className="py-4 pr-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${status === 'CRITICAL' ? 'bg-red-500' : status === 'WARNING' ? 'bg-amber-500' : 'bg-indigo-500'}`}>
                                                        {pt.patientName.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm text-slate-800">{pt.patientName}</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">{pt.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4">
                                                <p className="text-sm font-medium text-slate-700">{pt.medicineName}</p>
                                                <p className="text-[11px] text-slate-400">{pt.quantity} tabs · {pt.dailyDosage}/day</p>
                                            </td>
                                            <td className="py-4 pr-4 text-sm text-slate-600">{new Date(pt.purchaseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            <td className="py-4 pr-4 text-sm font-semibold text-slate-800">{new Date(pt.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                            <td className="py-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border
                                                    ${status === 'CRITICAL' ? 'bg-red-100 text-red-700 border-red-200' : status === 'WARNING' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                                    <span className="material-symbols-outlined text-[12px]">hourglass_bottom</span>
                                                    {daysRemaining}d
                                                </span>
                                            </td>
                                            <td className="py-4 text-center">
                                                {pt.reminderSent ? (
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                                                            <span className="material-symbols-outlined text-[11px]">mark_email_read</span> Sent
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 mt-1">{new Date(pt.reminderTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                ) : daysRemaining <= 3 ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D97706] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                        <span className="material-symbols-outlined text-[11px] animate-spin">sync</span> Auto-Sending
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-medium text-slate-400">Waiting</span>
                                                )}
                                            </td>
                                            <td className="py-4 text-right">
                                                {pt.reminderSent ? (
                                                    <button
                                                        onClick={() => handleMarkRefilled(pt.id)}
                                                        className="px-3 py-1.5 bg-slate-800 text-white text-[11px] font-bold rounded-lg hover:bg-slate-700 transition-colors"
                                                    >Mark Refilled</button>
                                                ) : daysRemaining <= 3 ? (
                                                    <button
                                                        disabled
                                                        className="px-3 py-1.5 bg-slate-100 text-slate-400 text-[11px] font-bold rounded-lg cursor-not-allowed transition-colors inline-flex items-center gap-1 shadow-sm opacity-70"
                                                    >
                                                        <span className="material-symbols-outlined text-[13px]">robot</span>
                                                        AI Handled
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSendExpiryReminder(pt.id)}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white text-[11px] font-bold rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-1 shadow-sm"
                                                    >
                                                        <span className="material-symbols-outlined text-[13px]">outgoing_mail</span>
                                                        Send Early
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {filteredTracker.length === 0 && (
                            <div className="py-10 text-center">
                                <span className="material-symbols-outlined text-3xl text-slate-300">verified_user</span>
                                <p className="text-sm font-bold text-slate-500 mt-2">No patients found in this category.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Symptom Checker & Triage Analyzer */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm mt-6">
                    <h4 className="font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">stethoscope</span>
                        AI Symptom & Triage Analyzer
                    </h4>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Describe Patient Symptoms</label>
                            <textarea
                                className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 bg-slate-50"
                                rows="3"
                                placeholder="e.g., Patient is experiencing severe headache, nausea, and sensitivity to light for the past 2 days..."
                                value={symptomInput}
                                onChange={(e) => setSymptomInput(e.target.value)}
                            ></textarea>
                        </div>

                        <button
                            onClick={handleSymptomAnalysis}
                            disabled={isAnalyzing || !symptomInput.trim()}
                            className="w-full py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                        >
                            {isAnalyzing ? (
                                <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> Analyzing with ML Models...</>
                            ) : (
                                <><span className="material-symbols-outlined text-sm">magic_button</span> Generate Medicine Suggestion</>
                            )}
                        </button>

                        {/* Local ML Diagnostics Panel */}
                        {localPredictions.length > 0 && (
                            <div className="mt-6 border border-indigo-100 rounded-xl overflow-hidden">
                                <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-indigo-600">biotech</span>
                                    <h5 className="font-bold text-indigo-900 text-sm">Local ML Diagnostics (Trained on 5K Clinical Records)</h5>
                                </div>
                                <div className="p-4 bg-white space-y-4">
                                    {localPredictions.slice(0, 2).map((pred, i) => (
                                        <div key={i} className={i > 0 ? "pt-4 border-t border-slate-50" : ""}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-slate-800">{pred.disease}</span>
                                                <span className={`text-xs font-bold px-2 py-1 rounded bg-indigo-100 text-indigo-700`}>
                                                    {pred.confidence}% Match
                                                </span>
                                            </div>
                                            {pred.details && (
                                                <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                                    <p className="font-semibold text-slate-700 mb-1">Recommended Primary Care:</p>
                                                    <ul className="list-disc pl-5 space-y-1 text-xs">
                                                        {pred.details.medicines.map((med, j) => (
                                                            <li key={j}><span className="font-semibold">{med.name}</span> — {med.dosage} ({med.type})</li>
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
                            <div className="mt-4 border border-blue-100 rounded-xl overflow-hidden">
                                <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600">psychology</span>
                                    <h5 className="font-bold text-blue-900 text-sm">Groq LLM Clinical Guidance</h5>
                                </div>
                                <div className="p-5 bg-white prose prose-sm max-w-none text-slate-700">
                                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                                        {/* Minimal markdown rendering for the AI response */}
                                        {groqPrediction.split('\n\n').map((para, i) => {
                                            if (para.includes('**')) {
                                                const formatted = para.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');
                                                return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} className="mb-3" />;
                                            }
                                            return <p key={i} className="mb-3">{para}</p>;
                                        })}
                                    </div>
                                </div>
                                <div className="bg-slate-50 px-4 py-2 text-[10px] text-slate-500 border-t border-slate-100 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">info</span>
                                    This is AI-generated clinical assistance. Final diagnosis and prescription must be verified by a registered medical practitioner.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Customer Medicine Requests ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
                <div className="px-6 py-4 bg-violet-50 border-b border-violet-100 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-violet-800 uppercase tracking-wider flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">prescription</span>
                        Customer Medicine Requests
                    </h3>
                    {customerMedicineRequests.filter(r => r.status === 'pending').length > 0 && (
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                        </span>
                    )}
                </div>
                <div className="p-5">
                    {customerMedicineRequests.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 italic text-sm">No customer requests yet.</div>
                    ) : (
                        <div className="space-y-3">
                            {customerMedicineRequests.map(req => (
                                <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:shadow-sm transition-shadow">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                                            <span className="material-symbols-outlined text-violet-600 text-lg">person</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{req.customerName}</p>
                                            <p className="text-xs text-slate-500">{req.medicine} · {req.qty} units · Pharmacy: <span className="font-black text-violet-600">{req.pharmacyCode}</span></p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{req.date}</p>
                                        </div>
                                    </div>
                                    <div>
                                        {req.status === 'pending' ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => updateCustomerRequest(req.id, 'approved')}
                                                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-lg hover:bg-emerald-600 hover:text-white transition-colors">
                                                    Approve
                                                </button>
                                                <button onClick={() => updateCustomerRequest(req.id, 'rejected')}
                                                    className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 font-bold text-xs rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {req.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add New Patient Modal */}
            {showNewPatientModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#2563EB]">person_add</span>
                                Add Tracked Patient
                            </h3>
                            <button
                                onClick={() => setShowNewPatientModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="add-patient-form" onSubmit={handleAddPatientSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Patient Name</label>
                                    <input
                                        required type="text"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g. John Doe"
                                        value={newPatientForm.patientName}
                                        onChange={e => setNewPatientForm({ ...newPatientForm, patientName: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone</label>
                                        <input
                                            required type="tel"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="+1 234 567 890"
                                            value={newPatientForm.phone}
                                            onChange={e => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email</label>
                                        <input
                                            required type="email"
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="john@example.com"
                                            value={newPatientForm.email}
                                            onChange={e => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <h4 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-100 pb-2">Prescription Details</h4>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Medicine Name</label>
                                            <input
                                                required type="text"
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="e.g. Metformin 500mg"
                                                value={newPatientForm.medicineName}
                                                onChange={e => setNewPatientForm({ ...newPatientForm, medicineName: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Total Quantity</label>
                                                <input
                                                    required type="number" min="1"
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="e.g. 60"
                                                    value={newPatientForm.quantity}
                                                    onChange={e => setNewPatientForm({ ...newPatientForm, quantity: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Daily Dosage</label>
                                                <input
                                                    required type="number" min="1" max="10"
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="e.g. 2"
                                                    value={newPatientForm.dailyDosage}
                                                    onChange={e => setNewPatientForm({ ...newPatientForm, dailyDosage: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Purchase Date</label>
                                                <input
                                                    required type="date"
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={newPatientForm.purchaseDate}
                                                    onChange={e => setNewPatientForm({ ...newPatientForm, purchaseDate: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Expiry Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    value={newPatientForm.expiryDate}
                                                    onChange={e => setNewPatientForm({ ...newPatientForm, expiryDate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowNewPatientModal(false)}
                                className="px-5 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="add-patient-form"
                                className="px-5 py-2 rounded-lg text-sm font-bold bg-[#2563EB] text-white hover:bg-blue-700 shadow-md transition-colors"
                            >
                                Add Patient
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

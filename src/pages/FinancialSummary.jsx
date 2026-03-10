import React, { useState } from 'react';
import { financialData } from '../data/mockData';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function FinancialSummary() {
    const fd = financialData;
    const spentPct = Math.round((fd.spent / fd.monthlyBudget) * 100);
    const riskPct = Math.round((fd.expiryRiskAmount / fd.monthlyBudget) * 100);
    const remainPct = 100 - spentPct - riskPct;
    const [chartView, setChartView] = useState('Monthly');

    // ---------- CHART DATA ----------

    // 1. Budget Doughnut
    const budgetDoughnutData = {
        labels: ['Spent', 'Expiry Risk', 'Remaining'],
        datasets: [{
            data: [fd.spent, fd.expiryRiskAmount, fd.remaining],
            backgroundColor: ['#6366f1', '#EA580C', '#e2e8f0'],
            borderColor: ['#6366f1', '#EA580C', '#e2e8f0'],
            borderWidth: 0,
            cutout: '75%',
            borderRadius: 6,
        }],
    };
    const budgetDoughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.label}: ₹${ctx.raw.toLocaleString('en-IN')}`,
                },
            },
        },
    };

    // 2. Waste Reduction Bar Chart (monthly)
    const monthlyWasteData = {
        labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
        datasets: [
            {
                label: 'Current Waste (₹)',
                data: [42000, 38000, 31000, 26500, 18000, 12400],
                backgroundColor: 'rgba(234, 88, 12, 0.8)',
                borderRadius: 6,
                borderSkipped: false,
                barPercentage: 0.5,
                categoryPercentage: 0.7,
            },
            {
                label: 'Optimized Target (₹)',
                data: [42000, 30000, 22000, 16000, 10000, 5000],
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderRadius: 6,
                borderSkipped: false,
                barPercentage: 0.5,
                categoryPercentage: 0.7,
            },
        ],
    };
    const quarterlyWasteData = {
        labels: ['Q1 (Oct-Dec)', 'Q2 (Jan-Mar)'],
        datasets: [
            {
                label: 'Current Waste (₹)',
                data: [111000, 56900],
                backgroundColor: 'rgba(234, 88, 12, 0.8)',
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.4,
                categoryPercentage: 0.6,
            },
            {
                label: 'Optimized Target (₹)',
                data: [94000, 31000],
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.4,
                categoryPercentage: 0.6,
            },
        ],
    };
    const wasteBarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { usePointStyle: true, pointStyle: 'circle', padding: 20, font: { size: 11, family: 'Inter' } },
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`,
                },
            },
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11, family: 'Inter', weight: 600 } } },
            y: {
                grid: { color: '#f1f5f9' },
                ticks: {
                    font: { size: 10, family: 'Inter' },
                    callback: (v) => `₹${(v / 1000).toFixed(0)}k`,
                },
            },
        },
    };

    // 3. Income vs Expense Trend Line Chart
    const incomeTrendData = {
        labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
        datasets: [
            {
                label: 'Procurement Spend (₹)',
                data: [380000, 410000, 365000, 420000, 395000, 292500],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7,
            },
            {
                label: 'Waste/Loss (₹)',
                data: [42000, 38000, 31000, 26500, 18000, 12400],
                borderColor: '#EA580C',
                backgroundColor: 'rgba(234, 88, 12, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#EA580C',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7,
            },
            {
                label: 'AI Savings (₹)',
                data: [8000, 14000, 21000, 28000, 33500, 38200],
                borderColor: '#16A34A',
                backgroundColor: 'rgba(22, 163, 74, 0.08)',
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#16A34A',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 7,
            },
        ],
    };
    const incomeTrendOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { usePointStyle: true, pointStyle: 'circle', padding: 20, font: { size: 11, family: 'Inter' } },
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN')}`,
                },
            },
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11, family: 'Inter', weight: 600 } } },
            y: {
                grid: { color: '#f1f5f9' },
                ticks: {
                    font: { size: 10, family: 'Inter' },
                    callback: (v) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}k`,
                },
            },
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
    };

    // 4. Loss by Category Doughnut
    const lossCategoryData = {
        labels: ['Overstocking', 'Expired Inventory', 'Damaged Stock', 'Near Expiry'],
        datasets: [{
            data: [42500, 18200, 12400, 8140],
            backgroundColor: ['#6366f1', '#EA580C', '#DC2626', '#D97706'],
            borderWidth: 0,
            cutout: '65%',
            borderRadius: 4,
        }],
    };
    const lossCategoryOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { usePointStyle: true, pointStyle: 'circle', padding: 12, font: { size: 10, family: 'Inter' } },
            },
            tooltip: {
                callbacks: {
                    label: (ctx) => `${ctx.label}: ₹${ctx.raw.toLocaleString('en-IN')}`,
                },
            },
        },
    };

    return (
        <>
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Financial Summary</h2>
                    <p className="text-slate-500 text-sm">Real-time inventory valuation and optimization metrics</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 relative text-slate-600">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-expiry rounded-full ring-2 ring-white"></span>
                    </button>
                    <div className="flex items-center gap-3 bg-white p-1 pr-4 rounded-full border border-slate-200">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">AP</div>
                        <span className="text-sm font-medium">Apollo Pharmacy #402</span>
                    </div>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-500 font-medium text-sm uppercase tracking-wider">Monthly Budget</span>
                        <span className="material-symbols-outlined text-slate-400">account_balance_wallet</span>
                    </div>
                    <h3 className="text-3xl font-bold">₹{fd.monthlyBudget.toLocaleString('en-IN')}</h3>
                    <span className="text-slate-400 text-sm">Allocated for {fd.cycle}</span>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-500 font-medium text-sm uppercase tracking-wider">Wasted Inventory</span>
                        <span className="material-symbols-outlined text-expiry">warning</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-expiry">₹{fd.wastedInventory.toLocaleString('en-IN')}</h3>
                        <span className="text-expiry text-sm font-medium">↓ 12.5%</span>
                    </div>
                    <div className="mt-2 text-slate-400 text-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">info</span> Loss due to expiration
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-500 font-medium text-sm uppercase tracking-wider">Savings (AI)</span>
                        <span className="material-symbols-outlined text-emerald-600">auto_awesome</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-3xl font-bold text-emerald-600">₹{fd.aiSavings.toLocaleString('en-IN')}</h3>
                        <span className="text-emerald-600 text-sm font-medium">↑ 18.2%</span>
                    </div>
                    <div className="mt-2 text-slate-400 text-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">trending_up</span> Optimized via reordering
                    </div>
                </div>
            </div>

            {/* Budget Breakdown with Doughnut */}
            <section className="mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold mb-6">Budget Utilization Breakdown</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                        <div className="h-52 flex items-center justify-center">
                            <Doughnut data={budgetDoughnutData} options={budgetDoughnutOptions} />
                        </div>
                        <div className="lg:col-span-2">
                            <div className="w-full h-10 bg-slate-100 rounded-full flex overflow-hidden mb-6">
                                <div className="h-full bg-primary rounded-l-full transition-all" style={{ width: `${spentPct}%` }}></div>
                                <div className="h-full bg-orange-400 transition-all" style={{ width: `${riskPct}%` }}></div>
                                <div className="h-full bg-slate-200 rounded-r-full transition-all" style={{ width: `${remainPct}%` }}></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    <div>
                                        <p className="text-sm font-bold">Spent: ₹{fd.spent.toLocaleString('en-IN')}</p>
                                        <p className="text-xs text-slate-500">{spentPct}% of total budget</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                                    <div>
                                        <p className="text-sm font-bold">Expiry Risk: ₹{fd.expiryRiskAmount.toLocaleString('en-IN')}</p>
                                        <p className="text-xs text-slate-500">{riskPct}% at high risk</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                                    <div>
                                        <p className="text-sm font-bold">Remaining: ₹{fd.remaining.toLocaleString('en-IN')}</p>
                                        <p className="text-xs text-slate-500">{remainPct}% available for orders</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Income vs Waste Trend Line Chart */}
            <section className="mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold">Spend & Waste Trend (6 Months)</h3>
                            <p className="text-sm text-slate-500">Procurement spend vs waste vs AI savings over last 6 months</p>
                        </div>
                    </div>
                    <div className="h-80">
                        <Line data={incomeTrendData} options={incomeTrendOptions} />
                    </div>
                </div>
            </section>

            {/* Middle Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Top Loss-Causing Drugs + Doughnut */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">Top Loss-Causing Drugs</h3>
                        <button className="text-primary text-xs font-bold hover:underline">View All</button>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            {fd.topLossDrugs.slice(0, 5).map((drug, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-slate-400 w-5">{String(idx + 1).padStart(2, '0')}</span>
                                        <div>
                                            <p className="text-sm font-bold">{drug.name}</p>
                                            <p className="text-[10px] text-slate-500">{drug.reason}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-expiry">₹{drug.loss.toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                        </div>
                        <div className="h-48 flex items-center justify-center">
                            <Doughnut data={lossCategoryData} options={lossCategoryOptions} />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-500">Total Loss Leakage</p>
                        <p className="text-lg font-black text-slate-900">₹{fd.topLossDrugs.reduce((s, d) => s + d.loss, 0).toLocaleString('en-IN')}</p>
                    </div>
                </div>

                {/* AI Recommendations */}
                <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-info flex items-center justify-center text-white">
                            <span className="material-symbols-outlined">psychology</span>
                        </div>
                        <h3 className="text-lg font-bold text-blue-900">AI Recommendations</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-blue-100">
                            <div className="flex gap-3">
                                <span className="material-symbols-outlined text-info text-lg">reorder</span>
                                <div>
                                    <p className="text-sm font-bold mb-1">Reorder Optimization</p>
                                    <p className="text-xs text-slate-600">Reduce 'Glibenclamide' stock by 40%. Current demand patterns suggest a surplus for the next 3 months.</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-blue-100">
                            <div className="flex gap-3">
                                <span className="material-symbols-outlined text-emerald-600 text-lg">savings</span>
                                <div>
                                    <p className="text-sm font-bold mb-1">Cost-Saving Tip</p>
                                    <p className="text-xs text-slate-600">Switching to 'Supplier B' for seasonal antibiotics could save ₹18,000 this quarter based on historical bulk pricing.</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-blue-100">
                            <div className="flex gap-3">
                                <span className="material-symbols-outlined text-expiry text-lg">event_repeat</span>
                                <div>
                                    <p className="text-sm font-bold mb-1">Liquidation Alert</p>
                                    <p className="text-xs text-slate-600">Initiate 'First-Expiring-First-Out' (FEFO) strategy for Tier-2 cardiovascular drugs to avoid ₹5k loss.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="w-full mt-6 py-2.5 bg-info text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
                        Generate Action Report
                    </button>
                </div>
            </div>

            {/* Waste Reduction Projection Bar Chart */}
            <section>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold">Waste Reduction Projection</h3>
                            <p className="text-sm text-slate-500">Projected savings over the next 6 months with AI implementation</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setChartView('Quarterly')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${chartView === 'Quarterly' ? 'bg-primary text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                            >Quarterly</button>
                            <button
                                onClick={() => setChartView('Monthly')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${chartView === 'Monthly' ? 'bg-primary text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
                            >Monthly</button>
                        </div>
                    </div>
                    <div className="h-72">
                        <Bar
                            data={chartView === 'Monthly' ? monthlyWasteData : quarterlyWasteData}
                            options={wasteBarOptions}
                        />
                    </div>
                </div>
            </section>
        </>
    );
}

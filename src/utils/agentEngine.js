// ============================================================
// Agent Engine — The Core Brain
// Continuously monitors, detects risks, drafts POs, suggests
// transfers, and generates tiered alerts automatically.
// ============================================================

import { drugInventory, vendorCatalog, otSchedule, admissionForecast, substitutionMap } from '../data/mockData';
import { getInventorySnapshot, daysUntil, computeExpiryRisk, getTotalQuantity, computeStockStatus } from './inventoryEngine';
import { getOTDemand, getAdmissionDemand, computeDemandSpikes } from './demandEngine';
import { getBestVendor, scoreVendor, getVendorsForDrug } from './procurementEngine';
import { getSlowMovers } from './slowMovementEngine';

// ============================================================
// 1. STOCK MONITORING — Flag items below reorder threshold
// ============================================================
export function monitorStockLevels() {
    const snapshot = getInventorySnapshot();
    const flagged = [];
    snapshot.forEach(drug => {
        if (drug.stockStatus === 'CRITICAL' || drug.stockStatus === 'WARNING') {
            flagged.push({
                drugId: drug.id,
                drugName: drug.name,
                currentStock: drug.totalQuantity,
                reorderLevel: drug.reorderLevel,
                deficit: Math.max(0, drug.reorderLevel - drug.totalQuantity),
                status: drug.stockStatus,
                department: drug.department,
                severity: drug.stockStatus === 'CRITICAL' ? 'critical' : 'warning',
            });
        }
    });
    return flagged;
}

// ============================================================
// 2. EXPIRY RISK REPORT — Items expiring within 30 days, qty > 10
// ============================================================
export function generateExpiryRiskReport() {
    const snapshot = getInventorySnapshot();
    const report = [];
    let totalFinancialImpact = 0;

    snapshot.forEach(drug => {
        drug.batches.forEach(batch => {
            if (batch.daysToExpiry <= 30 && batch.daysToExpiry > 0 && batch.quantity > 10) {
                const impact = batch.quantity * drug.unitCost;
                totalFinancialImpact += impact;
                report.push({
                    drugId: drug.id,
                    drugName: drug.name,
                    batchId: batch.batchId,
                    quantity: batch.quantity,
                    daysToExpiry: batch.daysToExpiry,
                    expiryDate: batch.expiryDate,
                    unitCost: drug.unitCost,
                    financialImpact: impact,
                    riskLevel: batch.daysToExpiry <= 7 ? 'CRITICAL' : batch.daysToExpiry <= 14 ? 'HIGH' : 'MEDIUM',
                    department: drug.department,
                    suggestion: batch.daysToExpiry <= 7
                        ? 'IMMEDIATE: Post to Donation Board or transfer to high-usage ward'
                        : batch.daysToExpiry <= 14
                            ? 'URGENT: Initiate inter-department transfer or FEFO dispensing'
                            : 'MONITOR: Accelerate FEFO dispensing, consider community redistribution',
                });
            }
        });
    });

    return {
        reportDate: new Date().toISOString(),
        totalItemsAtRisk: report.length,
        totalFinancialImpact,
        potentialSavings: Math.round(totalFinancialImpact * 0.65),
        items: report.sort((a, b) => a.daysToExpiry - b.daysToExpiry),
    };
}

// ============================================================
// 3. DEMAND SPIKE ANTICIPATION — Cross-reference OT + Admissions
// ============================================================
export function anticipateDemandSpikes() {
    const otDemand = getOTDemand();
    const admDemand = getAdmissionDemand();
    const snapshot = getInventorySnapshot();
    const spikes = [];

    // Combine demands
    const combined = {};
    Object.entries(otDemand).forEach(([id, qty]) => { combined[id] = (combined[id] || 0) + qty; });
    Object.entries(admDemand).forEach(([id, count]) => { combined[id] = (combined[id] || 0) + count * 5; }); // assume ~5 units per patient

    // Find drugs where demand could exceed available surplus
    Object.entries(combined).forEach(([drugId, projectedDemand]) => {
        const drug = snapshot.find(d => d.id === drugId);
        if (!drug) return;
        const surplus = drug.totalQuantity - drug.reorderLevel;
        const coverageDays = drug.totalQuantity > 0 ? Math.floor(drug.totalQuantity / (projectedDemand / 3)) : 0;

        if (projectedDemand >= drug.totalQuantity * 0.3 || surplus < projectedDemand) {
            spikes.push({
                drugId,
                drugName: drug.name,
                currentStock: drug.totalQuantity,
                projectedDemand48h: projectedDemand,
                surplus,
                coverageDays,
                sources: {
                    otSchedule: otDemand[drugId] || 0,
                    admissions: admDemand[drugId] || 0,
                },
                riskLevel: coverageDays <= 1 ? 'CRITICAL' : coverageDays <= 3 ? 'HIGH' : 'MEDIUM',
                recommendation: coverageDays <= 1
                    ? 'IMMEDIATE REORDER: Stock insufficient for next 24 hours'
                    : coverageDays <= 3
                        ? 'AUTO-PO RECOMMENDED: Stock may not last 3 days'
                        : 'MONITOR: Demand spike detected but stock adequate for now',
            });
        }
    });

    return spikes.sort((a, b) => a.coverageDays - b.coverageDays);
}

// ============================================================
// 4. AUTONOMOUS PO DRAFTING — Low-stock + High-demand items
// ============================================================
export function draftAutonomousPOs() {
    const lowStockItems = monitorStockLevels();
    const demandSpikes = anticipateDemandSpikes();
    const snapshot = getInventorySnapshot();
    const pos = [];

    // Combine low-stock and high-demand items
    const targetDrugs = new Map();

    lowStockItems.forEach(item => {
        targetDrugs.set(item.drugId, {
            ...item,
            reason: 'LOW_STOCK',
            orderQty: Math.max(item.deficit * 2, item.reorderLevel),
        });
    });

    demandSpikes.forEach(spike => {
        if (spike.riskLevel === 'CRITICAL' || spike.riskLevel === 'HIGH') {
            const existing = targetDrugs.get(spike.drugId);
            if (existing) {
                existing.reason = 'LOW_STOCK + HIGH_DEMAND';
                existing.orderQty = Math.max(existing.orderQty, spike.projectedDemand48h * 3);
            } else {
                targetDrugs.set(spike.drugId, {
                    drugId: spike.drugId,
                    drugName: spike.drugName,
                    currentStock: spike.currentStock,
                    reason: 'HIGH_DEMAND',
                    orderQty: spike.projectedDemand48h * 3,
                });
            }
        }
    });

    // Create POs with best vendor selection
    targetDrugs.forEach((item, drugId) => {
        const bestVendor = getBestVendor(drugId);
        if (!bestVendor) return;
        const drug = snapshot.find(d => d.id === drugId);

        pos.push({
            id: `AUTO-PO-${Date.now()}-${drugId}`,
            drugId,
            drugName: item.drugName,
            vendorId: bestVendor.vendorId,
            vendorName: bestVendor.vendorName,
            vendorScore: bestVendor.score,
            vendorReliability: bestVendor.reliability,
            quantity: Math.ceil(item.orderQty),
            unitPrice: bestVendor.pricePerUnit,
            totalCost: Math.round(Math.ceil(item.orderQty) * bestVendor.pricePerUnit * 100) / 100,
            leadTimeDays: Math.ceil(bestVendor.leadTimeHours / 24),
            reason: item.reason,
            priority: item.reason === 'LOW_STOCK + HIGH_DEMAND' ? 'CRITICAL' : item.reason === 'LOW_STOCK' ? 'HIGH' : 'MEDIUM',
            status: 'Auto-Drafted',
            createdAt: new Date().toISOString(),
            autoApproved: false,
        });
    });

    return pos.sort((a, b) => {
        const priority = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
        return (priority[a.priority] || 3) - (priority[b.priority] || 3);
    });
}

// ============================================================
// 5. INTER-DEPARTMENT TRANSFER SUGGESTIONS
// ============================================================
export function suggestTransfers() {
    const snapshot = getInventorySnapshot();
    const suggestions = [];

    // Find near-expiry drugs with surplus in one department but needed in another
    const departmentUsage = {
        'General Ward': ['DRG001', 'DRG004', 'DRG017', 'DRG018', 'DRG020', 'DRG011'],
        'Surgery': ['DRG012', 'DRG013', 'DRG015', 'DRG016'],
        'Cardiology': ['DRG005', 'DRG006', 'DRG008', 'DRG014'],
        'Endocrinology': ['DRG002', 'DRG003', 'DRG010'],
        'Gastroenterology': ['DRG007', 'DRG019'],
        'Pulmonology': ['DRG009'],
    };

    snapshot.forEach(drug => {
        drug.batches.forEach(batch => {
            if (batch.daysToExpiry > 0 && batch.daysToExpiry <= 45 && batch.quantity > 10) {
                // Find departments that use this drug but aren't its home department
                const targetDepts = Object.entries(departmentUsage)
                    .filter(([dept, drugs]) => drugs.includes(drug.id) && dept !== drug.department)
                    .map(([dept]) => dept);

                if (targetDepts.length > 0) {
                    suggestions.push({
                        drugId: drug.id,
                        drugName: drug.name,
                        batchId: batch.batchId,
                        currentDepartment: drug.department,
                        targetDepartments: targetDepts,
                        bestTarget: targetDepts[0],
                        quantity: batch.quantity,
                        daysToExpiry: batch.daysToExpiry,
                        financialValue: batch.quantity * drug.unitCost,
                        reason: `Near-expiry batch in ${drug.department} can be utilized in ${targetDepts.join(', ')} before ordering externally.`,
                        priority: batch.daysToExpiry <= 14 ? 'HIGH' : 'MEDIUM',
                    });
                }
            }
        });
    });

    return suggestions.sort((a, b) => a.daysToExpiry - b.daysToExpiry);
}

// ============================================================
// 6. TIERED ALERT GENERATION — Auto-send alerts
// ============================================================
export function generateTieredAlerts() {
    const snapshot = getInventorySnapshot();
    const demandSpikes = anticipateDemandSpikes();
    const expiryReport = generateExpiryRiskReport();
    const transfers = suggestTransfers();
    const slowMovers = getSlowMovers(90);
    const generatedAlerts = [];
    const now = new Date();

    // --- CRITICAL ALERTS (Stockout imminent < 24 hrs) ---
    snapshot.forEach(drug => {
        const avgDailyUsage = Math.max(drug.reorderLevel / 7, 5);
        const daysOfStock = drug.totalQuantity / avgDailyUsage;

        if (daysOfStock < 1 && drug.totalQuantity > 0) {
            generatedAlerts.push({
                id: `CRIT-${drug.id}-${now.getTime()}`,
                type: 'CRITICAL',
                severity: 'critical',
                icon: 'warning',
                drugName: drug.name,
                title: `🚨 STOCKOUT IMMINENT: ${drug.name}`,
                message: `CRITICAL: Only ${drug.totalQuantity} units remaining. At current usage rate (${Math.round(avgDailyUsage)} units/day), stock will be depleted within ${Math.round(daysOfStock * 24)} hours. Immediate procurement action required. Auto-PO has been triggered.`,
                timestamp: now.toISOString(),
                timeAgo: 'Just now',
                recipient: 'Pharmacy Head + HOD',
                actionRequired: true,
                actionLabel: 'View Auto-PO',
                autoPOTriggered: true,
                tier: 1,
            });
        }
    });

    // --- WARNING ALERTS (Stock < 3 days) ---
    snapshot.forEach(drug => {
        const avgDailyUsage = Math.max(drug.reorderLevel / 7, 5);
        const daysOfStock = drug.totalQuantity / avgDailyUsage;

        if (daysOfStock >= 1 && daysOfStock < 3 && drug.stockStatus !== 'ADEQUATE') {
            generatedAlerts.push({
                id: `WARN-${drug.id}-${now.getTime()}`,
                type: 'WARNING',
                severity: 'warning',
                icon: 'info',
                drugName: drug.name,
                title: `⚠️ LOW STOCK WARNING: ${drug.name}`,
                message: `WARNING: ${drug.totalQuantity} units remaining (${Math.round(daysOfStock)} days of stock). Reorder threshold is ${drug.reorderLevel} units. ${drug.department} department will be affected. A purchase suggestion has been drafted.`,
                timestamp: now.toISOString(),
                timeAgo: 'Just now',
                recipient: 'Pharmacy Head',
                actionRequired: true,
                actionLabel: 'Review PO Draft',
                tier: 2,
            });
        }
    });

    // --- EXPIRY RISK ALERTS (Surplus expiring < 30 days) ---
    expiryReport.items.forEach(item => {
        generatedAlerts.push({
            id: `EXP-${item.drugId}-${item.batchId}-${now.getTime()}`,
            type: 'EXPIRY',
            severity: 'expiry',
            icon: 'calendar_today',
            drugName: item.drugName,
            title: `📅 EXPIRY RISK: ${item.drugName}`,
            message: `EXPIRY ALERT: Batch #${item.batchId} (${item.quantity} units) expires in ${item.daysToExpiry} days. Financial exposure: ₹${item.financialImpact.toLocaleString('en-IN')}. ${item.suggestion}`,
            timestamp: now.toISOString(),
            timeAgo: 'Auto-detected',
            recipient: item.riskLevel === 'CRITICAL' ? 'Pharmacy Head + HOD' : 'Pharmacist',
            actionRequired: true,
            actionLabel: item.daysToExpiry <= 14 ? 'Transfer / Donate' : 'Mark for Action',
            financialImpact: item.financialImpact,
            tier: 3,
        });
    });

    // --- DEMAND SPIKE INFO ---
    demandSpikes.filter(s => s.riskLevel === 'CRITICAL' || s.riskLevel === 'HIGH').forEach(spike => {
        generatedAlerts.push({
            id: `DEMAND-${spike.drugId}-${now.getTime()}`,
            type: 'INFO',
            severity: 'info',
            icon: 'trending_up',
            drugName: spike.drugName,
            title: `📈 DEMAND SPIKE: ${spike.drugName}`,
            message: `Demand Alert: Projected need of ${spike.projectedDemand48h} units in next 48 hours (OT: ${spike.sources.otSchedule}, Admissions: ${spike.sources.admissions} patients). Current stock: ${spike.currentStock} units. ${spike.recommendation}`,
            timestamp: now.toISOString(),
            timeAgo: 'Auto-detected',
            recipient: 'Pharmacy Head',
            actionRequired: spike.riskLevel === 'CRITICAL',
            actionLabel: 'View Demand Report',
            tier: 4,
        });
    });

    // --- TRANSFER SUGGESTIONS (as INFO) ---
    transfers.filter(t => t.priority === 'HIGH').forEach(transfer => {
        generatedAlerts.push({
            id: `TRANSFER-${transfer.drugId}-${transfer.batchId}-${now.getTime()}`,
            type: 'SUGGESTION',
            severity: 'info',
            icon: 'swap_horiz',
            drugName: transfer.drugName,
            title: `🔄 TRANSFER SUGGESTED: ${transfer.drugName}`,
            message: `Inter-department transfer recommended: Move ${transfer.quantity} units of ${transfer.drugName} (Batch #${transfer.batchId}) from ${transfer.currentDepartment} → ${transfer.bestTarget}. Expires in ${transfer.daysToExpiry} days. Value: ₹${transfer.financialValue.toLocaleString('en-IN')}.`,
            timestamp: now.toISOString(),
            timeAgo: 'Auto-detected',
            recipient: 'Pharmacy Head',
            actionRequired: false,
            actionLabel: 'Initiate Transfer',
            tier: 5,
        });
    });

    // --- SLOW MOVEMENT ALERTS ---
    slowMovers.filter(sm => !sm.actioned && sm.daysSlow > 120).forEach(sm => {
        generatedAlerts.push({
            id: `SLOW-${sm.id}-${now.getTime()}`,
            type: 'WARNING',
            severity: 'warning',
            icon: 'speed',
            drugName: sm.name,
            title: `🐢 SLOW MOVEMENT: ${sm.name}`,
            message: `Dead stock warning: ${sm.qty} units inactive for ${sm.daysSlow} days. Value at risk: ₹${sm.valueRisk.toLocaleString('en-IN')}. AI suggests a Flash Sale or Community Donation to recover value.`,
            timestamp: now.toISOString(),
            timeAgo: 'Auto-detected',
            recipient: 'Pharmacy Head',
            actionRequired: true,
            actionLabel: 'View Item',
            tier: 6,
        });
    });

    return generatedAlerts.sort((a, b) => a.tier - b.tier);
}

// ============================================================
// FULL AGENT SCAN — Run all 6 tasks and return combined report
// ============================================================
export function runFullAgentScan() {
    const stockFlags = monitorStockLevels();
    const expiryReport = generateExpiryRiskReport();
    const demandSpikes = anticipateDemandSpikes();
    const autoPOs = draftAutonomousPOs();
    const transferSuggestions = suggestTransfers();
    const tieredAlerts = generateTieredAlerts();

    return {
        timestamp: new Date().toISOString(),
        scanId: `SCAN-${Date.now()}`,
        summary: {
            stockAlertsCount: stockFlags.length,
            expiryRisksCount: expiryReport.totalItemsAtRisk,
            expiryFinancialImpact: expiryReport.totalFinancialImpact,
            demandSpikesCount: demandSpikes.length,
            autoPOsGenerated: autoPOs.length,
            transferSuggestions: transferSuggestions.length,
            slowMovementCount: getSlowMovers(90).length,
            totalAlerts: tieredAlerts.length,
            criticalAlerts: tieredAlerts.filter(a => a.type === 'CRITICAL').length,
            warningAlerts: tieredAlerts.filter(a => a.type === 'WARNING').length,
            expiryAlerts: tieredAlerts.filter(a => a.type === 'EXPIRY').length,
        },
        stockFlags,
        expiryReport,
        demandSpikes,
        autoPOs,
        transferSuggestions,
        tieredAlerts,
    };
}

// ============================================================
// Inventory Engine — FEFO, Risk Computation, Stock Status
// ============================================================
import { drugInventory } from '../data/mockData.js';

/**
 * Get days until a given date from today
 */
export function daysUntil(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

/**
 * FEFO sort — First Expired, First Out
 */
export function applyFEFO(batches) {
    return [...batches].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
}

/**
 * Total quantity across all batches
 */
export function getTotalQuantity(drug) {
    return drug.batches.reduce((sum, b) => sum + b.quantity, 0);
}

/**
 * Compute stock status: CRITICAL / WARNING / ADEQUATE
 */
export function computeStockStatus(drug) {
    const total = getTotalQuantity(drug);
    if (total <= 0) return 'CRITICAL';
    if (total < drug.reorderLevel * 0.5) return 'CRITICAL';
    if (total < drug.reorderLevel) return 'WARNING';
    return 'ADEQUATE';
}

/**
 * Compute expiry risk per batch: HIGH / MEDIUM / LOW
 */
export function computeExpiryRisk(batch) {
    const days = daysUntil(batch.expiryDate);
    if (days < 30 && batch.quantity > 10) return 'HIGH';
    if (days >= 30 && days <= 60 && batch.quantity > 20) return 'MEDIUM';
    return 'LOW';
}

/**
 * Get financial exposure for a batch
 */
export function computeFinancialExposure(batch, unitCost) {
    return batch.quantity * unitCost;
}

/**
 * Get full inventory snapshot with computed fields
 */
export function getInventorySnapshot() {
    return drugInventory.map(drug => {
        const sortedBatches = applyFEFO(drug.batches);
        const totalQty = getTotalQuantity(drug);
        const status = computeStockStatus(drug);
        const batchesWithRisk = sortedBatches.map(b => ({
            ...b,
            expiryRisk: computeExpiryRisk(b),
            daysToExpiry: daysUntil(b.expiryDate),
            financialExposure: computeFinancialExposure(b, drug.unitCost),
            isFEFO: true,
        }));
        // mark only the first batch as FEFO dispense first
        if (batchesWithRisk.length > 0) batchesWithRisk[0].dispenseFirst = true;

        return {
            ...drug,
            totalQuantity: totalQty,
            stockStatus: status,
            batches: batchesWithRisk,
            nearestExpiry: sortedBatches[0]?.expiryDate || null,
            nearestExpiryDays: sortedBatches[0] ? daysUntil(sortedBatches[0].expiryDate) : null,
        };
    });
}

/**
 * Get drugs with expiry risk (HIGH or MEDIUM)
 */
export function getExpiryRiskDrugs() {
    const snapshot = getInventorySnapshot();
    const result = [];
    snapshot.forEach(drug => {
        drug.batches.forEach(batch => {
            if (batch.expiryRisk === 'HIGH' || batch.expiryRisk === 'MEDIUM') {
                result.push({
                    ...drug,
                    riskBatch: batch,
                    expiryRisk: batch.expiryRisk,
                });
            }
        });
    });
    return result.sort((a, b) => a.riskBatch.daysToExpiry - b.riskBatch.daysToExpiry);
}

/**
 * Get critical/warning stock drugs
 */
export function getCriticalDrugs() {
    return getInventorySnapshot().filter(d => d.stockStatus === 'CRITICAL' || d.stockStatus === 'WARNING');
}

/**
 * Add a new item directly to the in-memory inventory array.
 */
export function addInventoryItem(name, expiryDate, quantity, startingDate) {
    const newId = `DRG${String(drugInventory.length + 1).padStart(3, '0')}`;
    const newDrug = {
        id: newId,
        name: name,
        category: 'Newly Added',
        reorderLevel: 50,
        unitCost: 100, // placeholder
        batches: [
            {
                batchId: `${newId.substring(3)}-001`,
                quantity: parseInt(quantity, 10),
                expiryDate: expiryDate, // "YYYY-MM-DD"
                receivedDate: startingDate || new Date().toISOString().split('T')[0]
            }
        ]
    };
    drugInventory.unshift(newDrug);
    return newDrug;
}

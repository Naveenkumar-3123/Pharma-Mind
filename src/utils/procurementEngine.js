// ============================================================
// Procurement Engine — Vendor Scoring, PO Creation, Substitution
// ============================================================
import { vendorCatalog, substitutionMap } from '../data/mockData.js';

/**
 * Score a vendor for a specific drug
 * Score = (reliability × 0.5) + ((1/price) × 0.3 × 100) + ((1/lead_time) × 0.2 × 100)
 */
export function scoreVendor(vendor, drugId) {
    const drugData = vendor.drugs[drugId];
    if (!drugData) return null;

    const reliabilityScore = vendor.reliability * 0.5;
    const priceScore = (1 / drugData.pricePerUnit) * 0.3 * 1000;
    const leadTimeScore = (1 / drugData.leadTimeHours) * 0.2 * 1000;

    return {
        vendorId: vendor.id,
        vendorName: vendor.name,
        reliability: vendor.reliability,
        pricePerUnit: drugData.pricePerUnit,
        leadTimeHours: drugData.leadTimeHours,
        score: Math.round((reliabilityScore + priceScore + leadTimeScore) * 10) / 10,
    };
}

/**
 * Get ranked vendors for a drug
 */
export function getVendorsForDrug(drugId) {
    const scored = vendorCatalog
        .map(v => scoreVendor(v, drugId))
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);
    return scored;
}

/**
 * Get the best vendor for a drug
 */
export function getBestVendor(drugId) {
    const vendors = getVendorsForDrug(drugId);
    return vendors[0] || null;
}

/**
 * Create a purchase order object
 */
export function createPurchaseOrder(drug, vendor, quantity) {
    return {
        id: `PO-${Date.now()}`,
        drugId: drug.id,
        drugName: drug.name,
        vendorId: vendor.vendorId,
        vendorName: vendor.vendorName,
        quantity,
        unitPrice: vendor.pricePerUnit,
        totalCost: Math.round(quantity * vendor.pricePerUnit * 100) / 100,
        leadTimeDays: Math.ceil(vendor.leadTimeHours / 24),
        vendorScore: vendor.score,
        status: 'Pending Approval',
        createdAt: new Date().toISOString(),
    };
}

/**
 * Get substitute for an out-of-stock drug
 */
export function getSubstitute(drugId) {
    return substitutionMap.find(s => s.originalId === drugId) || null;
}

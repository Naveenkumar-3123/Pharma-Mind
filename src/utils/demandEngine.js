// ============================================================
// Demand Engine — Admission Forecast, OT Schedule, Seasonal
// ============================================================
import { admissionForecast, otSchedule, seasonalMap } from '../data/mockData.js';

const conditionDrugMap = {
    'Diabetic': ['DRG002', 'DRG003'],
    'Cardiac': ['DRG005', 'DRG006', 'DRG014', 'DRG008'],
    'Post-op': ['DRG012', 'DRG013', 'DRG016', 'DRG017'],
    'Respiratory': ['DRG009', 'DRG017'],
    'General': ['DRG001', 'DRG007'],
};

/**
 * Get projected drug demand from admission forecast
 */
export function getAdmissionDemand() {
    const demand = {};
    admissionForecast.forEach(patient => {
        const drugs = conditionDrugMap[patient.condition] || [];
        drugs.forEach(drugId => {
            demand[drugId] = (demand[drugId] || 0) + 1;
        });
    });
    return demand;
}

/**
 * Get projected drug demand from OT schedule
 */
export function getOTDemand() {
    const demand = {};
    otSchedule.forEach(surgery => {
        surgery.drugKit.forEach(item => {
            demand[item.drugId] = (demand[item.drugId] || 0) + item.quantity;
        });
    });
    return demand;
}

/**
 * Compute total demand and identify spike drugs (>= 3)
 */
export function computeDemandSpikes() {
    const admDemand = getAdmissionDemand();
    const otDemand = getOTDemand();
    const combined = {};

    Object.keys(admDemand).forEach(id => {
        combined[id] = (combined[id] || 0) + admDemand[id];
    });
    Object.keys(otDemand).forEach(id => {
        combined[id] = (combined[id] || 0) + otDemand[id];
    });

    const spikes = {};
    Object.entries(combined).forEach(([id, count]) => {
        if (count >= 3) spikes[id] = count;
    });

    return { combined, spikes };
}

/**
 * Get current season based on date
 */
export function getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    return seasonalMap.find(s => s.months.includes(month)) || seasonalMap[0];
}

/**
 * Get seasonal drug suggestions
 */
export function getSeasonalSuggestions() {
    return getCurrentSeason();
}

import { slowMovementItems } from '../data/mockData';

// Get items exceeding the slow threshold (e.g. 90 days)
export function getSlowMovers(thresholdDays = 90) {
    return slowMovementItems.filter(item => item.daysSlow >= thresholdDays);
}

// Discount logic: 30% for >90 days, 50% for >180 days
export function calculateDiscount(daysSlow) {
    if (daysSlow >= 180) return 50;
    if (daysSlow >= 90) return 30;
    return 0;
}

// Promo code generator for Flash Sales
export function generatePromoCode(itemName) {
    const shortName = itemName.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').substring(0, 5);
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CLEAR-${shortName}-${randomStr}`;
}

// CSV Export logic
export function generateCSVExport(items) {
    const headers = ['Drug ID', 'Name', 'Batch', 'Days Slow', 'Quantity', 'Value at Risk (₹)', 'Actioned'];

    const rows = items.map(item => [
        item.drugId,
        `"${item.name}"`, // Quote to handle potential commas
        item.batch,
        item.daysSlow,
        item.qty,
        item.valueRisk,
        item.actioned ? 'Yes' : 'No'
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(r => r.join(','))
    ].join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `slow_movement_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Summary statistics
export function getSlowMovementStats(items) {
    const totalItems = items.length;
    const totalValueRisk = items.reduce((sum, item) => sum + item.valueRisk, 0);
    const actionedCount = items.filter(i => i.actioned).length;

    return {
        totalItems,
        totalValueRisk,
        actionedCount,
        actionNeeded: totalItems - actionedCount
    };
}

// Progress completion percentage
export function getProgressTracker(items) {
    if (items.length === 0) return 100;
    const actioned = items.filter(i => i.actioned).length;
    return Math.round((actioned / items.length) * 100);
}

// --- NEW logic for Charts/Graphs ---

// Aggregate value risk by category for Bar Chart
export function getRiskByCategory(items) {
    const categoryMap = items.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = 0;
        acc[item.category] += item.valueRisk;
        return acc;
    }, {});

    // Convert to array and sort descending by value
    return Object.entries(categoryMap)
        .map(([category, value]) => ({ category, value }))
        .sort((a, b) => b.value - a.value);
}

// Aggregate counts by aging bucket for Pie Chart
export function getAgingBuckets(items) {
    let bucket90_120 = 0;
    let bucket121_180 = 0;
    let bucket180_plus = 0;

    items.forEach(item => {
        if (item.daysSlow > 180) bucket180_plus++;
        else if (item.daysSlow > 120) bucket121_180++;
        else bucket90_120++; // assuming everything passed here is >= 90
    });

    return [
        { name: '90-120 days', count: bucket90_120, color: '#FCD34D' }, // amber-300
        { name: '121-180 days', count: bucket121_180, color: '#F97316' }, // orange-500
        { name: '> 180 days', count: bucket180_plus, color: '#EF4444' }    // red-500
    ];
}

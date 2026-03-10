// ============================================================
// Expiry Tracker Engine
// Calculates patient dosage dates and handles automated alerts
// ============================================================

export function calculateEndDate(purchaseDateStr, quantity, dailyDosage) {
    // Defensive check
    if (!quantity || !dailyDosage || dailyDosage <= 0) return purchaseDateStr;

    const totalDays = Math.ceil(quantity / dailyDosage);
    const purchaseDate = new Date(purchaseDateStr);

    // Calculate end date
    const endDate = new Date(purchaseDate);
    endDate.setDate(purchaseDate.getDate() + totalDays);

    return endDate.toISOString().split('T')[0];
}

export function getDaysRemaining(endDateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    const end = new Date(endDateStr);
    end.setHours(0, 0, 0, 0);

    // Diff in MS
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

export function getExpiryStatus(daysRemaining) {
    if (daysRemaining <= 3) return 'CRITICAL';
    if (daysRemaining <= 7) return 'WARNING';
    return 'SAFE';
}

// Function that sends the real POST request to the local express server
export async function triggerRealReminderAPI(patient) {
    const daysRemaining = getDaysRemaining(patient.endDate);

    try {
        const res = await fetch('http://localhost:3012/api/send-reminder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patientName: patient.patientName,
                email: patient.email,
                phone: patient.phone,
                medicineName: patient.medicineName,
                daysRemaining: daysRemaining
            })
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        return { success: true, timestamp: new Date().toLocaleString() };

    } catch (error) {
        console.error("Failed to trigger reminder endpoint:", error);
        return { success: false, timestamp: null };
    }
}

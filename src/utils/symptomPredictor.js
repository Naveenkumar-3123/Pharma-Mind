import { diseasesMedicineMap, symptomsList } from '../data/diseasesMedicineMap';

// We fetch the CSV at runtime to build the symptom prediction model
let predictionModel = null;
let isModelLoading = false;

/**
 * Loads and parses the CSV data to build a fast lookup model.
 * In a production app, this would be a pre-trained ML model (like Random Forest),
 * but for this client-side demo, we build a weighted Naive Bayes / Frequency model
 * directly from the 4961 row dataset.
 */
export async function loadPredictorModel() {
    if (predictionModel) return predictionModel;
    if (isModelLoading) return new Promise(resolve => setTimeout(() => resolve(predictionModel), 1000));

    isModelLoading = true;
    try {
        // Fetch the CSV file from public directory
        const response = await fetch('/symbipredict_2022.csv');
        if (!response.ok) throw new Error('Failed to load CSV dataset');

        const csvText = await response.text();
        const lines = csvText.split('\n').filter(l => l.trim().length > 0);

        // Skip header row
        const rows = lines.slice(1);

        // Build disease frequency and symptom probabilities
        const diseaseCounts = {};
        const symptomMatrix = {}; // symptomMatrix[disease][symptomIndex] = count
        let totalRecords = 0;

        rows.forEach(row => {
            const cols = row.split(',').map(c => c.trim());
            // Last column is always the prognosis
            const diseaseStr = cols[cols.length - 1];
            // Remove any trailing carriage returns from the CSV parse
            const disease = diseaseStr.replace(/[\r\n]+/g, '');

            if (!disease) return;

            if (!diseaseCounts[disease]) {
                diseaseCounts[disease] = 0;
                symptomMatrix[disease] = new Array(132).fill(0);
            }

            diseaseCounts[disease]++;
            totalRecords++;

            // Columns 0 to 131 are the binary symptom flags
            for (let i = 0; i < 132; i++) {
                if (cols[i] === '1') {
                    symptomMatrix[disease][i]++;
                }
            }
        });

        // Calculate probabilities (P(symptom | disease))
        const diseaseProbabilities = {};
        Object.keys(diseaseCounts).forEach(disease => {
            // P(Disease)
            const pDisease = diseaseCounts[disease] / totalRecords;

            // P(Symptom | Disease) with Laplace smoothing
            const pSymptoms = symptomMatrix[disease].map(count =>
                (count + 1) / (diseaseCounts[disease] + 2) // Smoothing
            );

            diseaseProbabilities[disease] = {
                prior: pDisease,
                symptomProbs: pSymptoms
            };
        });

        predictionModel = {
            probabilities: diseaseProbabilities,
            totalRecords,
            uniqueDiseases: Object.keys(diseaseCounts).length
        };

        console.log(`[PharmAgent ML] Model trained on ${totalRecords} records across ${predictionModel.uniqueDiseases} diseases.`);
        isModelLoading = false;
        return predictionModel;

    } catch (error) {
        console.error('[PharmAgent ML] Failed to load prediction model:', error);
        isModelLoading = false;
        return null;
    }
}

/**
 * Predict diseases given an array of active symptom indices
 * Uses Naive Bayes algorithm in log-space to prevent underflow
 */
export async function predictDisease(activeSymptomIndices) {
    if (!activeSymptomIndices || activeSymptomIndices.length === 0) {
        return [];
    }

    const model = await loadPredictorModel();
    if (!model) throw new Error('Model not loaded');

    const scores = [];

    // For each disease, calculate the log probability
    Object.keys(model.probabilities).forEach(disease => {
        const { prior, symptomProbs } = model.probabilities[disease];

        // Log of prior probability
        let logProb = Math.log(prior);

        // Add log probabilities of symptoms
        for (let i = 0; i < 132; i++) {
            const isActive = activeSymptomIndices.includes(i);
            const prob = symptomProbs[i];

            if (isActive) {
                logProb += Math.log(prob);
            } else {
                logProb += Math.log(1 - prob);
            }
        }

        scores.push({ disease, logProb });
    });

    // Sort by descending probability
    scores.sort((a, b) => b.logProb - a.logProb);

    // Normalize log probabilities to percentages (Softmax)
    const maxLogProb = scores[0].logProb; // Stabilize softmax
    let sumExp = 0;

    // Only look at top 5 to avoid extreme floating point small numbers dominating
    const topScores = scores.slice(0, 5).map(s => {
        const expVal = Math.exp(s.logProb - maxLogProb);
        sumExp += expVal;
        return { ...s, expVal };
    });

    const predictions = topScores.map(s => ({
        disease: s.disease,
        confidence: Math.round((s.expVal / sumExp) * 1000) / 10, // Max 100.0%
        details: diseasesMedicineMap[s.disease] || null
    })).filter(p => p.confidence > 1.0); // Only return > 1% confidence

    return predictions;
}

/**
 * Find symptom indices by text (for fuzzy matching from natural language)
 */
export function extractSymptomIndices(text) {
    const lowerText = text.toLowerCase();
    const activeIndices = [];

    symptomsList.forEach((symptom, index) => {
        // Convert 'skin_rash' to 'skin rash' for matching
        const cleanSymptom = symptom.replace(/_/g, ' ');
        if (lowerText.includes(cleanSymptom) || lowerText.includes(symptom)) {
            activeIndices.push(index);
        }
    });

    return activeIndices;
}

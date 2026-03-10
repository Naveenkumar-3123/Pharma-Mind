// ============================================================
// AI Service — Groq API Integration (replaced OpenRouter)
// ============================================================
import { predictDisease, extractSymptomIndices } from './symptomPredictor';

const GROQ_API_KEY = ''; // Replaced to pass GitHub Secret Verification
const GROQ_URL = '/api/groq/chat/completions';

// Groq model — fast inference with Llama 3
const MODEL = 'llama-3.3-70b-versatile';

/**
 * Call Groq API for AI suggestions
 */
export async function getAISuggestion(prompt, systemPrompt = '') {
    const defaultSystem = 'You are PharmAgent AI, an intelligent pharmacy assistant. Provide concise, helpful medical guidance. Always remind users to consult a pharmacist or doctor before taking any medicine. Format responses clearly with medicine names, dosages, and safety notes.';

    try {
        console.log('[PharmAgent AI] Calling Groq API...');

        const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt || defaultSystem,
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: 500,
                temperature: 0.7,
            }),
        });

        const data = await response.json();
        console.log('[PharmAgent AI] Response:', response.status, data);

        if (!response.ok) {
            console.warn('[PharmAgent AI] API error:', data?.error?.message || response.status);
            return getOfflineFallback(prompt);
        }

        const content = data.choices?.[0]?.message?.content;
        if (!content) {
            console.warn('[PharmAgent AI] Empty response');
            return getOfflineFallback(prompt);
        }

        return {
            success: true,
            message: content,
            model: data.model || MODEL,
        };
    } catch (error) {
        console.error('[PharmAgent AI] Fetch error:', error.message);
        return getOfflineFallback(prompt);
    }
}

/**
 * Offline fallback — provides basic responses when API is unavailable
 */
function getOfflineFallback(prompt) {
    const lower = prompt.toLowerCase().trim();

    // Detect greetings and non-symptom inputs
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon', 'how are you', 'what can you do', 'help', 'test'];
    const isGreeting = greetings.some(g => lower === g || lower.startsWith(g + ' ') || lower.startsWith(g + ',') || lower.startsWith(g + '!'));

    if (isGreeting || lower.length < 8) {
        return {
            success: true,
            message: `👋 **Hello! I'm PharmAgent AI.**\n\nI can help you with symptom-based medicine suggestions. Please describe your symptoms in detail so I can assist you.\n\n**Examples of what you can ask:**\n• "I have fever and body pain since yesterday"\n• "I'm having a headache and feeling nauseous"\n• "I have a cold and cough"\n• "My stomach is aching and I have acidity"\n• "I'm experiencing joint pain in my knees"\n\n_Please describe your specific symptoms and I'll suggest possible relief options._`,
            model: 'offline-assistant',
        };
    }

    // Symptom-based fallback
    if (lower.includes('fever') || lower.includes('temperature')) {
        return {
            success: true,
            message: `**Possible Conditions:** Common viral fever, flu, or seasonal infection.\n\n**Suggested OTC Medicines:**\n• Paracetamol 500mg — 1 tablet every 6 hours if fever persists\n• Stay hydrated with ORS or warm fluids\n\n**Safety Notes:**\n⚠️ If fever exceeds 103°F or persists beyond 3 days, consult a doctor immediately.\n⚠️ Check for allergies before taking any medication.\n\n_This is an AI-assisted suggestion. Always consult a pharmacist or doctor before taking medication._`,
            model: 'offline-fallback',
        };
    }

    if (lower.includes('headache') || lower.includes('head pain')) {
        return {
            success: true,
            message: `**Possible Conditions:** Tension headache, migraine, stress-related, or dehydration.\n\n**Suggested OTC Medicines:**\n• Paracetamol 500mg — 1 tablet, max 4 tablets/day\n• Ibuprofen 400mg — 1 tablet with food, if Paracetamol insufficient\n\n**Safety Notes:**\n⚠️ Avoid ibuprofen if you have stomach issues or are on blood thinners.\n⚠️ If headaches are frequent/severe, consult a neurologist.\n\n_Always consult a pharmacist or doctor before taking medication._`,
            model: 'offline-fallback',
        };
    }

    if (lower.includes('cold') || lower.includes('cough') || lower.includes('sneez')) {
        return {
            success: true,
            message: `**Possible Conditions:** Common cold, upper respiratory infection, or seasonal allergies.\n\n**Suggested OTC Medicines:**\n• Cetirizine 10mg — 1 tablet at bedtime for runny nose/sneezing\n• Dextromethorphan syrup — for dry cough (as directed on label)\n• Steam inhalation with warm water\n\n**Safety Notes:**\n⚠️ Avoid antihistamines if driving or operating machinery.\n⚠️ See a doctor if symptoms persist beyond 7 days or include high fever.\n\n_Always consult a pharmacist before taking medication._`,
            model: 'offline-fallback',
        };
    }

    if (lower.includes('stomach') || lower.includes('acidity') || lower.includes('gastric') || lower.includes('digestion')) {
        return {
            success: true,
            message: `**Possible Conditions:** Acid reflux, gastritis, or indigestion.\n\n**Suggested OTC Medicines:**\n• Pantoprazole 40mg — 1 tablet before breakfast\n• Antacid suspension (Gelusil/Digene) — 2 tsp after meals\n• Domperidone 10mg — for nausea (with doctor's advice)\n\n**Safety Notes:**\n⚠️ Avoid spicy, fried, and acidic foods.\n⚠️ If symptoms recur frequently, consult a gastroenterologist.\n\n_Always consult a pharmacist or doctor before taking medication._`,
            model: 'offline-fallback',
        };
    }

    if (lower.includes('pain') || lower.includes('body ache') || lower.includes('joint')) {
        return {
            success: true,
            message: `**Possible Conditions:** Muscle strain, joint inflammation, or viral body aches.\n\n**Suggested OTC Medicines:**\n• Paracetamol 500mg — 1 tablet every 6-8 hours\n• Diclofenac gel — apply topically to affected area\n• Ibuprofen 400mg — with food, for inflammation\n\n**Safety Notes:**\n⚠️ Do not take ibuprofen on an empty stomach.\n⚠️ If joint pain is persistent or swollen, consult an orthopedist.\n\n_Always consult a pharmacist or doctor before taking medication._`,
            model: 'offline-fallback',
        };
    }

    // Generic fallback
    return {
        success: true,
        message: `Based on your described symptoms, here are general recommendations:\n\n**Suggested Steps:**\n1. Monitor your symptoms for 24-48 hours\n2. Stay hydrated and get adequate rest\n3. Consider Paracetamol 500mg for fever/pain relief (1 tablet every 6 hours)\n\n**When to See a Doctor:**\n• If symptoms worsen or persist beyond 3 days\n• If you experience breathing difficulty, chest pain, or high fever\n• If you have pre-existing conditions\n\n⚠️ **Important:** This AI tool assists pharmacists and patients. Always consult a pharmacist or doctor before taking any medication. Check for allergies and drug interactions.`,
        model: 'offline-fallback',
    };
}

/**
 * Get context-aware medical diagnosis for patients (Customer Portal)
 */
export async function getMedicalDiagnosis(symptoms) {
    const raw = symptoms.trim().toLowerCase().replace(/[,!?.]+$/g, '');
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon',
        'how are you', 'how are u', 'how r u', 'what can you do', 'whats up', 'what\'s up',
        'help', 'test', 'ok', 'thanks', 'thank you', 'bye', 'sup', 'yo', 'hii', 'hiii',
        'who are you', 'who r u', 'what are you', 'what r u', 'namaste', 'hola'];
    const isGreeting = greetings.some(g => raw === g || raw.startsWith(g + ' ') || raw.startsWith(g + ',') || raw.startsWith(g + '!'));

    // Medical keywords check
    const symptomKeywords = ['pain', 'ache', 'fever', 'cold', 'cough', 'sneez', 'headache', 'nausea',
        'vomit', 'diarr', 'stomach', 'chest', 'breath', 'dizz', 'rash', 'itch', 'swell', 'bleed',
        'sore', 'throat', 'joint', 'muscle', 'tired', 'fatigue', 'weak', 'burn', 'cramp', 'infect',
        'allerg', 'inflam', 'injur', 'wound', 'fract', 'diabetes', 'pressure', 'sugar', 'acidity',
        'gas', 'bloat', 'constip', 'insomnia', 'sleep', 'anxiety', 'stress', 'depress', 'back pain',
        'tooth', 'ear', 'eye', 'nose', 'skin', 'weight', 'heart', 'bp', 'thyroid'];
    const hasSymptom = symptomKeywords.some(k => raw.includes(k));

    if (isGreeting || (!hasSymptom && raw.length < 30)) {
        return {
            success: true,
            message: `👋 **Hello! I'm PharmAgent AI.**\n\nI can help diagnose your symptoms and suggest over-the-counter medicines. Please describe what you are experiencing in detail.\n\n**Examples:**\n• "I have a fever and body pain"\n• "My stomach is aching and I have acidity"`,
            model: 'pharmagent-patient-assistant',
        };
    }

    // Local ML prediction integration
    const activeIndices = extractSymptomIndices(raw);
    let localInsight = '';

    if (activeIndices.length > 0) {
        try {
            const predictions = await predictDisease(activeIndices);
            if (predictions && predictions.length > 0) {
                const topD = predictions[0];
                localInsight = `\n[LOCAL_ML_PREDICTION]: Highest probability disease is ${topD.disease} (${topD.confidence}% confidence). Recommended meds strictly map to: ${topD.details?.medicines?.map(m => m.name).join(', ')}. Incorporate this diagnostic insight.`;
            }
        } catch (e) {
            console.error('[PharmAgent] Local ML prediction failed:', e);
        }
    }

    const systemPrompt = "You are PharmAgent AI, a medical diagnostic assistant. A patient is reporting symptoms. Please provide: 1) Possible conditions these symptoms may indicate. 2) Suggested OTC medicines with dosage. 3) Important safety notes and when they MUST see a doctor. Keep it concise, accessible, and always include a medical disclaimer.";
    const prompt = `Patient Symptoms: "${symptoms}"${localInsight}`;

    return getAISuggestion(prompt, systemPrompt);
}

/**
 * Get inventory management suggestions for pharmacy admins (Admin Portal)
 */
export async function getInventorySuggestions(query, context) {
    const raw = query.trim().toLowerCase();
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'good afternoon', 'help', 'test'];
    const isGreeting = greetings.some(g => raw === g || raw.startsWith(g + ' '));

    if (isGreeting) {
        return {
            success: true,
            message: `👋 **Hello Admin! I'm PharmAgent Inventory AI.**\n\nI can help you analyze stock levels, predict slow-moving items, suggest purchase orders, and offer strategic business advice based on your dashboard metrics. How can I assist you today?`,
            model: 'pharmagent-admin-assistant',
        };
    }

    const systemPrompt = "You are PharmAgent AI, an expert Inventory Management Suggestion Assistant for a pharmacy admin. Analyze stock levels, predict slow-moving items, suggest purchase orders, and offer strategic business advice based on the provided inventory context. Be concise, professional, and directly answer the admin's query.";
    const prompt = `Admin Query: "${query}"\n\nDashboard Context (DO NOT hallucinate active alerts if there are 0): ${context}`;

    return getAISuggestion(prompt, systemPrompt);
}

/**
 * Get medication continuity insights for a patient
 */
export async function getMedicationContinuityInsight(patientName, medication, purchaseHistory) {
    const prompt = `Analyze this patient's medication purchase pattern:

  Patient: ${patientName}
  Medication: ${medication}
  Purchase History: ${purchaseHistory}

  Provide a brief insight about their adherence pattern and recommend whether automatic refill reminders should be enabled. Keep it to 2-3 sentences.`;

    return getAISuggestion(prompt, 'You are PharmAgent AI, analyzing patient medication adherence patterns. Be concise and professional.');
}

/**
 * voiceNormalization.js — Centralized AI-to-Form Normalization Layer
 *
 * Converts raw AI-extracted values (from voice intake / Gemini)
 * into exact form state values used by PatientVitalsForm.
 *
 * All normalization goes through normalizeAndMapAIData().
 * No mapping logic should be scattered across the form component.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Lowercase, trim, strip punctuation */
function norm(v) {
    if (v == null) return '';
    return String(v).toLowerCase().trim().replace(/[.,;:!?'"]/g, '');
}

/** Parse a numeric value from AI output. Returns null if unparseable. */
function safeNum(v) {
    if (v == null) return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.\-]/g, ''));
    return Number.isFinite(n) ? n : null;
}

/** Clamp a number within [min, max]. Returns null if input is null. */
function clamp(n, min, max) {
    if (n == null) return null;
    return Math.max(min, Math.min(max, n));
}

/** Convert AI output to boolean. Returns null if ambiguous. */
function safeBool(v) {
    if (typeof v === 'boolean') return v;
    if (v == null) return null;
    const s = norm(v);
    if (['true', 'yes', 'present', 'detected', 'positive', 'confirmed', 'active', 'y', '1'].includes(s)) return true;
    if (['false', 'no', 'absent', 'none', 'negative', 'not detected', 'n', '0', 'denied', 'negative'].includes(s)) return false;
    // Phrase-based
    if (s.includes('not ') || s.includes('no ') || s.includes('denied') || s.includes('absent')) return false;
    if (s.includes('yes') || s.includes('present') || s.includes('detected') || s.includes('suspected')) return true;
    return null;
}

/**
 * Match a normalized AI value against a set of enum options.
 * Uses synonym maps first, then safe partial match.
 * Returns the exact form value or null.
 */
function matchEnum(value, synonymMap, options) {
    if (value == null) return null;
    const n = norm(value);
    if (!n) return null;

    // 1. Direct synonym match (highest priority)
    for (const [formValue, synonyms] of Object.entries(synonymMap)) {
        if (synonyms.some(syn => n === syn)) return formValue;
    }

    // 2. Exact match against option value
    if (options.includes(n)) return n;

    // 3. Safe partial matching — AI value contains option keyword
    //    Only match if the keyword is ≥ 4 chars (prevents "m" → "male" from "malevolent")
    for (const [formValue, synonyms] of Object.entries(synonymMap)) {
        for (const syn of synonyms) {
            if (syn.length >= 4 && n.includes(syn)) return formValue;
        }
    }

    return null;
}

// ─── Enum Synonym Maps ───────────────────────────────────────────────────────

const GENDER_MAP = {
    'male': ['male', 'm', 'man', 'boy', 'gentleman'],
    'female': ['female', 'f', 'woman', 'girl', 'lady'],
    'other': ['other', 'non-binary', 'nonbinary', 'nb', 'transgender', 'trans'],
};

const PREGNANCY_MAP = {
    'pregnant': ['pregnant', 'expecting', 'gravida', 'with child'],
    'not_pregnant': ['not pregnant', 'non-pregnant', 'nonpregnant', 'no pregnancy', 'negative pregnancy'],
    'unknown': ['unknown', 'unsure', 'not sure', 'undetermined'],
};

const CONSCIOUSNESS_MAP = {
    'alert': ['alert', 'awake', 'conscious', 'oriented', 'avpu a', 'gcs 15', 'fully conscious'],
    'verbal': ['verbal', 'responds to verbal', 'voice', 'avpu v', 'responds to voice', 'drowsy'],
    'pain': ['pain', 'responds to pain', 'avpu p', 'semi-conscious', 'semiconscious'],
    'unresponsive': ['unresponsive', 'unconscious', 'avpu u', 'gcs 3', 'comatose', 'coma', 'no response'],
};

const BREATHING_MAP = {
    'normal': ['normal', 'regular', 'spontaneous', 'adequate', 'unlabored'],
    'labored': ['labored', 'laboured', 'difficult', 'distressed', 'dyspnea', 'shortness of breath', 'sob', 'tachypnea', 'wheezing', 'stridor'],
    'assisted': ['assisted', 'assisted ventilation', 'ventilator', 'bag valve mask', 'bvm', 'intubated', 'mechanical ventilation'],
    'not_breathing': ['not breathing', 'apnea', 'apneic', 'apnoea', 'no breathing', 'respiratory arrest', 'absent breathing'],
};

const INJURY_MAP = {
    'none': ['none', 'no injury', 'no trauma', 'nil', 'negative'],
    'fracture': ['fracture', 'broken bone', 'broken', 'fractured'],
    'polytrauma': ['polytrauma', 'multiple injuries', 'multi-trauma', 'multiple trauma'],
    'burns': ['burns', 'burn', 'thermal', 'scald', 'chemical burn'],
    'laceration': ['laceration', 'cut', 'wound', 'slash', 'deep cut', 'open wound', 'stab'],
    'internal': ['internal', 'internal injury', 'internal bleeding', 'blunt trauma', 'blunt force'],
};

const BLEEDING_MAP = {
    'none': ['none', 'no bleeding', 'no hemorrhage', 'nil', 'absent'],
    'mild': ['mild', 'minor', 'slight', 'controlled', 'minimal', 'small amount'],
    'severe': ['severe', 'heavy', 'uncontrolled', 'massive', 'life-threatening', 'profuse', 'hemorrhage', 'arterial'],
};

const EMERGENCY_TYPE_MAP = {
    'medical': ['medical', 'illness', 'disease', 'infection', 'fever', 'stroke', 'seizure', 'diabetic', 'allergy', 'allergic', 'anaphylaxis', 'asthma', 'copd', 'overdose', 'poisoning'],
    'accident': ['accident', 'rta', 'road traffic', 'motor vehicle', 'mva', 'mvc', 'collision', 'crash', 'fall', 'pedestrian', 'hit and run', 'vehicular'],
    'cardiac': ['cardiac', 'heart', 'chest pain', 'mi', 'myocardial', 'heart attack', 'cardiac arrest', 'stemi', 'nstemi', 'arrhythmia', 'afib'],
    'fire': ['fire', 'blaze', 'conflagration', 'smoke inhalation'],
    'industrial': ['industrial', 'workplace', 'factory', 'construction', 'chemical', 'electrocution', 'machinery'],
    'other': ['other', 'unknown', 'unspecified', 'general'],
};

const TRANSPORT_PRIORITY_MAP = {
    'immediate': ['immediate', 'red', 'emergent', 'critical', 'priority 1', 'p1', 'stat', 'code 3'],
    'urgent': ['urgent', 'yellow', 'priority 2', 'p2', 'soon'],
    'delayed': ['delayed', 'green', 'priority 3', 'p3', 'stable', 'non-urgent'],
    'minor': ['minor', 'white', 'priority 4', 'p4', 'walking wounded', 'ambulatory'],
};

// ─── Numeric Range Constraints (medically valid) ─────────────────────────────

const RANGES = {
    age: { min: 0, max: 120 },
    heartRate: { min: 0, max: 300 },
    spo2: { min: 0, max: 100 },
    respiratoryRate: { min: 0, max: 60 },
    temperature: { min: 20, max: 50 }, // Celsius
    systolicBP: { min: 30, max: 300 },
    diastolicBP: { min: 20, max: 200 },
    burnsPercentage: { min: 0, max: 100 },
};

function safeVital(key, value) {
    const n = safeNum(value);
    if (n == null) return null;
    const range = RANGES[key];
    if (!range) return n;
    return clamp(n, range.min, range.max);
}

// ─── Trauma Indicator Keyword Detection ──────────────────────────────────────

function detectTraumaCheckboxes(traumaIndicators, symptoms) {
    const combined = norm(`${traumaIndicators || ''} ${symptoms || ''}`);
    if (!combined) return {};

    const result = {};

    // Head injury
    const headKeywords = ['head injury', 'head trauma', 'skull', 'concussion', 'tbi', 'cranial', 'head wound', 'head laceration'];
    if (headKeywords.some(k => combined.includes(k))) result.headInjurySuspected = true;

    // Seizure
    const seizureKeywords = ['seizure', 'convulsion', 'epilep', 'fitting', 'fits', 'tonic-clonic', 'tonic clonic'];
    if (seizureKeywords.some(k => combined.includes(k))) result.seizureActivity = true;

    // Chest pain
    const chestKeywords = ['chest pain', 'angina', 'substernal', 'thoracic pain', 'precordial'];
    if (chestKeywords.some(k => combined.includes(k))) result.chestPainPresent = true;

    // CPR
    const cprKeywords = ['cpr', 'cardiopulmonary', 'chest compressions', 'resuscitation'];
    if (cprKeywords.some(k => combined.includes(k))) result.cprPerformed = true;

    // Spinal
    const spinalKeywords = ['spinal', 'spine', 'cervical', 'vertebral', 'c-spine', 'neck injury', 'paralysis', 'paraplegia'];
    if (spinalKeywords.some(k => combined.includes(k))) result.spinalImmobilization = true;

    return result;
}

// ─── Pre-Hospital Care Detection ─────────────────────────────────────────────

function detectPreHospitalCare(data) {
    const combined = norm(`${data.symptoms || ''} ${data.traumaIndicators || ''} ${data.locationDescription || ''}`);
    const result = {};

    if (combined.includes('oxygen') || combined.includes('o2 administered') || combined.includes('nasal cannula')) {
        result.oxygenAdministered = true;
    }
    if (combined.includes('iv') || combined.includes('intravenous') || combined.includes('saline') || combined.includes('normal saline')) {
        result.ivFluidsStarted = true;
    }

    return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT: normalizeAndMapAIData
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normalize and map AI-extracted data to form-compatible values.
 *
 * @param {Object} extractedData - Raw AI output
 * @returns {Object} Normalized object with only valid, form-ready key-value pairs.
 *                   Keys not present in AI output are omitted (caller should only
 *                   apply keys that exist in the returned object).
 */
export function normalizeAndMapAIData(extractedData) {
    if (!extractedData || typeof extractedData !== 'object') return {};

    const mapped = {};
    const isDev = typeof window !== 'undefined' && (window.location?.hostname === 'localhost');

    function log(field, aiValue, result, reason) {
        if (isDev) {
            console.log(`[VoiceNorm] ${field}: "${aiValue}" → ${JSON.stringify(result)} (${reason})`);
        }
    }

    // ── Patient Name (string) ────────────────────────────────────────────────
    if (extractedData.patientName != null && String(extractedData.patientName).trim()) {
        mapped.patientName = String(extractedData.patientName).trim().slice(0, 200);
        log('patientName', extractedData.patientName, mapped.patientName, 'string');
    }

    // ── Age (numeric) ────────────────────────────────────────────────────────
    const ageVal = safeVital('age', extractedData.age);
    if (ageVal != null) {
        mapped.age = String(Math.round(ageVal));
        log('age', extractedData.age, mapped.age, 'numeric');
    }

    // ── Gender (enum) ────────────────────────────────────────────────────────
    const genderVal = matchEnum(extractedData.gender, GENDER_MAP, ['male', 'female', 'other']);
    if (genderVal) {
        mapped.gender = genderVal;
        log('gender', extractedData.gender, mapped.gender, 'enum');
    }

    // ── Pregnancy Status (enum) ──────────────────────────────────────────────
    if (extractedData.pregnancyStatus != null) {
        const pregVal = matchEnum(extractedData.pregnancyStatus, PREGNANCY_MAP, ['pregnant', 'not_pregnant', 'unknown']);
        if (pregVal) {
            mapped.pregnancyStatus = pregVal;
            log('pregnancyStatus', extractedData.pregnancyStatus, mapped.pregnancyStatus, 'enum');
        }
    }

    // ── Blood Pressure (compound: systolic/diastolic) ────────────────────────
    const sys = safeVital('systolicBP', extractedData.systolicBP);
    const dia = safeVital('diastolicBP', extractedData.diastolicBP);
    if (sys != null && dia != null) {
        mapped.bloodPressure = `${Math.round(sys)}/${Math.round(dia)}`;
        log('bloodPressure', `${extractedData.systolicBP}/${extractedData.diastolicBP}`, mapped.bloodPressure, 'compound');
    } else if (extractedData.bloodPressure != null) {
        // AI might return "120/80" as a single string
        const bpMatch = String(extractedData.bloodPressure).match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
        if (bpMatch) {
            const s = clamp(parseInt(bpMatch[1], 10), 30, 300);
            const d = clamp(parseInt(bpMatch[2], 10), 20, 200);
            mapped.bloodPressure = `${s}/${d}`;
            log('bloodPressure', extractedData.bloodPressure, mapped.bloodPressure, 'string-parsed');
        }
    }

    // ── Heart Rate (numeric) ─────────────────────────────────────────────────
    const hrVal = safeVital('heartRate', extractedData.heartRate);
    if (hrVal != null) {
        mapped.heartRate = String(Math.round(hrVal));
        log('heartRate', extractedData.heartRate, mapped.heartRate, 'numeric');
    }

    // ── SpO2 (numeric) ───────────────────────────────────────────────────────
    const spo2Val = safeVital('spo2', extractedData.spo2);
    if (spo2Val != null) {
        mapped.spo2 = String(Math.round(spo2Val));
        log('spo2', extractedData.spo2, mapped.spo2, 'numeric');
    }

    // ── Respiratory Rate (numeric) ───────────────────────────────────────────
    const rrVal = safeVital('respiratoryRate', extractedData.respiratoryRate);
    if (rrVal != null) {
        mapped.respiratoryRate = String(Math.round(rrVal));
        log('respiratoryRate', extractedData.respiratoryRate, mapped.respiratoryRate, 'numeric');
    }

    // ── Temperature (numeric) ────────────────────────────────────────────────
    let tempVal = safeNum(extractedData.temperature);
    if (tempVal != null) {
        // Auto-detect Fahrenheit if > 50 (no human is 50°C+)
        if (tempVal > 50 && tempVal <= 122) {
            tempVal = (tempVal - 32) * 5 / 9; // Convert F→C
            mapped._temperatureConverted = true;
        }
        tempVal = clamp(tempVal, 20, 50);
        if (tempVal != null) {
            mapped.temperature = String(Math.round(tempVal * 10) / 10);
            log('temperature', extractedData.temperature, mapped.temperature, mapped._temperatureConverted ? 'F→C converted' : 'numeric');
        }
    }

    // ── Consciousness Level (enum) ───────────────────────────────────────────
    const consVal = matchEnum(extractedData.consciousnessLevel, CONSCIOUSNESS_MAP, ['alert', 'verbal', 'pain', 'unresponsive']);
    if (consVal) {
        mapped.consciousnessLevel = consVal;
        log('consciousnessLevel', extractedData.consciousnessLevel, mapped.consciousnessLevel, 'enum');
    }

    // ── Breathing Status (enum) ──────────────────────────────────────────────
    if (extractedData.breathingStatus != null) {
        const breathVal = matchEnum(extractedData.breathingStatus, BREATHING_MAP, ['normal', 'labored', 'assisted', 'not_breathing']);
        if (breathVal) {
            mapped.breathingStatus = breathVal;
            log('breathingStatus', extractedData.breathingStatus, mapped.breathingStatus, 'enum');
        }
    }

    // ── Injury Type (enum) ───────────────────────────────────────────────────
    if (extractedData.injuryType != null) {
        const injVal = matchEnum(extractedData.injuryType, INJURY_MAP, ['none', 'fracture', 'polytrauma', 'burns', 'laceration', 'internal']);
        if (injVal) {
            mapped.injuryType = injVal;
            log('injuryType', extractedData.injuryType, mapped.injuryType, 'enum');
        }
    }

    // ── Bleeding Severity (enum) ─────────────────────────────────────────────
    if (extractedData.bleedingSeverity != null) {
        const bleedVal = matchEnum(extractedData.bleedingSeverity, BLEEDING_MAP, ['none', 'mild', 'severe']);
        if (bleedVal) {
            mapped.bleedingSeverity = bleedVal;
            log('bleedingSeverity', extractedData.bleedingSeverity, mapped.bleedingSeverity, 'enum');
        }
    }

    // ── Burns Percentage (slider 0-100) ──────────────────────────────────────
    if (extractedData.burnsPercentage != null) {
        const burnsVal = safeVital('burnsPercentage', extractedData.burnsPercentage);
        if (burnsVal != null) {
            mapped.burnsPercentage = Math.round(burnsVal);
            log('burnsPercentage', extractedData.burnsPercentage, mapped.burnsPercentage, 'slider');
        }
    }

    // ── Emergency Type (enum) ────────────────────────────────────────────────
    if (extractedData.emergencyType != null) {
        const emVal = matchEnum(extractedData.emergencyType, EMERGENCY_TYPE_MAP, ['medical', 'accident', 'cardiac', 'fire', 'industrial', 'other']);
        if (emVal) {
            mapped.emergencyType = emVal;
            log('emergencyType', extractedData.emergencyType, mapped.emergencyType, 'enum');
        }
    }

    // ── Transport Priority (enum) ────────────────────────────────────────────
    if (extractedData.transportPriority != null) {
        const tpVal = matchEnum(extractedData.transportPriority, TRANSPORT_PRIORITY_MAP, ['immediate', 'urgent', 'delayed', 'minor']);
        if (tpVal) {
            mapped.transportPriority = tpVal;
            log('transportPriority', extractedData.transportPriority, mapped.transportPriority, 'enum');
        }
    }

    // ── Boolean Checkboxes ───────────────────────────────────────────────────
    const boolFields = [
        'headInjurySuspected', 'seizureActivity',
        'chestPainPresent', 'cardiacHistoryKnown',
        'oxygenAdministered', 'cprPerformed', 'ivFluidsStarted',
        'ventilatorRequired', 'oxygenRequired', 'defibrillatorRequired',
        'spinalImmobilization', 'suspectedInfectious', 'isolationRequired',
    ];
    for (const field of boolFields) {
        if (extractedData[field] != null) {
            const bVal = safeBool(extractedData[field]);
            if (bVal != null) {
                mapped[field] = bVal;
                log(field, extractedData[field], mapped[field], 'boolean');
            }
        }
    }

    // ── Keyword-Based Checkbox Detection (from symptoms / traumaIndicators) ──
    const traumaDetected = detectTraumaCheckboxes(extractedData.traumaIndicators, extractedData.symptoms);
    for (const [key, val] of Object.entries(traumaDetected)) {
        if (val === true && mapped[key] == null) {
            mapped[key] = true;
            log(key, 'keyword-detected', true, 'trauma-keywords');
        }
    }

    // ── Pre-Hospital Care Detection ─────────────────────────────────────────
    const careDetected = detectPreHospitalCare(extractedData);
    for (const [key, val] of Object.entries(careDetected)) {
        if (val === true && mapped[key] == null) {
            mapped[key] = true;
            log(key, 'keyword-detected', true, 'care-keywords');
        }
    }

    // ── Text fields: symptoms, trauma indicators, location → paramedic notes
    const noteParts = [];
    if (extractedData.symptoms && String(extractedData.symptoms).trim()) {
        noteParts.push(String(extractedData.symptoms).trim());
    }
    if (extractedData.traumaIndicators && String(extractedData.traumaIndicators).trim()) {
        noteParts.push(String(extractedData.traumaIndicators).trim());
    }
    if (noteParts.length > 0) {
        mapped.paramedicNotes = noteParts.join(' | ').slice(0, 2000);
    }

    if (extractedData.locationDescription && String(extractedData.locationDescription).trim()) {
        mapped.environmentalRisks = String(extractedData.locationDescription).trim().slice(0, 500);
    }

    // Remove internal flags
    delete mapped._temperatureConverted;

    if (isDev) {
        console.log('[VoiceNorm] Final mapped object:', mapped);
    }

    return mapped;
}

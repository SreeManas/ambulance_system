/**
 * Hospital Capability Scoring Engine v2.0
 * 
 * AI-powered decision intelligence for ambulance triage and smart hospital routing.
 * Features: Emergency-specific profiles, golden hour modifier, disqualification 
 * safeguards, equipment penalties, and tie-breaker logic.
 * 
 * Design: Explainable, modular, and ML-upgrade ready.
 */

// =============================================================================
// WEIGHT CONFIGURATION (Acuity-Based)
// =============================================================================

const WEIGHT_PROFILES = {
    critical: {  // acuity >= 4
        capability: 0.60, distance: 0.15, beds: 0.10,
        specialists: 0.10, equipment: 0.03, load: 0.02
    },
    moderate: {  // acuity 3
        capability: 0.40, distance: 0.25, beds: 0.15,
        specialists: 0.10, equipment: 0.05, load: 0.05
    },
    minor: {     // acuity <= 2
        capability: 0.25, distance: 0.50, beds: 0.10,
        specialists: 0.05, equipment: 0.05, load: 0.05
    }
};

// =============================================================================
// EMERGENCY-SPECIFIC SCORING PROFILES
// =============================================================================

const EMERGENCY_PROFILES = {
    cardiac: {
        caseAcceptance: 'acceptsCardiac',
        specialists: ['cardiologist'],
        specialistWeights: { cardiologist: 1.5 },  // Higher weight
        capabilities: ['strokeCenter', 'emergencySurgery'],
        capabilityScores: { strokeCenter: 20, emergencySurgery: 15 },
        equipment: ['defibrillator'],
        equipmentScores: { defibrillator: { present: 25, absent: -40 } },
        bedTypes: ['icu', 'emergency'],
        criticalBeds: ['icu'],  // Must have for critical cases
        traumaLevelBonus: false
    },
    trauma: {
        caseAcceptance: 'acceptsTrauma',
        specialists: ['traumaSurgeon', 'radiologist'],
        specialistWeights: { traumaSurgeon: 2.0, radiologist: 1.0 },
        capabilities: ['emergencySurgery', 'ctScanAvailable'],
        capabilityScores: { emergencySurgery: 25, ctScanAvailable: 15 },
        equipment: ['ventilator', 'portableXRay'],
        equipmentScores: {
            ventilator: { present: 20, absent: -30 },
            portableXRay: { present: 10, absent: -10 }
        },
        bedTypes: ['traumaBeds', 'icu', 'emergency'],
        criticalBeds: ['traumaBeds', 'icu'],
        traumaLevelBonus: true,
        traumaLevelScores: { level_1: 30, level_2: 18, level_3: 8, none: 0 }
    },
    burn: {
        caseAcceptance: 'acceptsBurns',
        specialists: ['burnSpecialist'],
        specialistWeights: { burnSpecialist: 2.5 },
        capabilities: ['emergencySurgery'],
        capabilityScores: { emergencySurgery: 20 },
        equipment: ['ventilator'],
        equipmentScores: { ventilator: { present: 20, absent: -35 } },
        bedTypes: ['icu', 'isolationBeds', 'emergency'],
        criticalBeds: ['isolationBeds'],
        traumaLevelBonus: false
    },
    medical: {
        caseAcceptance: 'acceptsCardiac',
        specialists: ['pulmonologist', 'cardiologist'],
        specialistWeights: { pulmonologist: 1.2, cardiologist: 1.0 },
        capabilities: ['ctScanAvailable', 'mriAvailable'],
        capabilityScores: { ctScanAvailable: 15, mriAvailable: 10 },
        equipment: ['ventilator'],
        equipmentScores: { ventilator: { present: 15, absent: -20 } },
        bedTypes: ['icu', 'emergency'],
        criticalBeds: ['icu'],
        traumaLevelBonus: false
    },
    accident: {
        caseAcceptance: 'acceptsTrauma',
        specialists: ['traumaSurgeon', 'radiologist'],
        specialistWeights: { traumaSurgeon: 1.8, radiologist: 1.0 },
        capabilities: ['emergencySurgery', 'ctScanAvailable'],
        capabilityScores: { emergencySurgery: 22, ctScanAvailable: 12 },
        equipment: ['portableXRay', 'ventilator'],
        equipmentScores: {
            portableXRay: { present: 12, absent: -15 },
            ventilator: { present: 15, absent: -25 }
        },
        bedTypes: ['traumaBeds', 'emergency'],
        criticalBeds: ['traumaBeds'],
        traumaLevelBonus: true,
        traumaLevelScores: { level_1: 25, level_2: 15, level_3: 6, none: 0 }
    },
    fire: {
        caseAcceptance: 'acceptsBurns',
        specialists: ['burnSpecialist', 'pulmonologist'],
        specialistWeights: { burnSpecialist: 2.0, pulmonologist: 1.5 },
        capabilities: ['emergencySurgery'],
        capabilityScores: { emergencySurgery: 20 },
        equipment: ['ventilator'],
        equipmentScores: { ventilator: { present: 25, absent: -40 } },
        bedTypes: ['icu', 'isolationBeds'],
        criticalBeds: ['icu'],
        traumaLevelBonus: false
    },
    infectious: {
        caseAcceptance: 'acceptsInfectious',
        specialists: ['pulmonologist'],
        specialistWeights: { pulmonologist: 1.5 },
        capabilities: [],
        capabilityScores: {},
        equipment: ['ventilator'],
        equipmentScores: { ventilator: { present: 20, absent: -30 } },
        bedTypes: ['isolationBeds', 'icu'],
        criticalBeds: ['isolationBeds'],
        requiresIsolation: true,
        traumaLevelBonus: false
    },
    other: {
        caseAcceptance: 'acceptsTrauma',
        specialists: [],
        specialistWeights: {},
        capabilities: [],
        capabilityScores: {},
        equipment: [],
        equipmentScores: {},
        bedTypes: ['emergency'],
        criticalBeds: [],
        traumaLevelBonus: false
    }
};

// Map legacy types to profiles
const EMERGENCY_TYPE_ALIAS = {
    industrial: 'trauma',
    cardiac: 'cardiac',
    stroke: 'cardiac'
};

// =============================================================================
// CORE UTILITY FUNCTIONS
// =============================================================================

function toRad(deg) {
    return deg * (Math.PI / 180);
}

export function calculateDistanceKm(coord1, coord2) {
    if (!coord1 || !coord2) return Infinity;

    const lat1 = coord1.latitude || coord1._latitude || 0;
    const lon1 = coord1.longitude || coord1._longitude || 0;
    const lat2 = coord2.latitude || coord2._latitude || 0;
    const lon2 = coord2.longitude || coord2._longitude || 0;

    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function estimateETA(distanceKm) {
    return Math.round((distanceKm / 40) * 60);  // 40 km/h average
}

function calculateDistanceScore(distanceKm) {
    if (distanceKm <= 0) return 100;
    if (distanceKm >= 50) return 0;
    return Math.max(0, Math.round(100 - (distanceKm * 2)));
}

// =============================================================================
// GOLDEN HOUR MODIFIER
// =============================================================================

function calculateGoldenHourModifier(emergencyCase) {
    const incidentTimestamp = emergencyCase.emergencyContext?.incidentTimestamp ||
        emergencyCase.incidentTimestamp;

    if (!incidentTimestamp) return { modifier: 0, inGoldenHour: false };

    let timestamp;
    if (incidentTimestamp._seconds) {
        timestamp = incidentTimestamp._seconds * 1000;
    } else if (incidentTimestamp.toMillis) {
        timestamp = incidentTimestamp.toMillis();
    } else {
        timestamp = new Date(incidentTimestamp).getTime();
    }

    const minutesSinceIncident = (Date.now() - timestamp) / (1000 * 60);

    if (minutesSinceIncident <= 60) {
        // Within golden hour: boost distance weight by 10%
        return {
            modifier: 0.10,
            inGoldenHour: true,
            minutesRemaining: Math.round(60 - minutesSinceIncident)
        };
    }

    return { modifier: 0, inGoldenHour: false };
}

// =============================================================================
// PRE-SCORING DISQUALIFICATION FILTERS
// =============================================================================

function checkDisqualification(hospital, emergencyCase, profile) {
    const reasons = [];

    // 1. Case acceptance mismatch
    if (!hospital.caseAcceptance?.[profile.caseAcceptance]) {
        reasons.push(`Does not accept ${emergencyCase.emergencyContext?.emergencyType || 'this'} cases`);
    }

    // 2. Hospital FULL
    if (hospital.emergencyReadiness?.status === 'full') {
        reasons.push('Hospital is FULL');
    }

    // 3. Isolation required but no isolation beds
    if (emergencyCase.infectionRisk?.isolationRequired || profile.requiresIsolation) {
        const isolationBeds = hospital.bedAvailability?.isolationBeds?.available || 0;
        if (isolationBeds === 0) {
            reasons.push('No isolation beds available (required)');
        }
    }

    // 4. Critical case but no ICU beds
    const acuity = emergencyCase.acuityLevel;
    if (acuity >= 4 && profile.criticalBeds?.includes('icu')) {
        const icuBeds = hospital.bedAvailability?.icu?.available || 0;
        if (icuBeds === 0) {
            reasons.push('No ICU beds for critical case');
        }
    }

    // 5. No beds at all
    const totalAvailable = hospital.bedAvailability?.available || 0;
    const emergencyBeds = hospital.bedAvailability?.emergency?.available || 0;
    if (totalAvailable === 0 && emergencyBeds === 0) {
        reasons.push('No beds available');
    }

    return {
        disqualified: reasons.length > 0,
        reasons
    };
}

// =============================================================================
// SCORING FUNCTIONS
// =============================================================================

function calculateCapabilityScore(hospital, emergencyCase, profile) {
    let score = 0;
    const reasons = [];

    // Base case acceptance (already checked in disqualification)
    score += 30;
    reasons.push(`Accepts ${emergencyCase.emergencyContext?.emergencyType || 'emergency'} cases`);

    // Trauma level bonus
    if (profile.traumaLevelBonus && hospital.basicInfo?.traumaLevel) {
        const traumaScores = profile.traumaLevelScores ||
            { level_1: 25, level_2: 15, level_3: 8, none: 0 };
        const tScore = traumaScores[hospital.basicInfo.traumaLevel] || 0;
        score += tScore;
        if (tScore > 0) {
            reasons.push(`${hospital.basicInfo.traumaLevel.replace('_', ' ').toUpperCase()} trauma center`);
        }
    }

    // Clinical capabilities with profile-specific scores
    Object.entries(profile.capabilityScores || {}).forEach(([cap, points]) => {
        if (hospital.clinicalCapabilities?.[cap]) {
            score += points;
            reasons.push(`Has ${formatCapability(cap)}`);
        }
    });

    // 24/7 surgery availability for surgical emergencies
    if (hospital.serviceAvailability?.surgery24x7) {
        score += 10;
        reasons.push('24/7 surgery available');
    }

    return { score: Math.min(100, score), reasons };
}

function calculateSpecialistScore(hospital, profile) {
    const specialists = profile.specialists || [];
    const weights = profile.specialistWeights || {};

    if (specialists.length === 0) return { score: 50, reasons: [], count: 0 };

    let weightedCount = 0;
    let rawCount = 0;
    const reasons = [];

    specialists.forEach(spec => {
        const count = hospital.specialists?.[spec] || 0;
        const weight = weights[spec] || 1.0;
        weightedCount += count * weight;
        rawCount += count;

        if (count > 0) {
            reasons.push(`${count} ${formatSpecialist(spec)}${count > 1 ? 's' : ''}`);
        }
    });

    // Score: 0 = 0, 5+ weighted = 100
    const score = Math.min(100, Math.round((weightedCount / 5) * 100));
    return { score, reasons, count: rawCount };
}

function calculateEquipmentScore(hospital, emergencyCase, profile) {
    const supportRequired = emergencyCase.supportRequired || {};
    const equipmentScores = profile.equipmentScores || {};

    let score = 50;  // Base score
    const reasons = [];

    // Check patient-specific requirements with penalties
    if (supportRequired.ventilator) {
        const available = hospital.equipment?.ventilators?.available || 0;
        if (available > 0) {
            score += 20;
            reasons.push(`Ventilator available (${available})`);
        } else {
            score -= 40;  // Heavy penalty
            reasons.push('⚠️ Ventilator required but unavailable');
        }
    }

    if (supportRequired.defibrillator) {
        const available = hospital.equipment?.defibrillators || 0;
        if (available > 0) {
            score += 25;
            reasons.push('Defibrillator available');
        } else {
            score -= 40;
            reasons.push('⚠️ Defibrillator required but unavailable');
        }
    }

    if (supportRequired.oxygen) {
        score += 5;
        reasons.push('Oxygen support available');
    }

    // Emergency-type equipment bonuses/penalties
    Object.entries(equipmentScores).forEach(([eq, scores]) => {
        let available = false;

        if (eq === 'ventilator') available = (hospital.equipment?.ventilators?.available || 0) > 0;
        else if (eq === 'defibrillator') available = (hospital.equipment?.defibrillators || 0) > 0;
        else if (eq === 'portableXRay') available = (hospital.equipment?.portableXRay || 0) > 0;
        else if (eq === 'dialysis') available = (hospital.equipment?.dialysisMachines || 0) > 0;

        if (available) {
            score += scores.present || 0;
        } else {
            score += scores.absent || 0;
        }
    });

    return { score: Math.max(0, Math.min(100, score)), reasons };
}

function calculateBedScore(hospital, emergencyCase, profile) {
    const bedTypes = profile.bedTypes || ['emergency'];
    let availableBeds = 0;
    const reasons = [];

    // Get bed counts by type
    const bedCounts = {
        icu: hospital.bedAvailability?.icu?.available || 0,
        emergency: hospital.bedAvailability?.emergency?.available || 0,
        traumaBeds: hospital.bedAvailability?.traumaBeds?.available || 0,
        isolationBeds: hospital.bedAvailability?.isolationBeds?.available || 0,
        pediatricBeds: hospital.bedAvailability?.pediatricBeds?.available || 0
    };

    bedTypes.forEach(bedType => {
        const count = bedCounts[bedType] || 0;
        if (count > 0) {
            availableBeds += count;
            reasons.push(`${count} ${formatBedType(bedType)}`);
        }
    });

    // Fallback to general availability
    if (availableBeds === 0) {
        availableBeds = hospital.bedAvailability?.available || 0;
        if (availableBeds > 0) {
            reasons.push(`${availableBeds} general beds`);
        }
    }

    if (availableBeds === 0) {
        return { score: 0, reasons: ['No beds available'], icuCount: bedCounts.icu };
    }

    // Score curve
    let score;
    if (availableBeds >= 10) score = Math.min(100, 80 + (availableBeds - 10) * 2);
    else if (availableBeds >= 5) score = 60 + (availableBeds - 5) * 4;
    else score = 20 + availableBeds * 8;

    return {
        score: Math.round(score),
        reasons,
        icuCount: bedCounts.icu,
        totalAvailable: availableBeds
    };
}

function calculateLoadScore(hospital) {
    let score = 100;
    const reasons = [];

    if (hospital.emergencyReadiness?.diversionStatus ||
        hospital.emergencyReadiness?.status === 'diverting') {
        score -= 50;  // Heavy penalty
        reasons.push('Currently on diversion');
    }

    const queue = hospital.emergencyReadiness?.ambulanceQueue || 0;
    if (queue > 0) {
        score -= Math.min(30, queue * 6);
        reasons.push(`${queue} ambulance${queue > 1 ? 's' : ''} in queue`);
    }

    if (!hospital.serviceAvailability?.emergency24x7) {
        score -= 15;
        reasons.push('Emergency not 24/7');
    }

    return {
        score: Math.max(0, score),
        reasons: reasons.length > 0 ? reasons : ['Low operational load'],
        penalty: 100 - Math.max(0, score)
    };
}

function calculateFreshnessPenalty(hospital) {
    const capacityLastUpdated = hospital.capacityLastUpdated;
    if (!capacityLastUpdated) return { multiplier: 0.8, reason: 'Capacity data not updated' };

    let timestamp;
    if (capacityLastUpdated._seconds) timestamp = capacityLastUpdated._seconds * 1000;
    else if (capacityLastUpdated.toMillis) timestamp = capacityLastUpdated.toMillis();
    else timestamp = new Date(capacityLastUpdated).getTime();

    const hours = (Date.now() - timestamp) / (1000 * 60 * 60);

    if (hours > 48) return { multiplier: 0.70, reason: 'Data very stale (48+ hrs)' };
    if (hours > 24) return { multiplier: 0.85, reason: 'Data stale (24+ hrs)' };
    if (hours > 12) return { multiplier: 0.95, reason: 'Data aging (12+ hrs)' };
    return { multiplier: 1.0, reason: null };
}

function getWeightProfile(acuityLevel, goldenHourModifier = 0) {
    let base;
    if (acuityLevel === null || acuityLevel === undefined) base = { ...WEIGHT_PROFILES.moderate };
    else if (acuityLevel >= 4) base = { ...WEIGHT_PROFILES.critical };
    else if (acuityLevel <= 2) base = { ...WEIGHT_PROFILES.minor };
    else base = { ...WEIGHT_PROFILES.moderate };

    // Apply golden hour modifier to distance weight
    if (goldenHourModifier > 0) {
        base.distance += goldenHourModifier;
        base.capability -= goldenHourModifier / 2;
        base.beds -= goldenHourModifier / 2;
    }

    return base;
}

// =============================================================================
// TIE-BREAKER LOGIC
// =============================================================================

function applyTieBreakers(hospitals) {
    return hospitals.sort((a, b) => {
        // Primary: Suitability score
        if (b.suitabilityScore !== a.suitabilityScore) {
            return b.suitabilityScore - a.suitabilityScore;
        }

        // Tie-breaker 1: Shortest distance
        if (a.distanceKm !== b.distanceKm) {
            return a.distanceKm - b.distanceKm;
        }

        // Tie-breaker 2: Highest ICU availability
        const aICU = a.scoreBreakdown?.icuCount || 0;
        const bICU = b.scoreBreakdown?.icuCount || 0;
        if (bICU !== aICU) {
            return bICU - aICU;
        }

        // Tie-breaker 3: Highest specialist count
        const aSpec = a.scoreBreakdown?.specialistCount || 0;
        const bSpec = b.scoreBreakdown?.specialistCount || 0;
        return bSpec - aSpec;
    });
}

// =============================================================================
// MAIN SCORING ENGINE
// =============================================================================

export function scoreHospital(hospital, emergencyCase) {
    const emergencyType = emergencyCase.emergencyContext?.emergencyType || 'other';
    const mappedType = EMERGENCY_TYPE_ALIAS[emergencyType] || emergencyType;
    const profile = EMERGENCY_PROFILES[mappedType] || EMERGENCY_PROFILES.other;

    // Pre-scoring disqualification check
    const disqualCheck = checkDisqualification(hospital, emergencyCase, profile);

    // Calculate distance
    const pickupLocation = emergencyCase.pickupLocation;
    const hospitalLocation = hospital.basicInfo?.location;
    const distanceKm = calculateDistanceKm(pickupLocation, hospitalLocation);
    const etaMinutes = estimateETA(distanceKm);

    if (disqualCheck.disqualified) {
        return {
            hospitalId: hospital.id,
            hospitalName: hospital.basicInfo?.name || 'Unknown',
            suitabilityScore: 0,
            distanceKm: Math.round(distanceKm * 10) / 10,
            etaMinutes,
            disqualified: true,
            disqualifyReasons: disqualCheck.reasons,
            scoreBreakdown: {},
            recommendationReasons: []
        };
    }

    // Golden hour modifier
    const goldenHour = calculateGoldenHourModifier(emergencyCase);
    const weights = getWeightProfile(emergencyCase.acuityLevel, goldenHour.modifier);

    // Calculate all scores
    const capabilityResult = calculateCapabilityScore(hospital, emergencyCase, profile);
    const specialistResult = calculateSpecialistScore(hospital, profile);
    const equipmentResult = calculateEquipmentScore(hospital, emergencyCase, profile);
    const bedResult = calculateBedScore(hospital, emergencyCase, profile);
    const loadResult = calculateLoadScore(hospital);
    const distanceScore = calculateDistanceScore(distanceKm);
    const freshnessResult = calculateFreshnessPenalty(hospital);

    // Weighted score calculation
    const weightedScore =
        (capabilityResult.score * weights.capability) +
        (specialistResult.score * weights.specialists) +
        (equipmentResult.score * weights.equipment) +
        (bedResult.score * weights.beds) +
        (loadResult.score * weights.load) +
        (distanceScore * weights.distance);

    const finalScore = Math.round(weightedScore * freshnessResult.multiplier);

    // Build recommendation reasons
    const recommendationReasons = [
        ...capabilityResult.reasons.slice(0, 2),
        ...specialistResult.reasons.slice(0, 1),
        ...bedResult.reasons.slice(0, 2)
    ].filter(r => r);

    if (distanceKm <= 5) recommendationReasons.push(`Very close (${Math.round(distanceKm * 10) / 10} km)`);
    else if (distanceKm <= 15) recommendationReasons.push(`Nearby (${Math.round(distanceKm)} km)`);

    if (goldenHour.inGoldenHour) {
        recommendationReasons.push(`⏱️ Golden hour: ${goldenHour.minutesRemaining}min remaining`);
    }

    if (freshnessResult.reason) recommendationReasons.push(freshnessResult.reason);

    return {
        hospitalId: hospital.id,
        hospitalName: hospital.basicInfo?.name || 'Unknown',
        hospitalType: hospital.basicInfo?.hospitalType,
        traumaLevel: hospital.basicInfo?.traumaLevel,
        address: hospital.basicInfo?.address,
        phone: hospital.basicInfo?.phone,
        suitabilityScore: finalScore,
        distanceKm: Math.round(distanceKm * 10) / 10,
        etaMinutes,
        disqualified: false,
        scoreBreakdown: {
            capability: capabilityResult.score,
            specialists: specialistResult.score,
            equipment: equipmentResult.score,
            beds: bedResult.score,
            loadPenalty: loadResult.penalty,
            distanceScore,
            freshnessMultiplier: freshnessResult.multiplier,
            icuCount: bedResult.icuCount,
            specialistCount: specialistResult.count
        },
        weights,
        goldenHour,
        recommendationReasons
    };
}

export function rankHospitals(hospitals, emergencyCase) {
    if (!hospitals?.length) return [];

    const scored = hospitals.map(h => scoreHospital(h, emergencyCase));
    const qualified = scored.filter(h => !h.disqualified);
    const disqualified = scored.filter(h => h.disqualified);

    // Apply tie-breakers to qualified hospitals
    const ranked = applyTieBreakers(qualified);

    return [...ranked, ...disqualified];
}

export function getTopRecommendations(hospitals, emergencyCase, topN = 3) {
    return rankHospitals(hospitals, emergencyCase)
        .filter(h => !h.disqualified)
        .slice(0, topN);
}

export function getBestMatch(hospitals, emergencyCase) {
    const top = getTopRecommendations(hospitals, emergencyCase, 1);
    return top.length > 0 ? top[0] : null;
}

// =============================================================================
// FORMATTERS
// =============================================================================

function formatCapability(cap) {
    const map = {
        strokeCenter: 'Stroke Center', emergencySurgery: 'Emergency Surgery',
        ctScanAvailable: 'CT Scan', mriAvailable: 'MRI', radiology24x7: '24/7 Radiology'
    };
    return map[cap] || cap;
}

function formatSpecialist(spec) {
    const map = {
        cardiologist: 'cardiologist', neurologist: 'neurologist',
        traumaSurgeon: 'trauma surgeon', radiologist: 'radiologist',
        pulmonologist: 'pulmonologist', burnSpecialist: 'burn specialist'
    };
    return map[spec] || spec;
}

function formatBedType(bedType) {
    const map = {
        icu: 'ICU beds', emergency: 'ER beds', traumaBeds: 'trauma beds',
        isolationBeds: 'isolation beds', pediatricBeds: 'pediatric beds'
    };
    return map[bedType] || bedType;
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
    scoreHospital,
    rankHospitals,
    getTopRecommendations,
    getBestMatch,
    calculateDistanceKm,
    estimateETA,
    WEIGHT_PROFILES,
    EMERGENCY_PROFILES
};

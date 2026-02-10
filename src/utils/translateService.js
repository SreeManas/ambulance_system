// src/utils/translateService.js
// Enhanced Translation Service — Phases 7 + 10 + 12
// Features: Google Translate API, localStorage caching, batch translation,
//           medical terminology protection, preload engine

const API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_KEY;

// ─── Phase 12: Medical Terminology Protection Layer ──────
// These terms must NEVER be translated — they are universal medical standards
const MEDICAL_LOCK_TERMS = [
  "ICU", "NICU", "PICU", "CCU", "HDU",
  "EMS", "EMT", "EMR",
  "MRI", "CT", "ECG", "EKG", "EEG",
  "ICD-10", "CPT", "DRG",
  "CPR", "AED", "BLS", "ACLS", "PALS",
  "GCS", "AVPU", "APGAR",
  "SpO2", "BP", "HR", "BPM", "RR",
  "IV", "IO", "IM", "SC",
  "Ventilator", "Defibrillator", "Intubation",
  "Triage", "STEMI", "NSTEMI",
  "TPA", "FFP", "RBC", "WBC",
  "ABG", "CBC", "BMP", "CMP",
  "DNR", "DNAR",
  "WHO", "CDC",
  "GPS", "HIPAA"
];

// Check if text is a protected medical term (exact match or contained)
function shouldSkipTranslation(text) {
  if (!text) return false;
  const trimmed = text.trim();
  // Exact match check
  if (MEDICAL_LOCK_TERMS.includes(trimmed)) return true;
  // Also skip if the entire text is a single medical abbreviation
  if (trimmed.length <= 6 && MEDICAL_LOCK_TERMS.includes(trimmed.toUpperCase())) return true;
  return false;
}

// ─── Translation Cache (localStorage-backed, 7-day expiry) ──────

function getCachedTranslation(text, targetLang) {
  const cacheKey = `${targetLang}:${text}`;
  const cached = localStorage.getItem(`translation_${cacheKey}`);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      const isExpired = Date.now() - parsed.timestamp > 7 * 24 * 60 * 60 * 1000;
      if (!isExpired) {
        return parsed.translation;
      } else {
        localStorage.removeItem(`translation_${cacheKey}`);
      }
    } catch (e) {
      localStorage.removeItem(`translation_${cacheKey}`);
    }
  }
  return null;
}

function cacheTranslation(text, targetLang, translatedText) {
  const cacheKey = `${targetLang}:${text}`;
  try {
    localStorage.setItem(`translation_${cacheKey}`, JSON.stringify({
      translation: translatedText,
      timestamp: Date.now()
    }));
  } catch (e) {
    // localStorage full — clear oldest translation entries
    clearExpiredTranslationCache();
  }
}

// ─── Single Text Translation ────────────────────────────

export async function translateText(text, targetLang) {
  if (!text || !targetLang || targetLang === 'en') return text;

  // Phase 12: Skip medical terms
  if (shouldSkipTranslation(text)) return text;

  // Check cache first
  const cached = getCachedTranslation(text, targetLang);
  if (cached) return cached;

  if (!API_KEY) {
    console.warn('Google Translate API key not found. Set VITE_GOOGLE_TRANSLATE_KEY in .env.local');
    return text;
  }

  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, target: targetLang, format: 'text' })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const translatedText = data?.data?.translations?.[0]?.translatedText || text;

    if (translatedText !== text) {
      cacheTranslation(text, targetLang, translatedText);
    }

    return translatedText;
  } catch (e) {
    console.warn("Translation failed:", e.message);
    return text;
  }
}

// ─── Batch Translation (reduces API calls) ──────────────

export async function translateTexts(texts, targetLang) {
  if (!texts || !Array.isArray(texts) || !targetLang || targetLang === 'en') {
    return texts;
  }

  const results = [];
  const uncachedTexts = [];
  const uncachedIndices = [];

  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    if (!text) {
      results.push(text);
      continue;
    }

    // Phase 12: Skip medical terms in batch too
    if (shouldSkipTranslation(text)) {
      results.push(text);
      continue;
    }

    const cached = getCachedTranslation(text, targetLang);
    if (cached) {
      results.push(cached);
    } else {
      results.push(null); // placeholder
      uncachedTexts.push(text);
      uncachedIndices.push(i);
    }
  }

  // All resolved from cache or medical terms
  if (uncachedTexts.length === 0) return results;

  if (!API_KEY) {
    console.warn('Google Translate API key not found. Set VITE_GOOGLE_TRANSLATE_KEY in .env.local');
    // Fill placeholders with original text
    uncachedIndices.forEach((idx, j) => { results[idx] = uncachedTexts[j]; });
    return results;
  }

  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: uncachedTexts, target: targetLang, format: 'text' })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const translations = data?.data?.translations || [];

    uncachedIndices.forEach((originalIdx, j) => {
      const translated = translations[j]?.translatedText || uncachedTexts[j];
      results[originalIdx] = translated;
      if (translated !== uncachedTexts[j]) {
        cacheTranslation(uncachedTexts[j], targetLang, translated);
      }
    });

    return results;
  } catch (e) {
    console.warn("Batch translation failed:", e.message);
    // Fill placeholders with original text
    uncachedIndices.forEach((idx, j) => { results[idx] = uncachedTexts[j]; });
    return results;
  }
}

// ─── Phase 10: Preload Translations Engine ──────────────
// Call on dashboard mount to warm the cache for all visible strings
// Returns a promise that resolves when all strings are cached.

const preloadInFlight = new Map(); // prevents duplicate preloads

export async function preloadTranslations(textArray, targetLang) {
  if (!Array.isArray(textArray) || targetLang === "en") return;

  // Deduplicate: skip texts already cached or in-flight
  const needed = textArray.filter(t => {
    if (!t || shouldSkipTranslation(t)) return false;
    if (getCachedTranslation(t, targetLang)) return false;
    return true;
  });

  if (needed.length === 0) return;

  // Prevent duplicate concurrent preloads for same language
  const key = `${targetLang}:${needed.sort().join('|')}`;
  if (preloadInFlight.has(key)) return preloadInFlight.get(key);

  const promise = translateTexts(needed, targetLang).finally(() => {
    preloadInFlight.delete(key);
  });

  preloadInFlight.set(key, promise);
  return promise;
}

// ─── Cache Management ───────────────────────────────────

export function clearTranslationCache() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('translation_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

export function clearExpiredTranslationCache() {
  const now = Date.now();
  const expiry = 7 * 24 * 60 * 60 * 1000;
  const keysToRemove = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('translation_')) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key));
        if (now - parsed.timestamp > expiry) {
          keysToRemove.push(key);
        }
      } catch {
        keysToRemove.push(key);
      }
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// Export medical terms list for external use (e.g. UI indicators)
export { MEDICAL_LOCK_TERMS };

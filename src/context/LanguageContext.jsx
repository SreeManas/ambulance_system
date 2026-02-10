// src/context/LanguageContext.jsx
// Enhanced Language Context — Phases 8 (Persistence) + 9 (RTL) + ~130 Languages
import React, { createContext, useState, useEffect, useCallback, useMemo } from "react";
import { translateText, translateTexts, preloadTranslations } from "../utils/translateService";
import { createLanguageMap, isRTL, SUPPORTED_LANGUAGES } from "../constants/languages";

export const LanguageContext = createContext();

// Build language map from full list (~130 languages)
const SUPPORTED_LANGS = createLanguageMap();

// Persistence key
const STORAGE_KEY = "ems_language";

export function LanguageProvider({ children }) {
  // ─── Phase 8: Persistent Language Preference ──────────
  const [lang, setLangState] = useState(() => {
    // 1. Try persisted preference
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS[saved]) return saved;

    // 2. Try browser language detection
    const browserLang = navigator.language.split('-')[0];
    if (SUPPORTED_LANGS[browserLang]) return browserLang;

    // 3. Default to English
    return "en";
  });

  const [isTranslating, setIsTranslating] = useState(false);

  // Persist on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    // Also keep backward-compatible key
    localStorage.setItem("lang", lang);
  }, [lang]);

  // ─── Phase 9: RTL Layout Support ──────────────────────
  useEffect(() => {
    const rtl = isRTL(lang);
    document.documentElement.dir = rtl ? "rtl" : "ltr";
    document.body.dir = rtl ? "rtl" : "ltr";

    // Toggle a CSS class for RTL-specific overrides
    if (rtl) {
      document.documentElement.classList.add("rtl-active");
    } else {
      document.documentElement.classList.remove("rtl-active");
    }
  }, [lang]);

  // ─── Translation Functions ────────────────────────────
  const translateUI = useCallback(async (text) => {
    if (lang === "en") return text;
    return await translateText(text, lang);
  }, [lang]);

  const translateUIBatch = useCallback(async (texts) => {
    if (lang === "en") return texts;
    setIsTranslating(true);
    try {
      return await translateTexts(texts, lang);
    } finally {
      setIsTranslating(false);
    }
  }, [lang]);

  // ─── Phase 10: Preload helper exposed to consumers ───
  const preloadUI = useCallback(async (textArray) => {
    if (lang === "en") return;
    return await preloadTranslations(textArray, lang);
  }, [lang]);

  // ─── Language Change (validates against full list) ────
  const setLang = useCallback((newLang) => {
    if (SUPPORTED_LANGS[newLang]) {
      setLangState(newLang);
    }
  }, []);

  // ─── Context Value (memoized to prevent re-renders) ──
  const value = useMemo(() => ({
    lang,
    setLang,
    translateUI,
    translateUIBatch,
    preloadUI,
    isTranslating,
    isRTL: isRTL(lang),
    SUPPORTED_LANGS,
    SUPPORTED_LANGUAGES,
  }), [lang, setLang, translateUI, translateUIBatch, preloadUI, isTranslating]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Convenience hook
export function useLanguage() {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

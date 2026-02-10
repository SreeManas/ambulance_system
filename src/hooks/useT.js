// src/hooks/useT.js
// Enhanced Translation Hook — Phase 11 (Key Mapping Support)
//
// Usage:
//   import { useT } from '../hooks/useT';
//   import { TK } from '../constants/translationKeys';
//
//   const title = useT(TK.ROUTING_TITLE);   // key-based
//   const label = useT("Custom Label");       // raw string (still works)

import { useContext, useState, useEffect, useRef, useCallback } from "react";
import { LanguageContext } from "../context/LanguageContext";

export function useT(text) {
  const { translateUI, lang } = useContext(LanguageContext);
  const [translated, setTranslated] = useState(text);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;

    // Skip translation for empty text or English
    if (!text || lang === "en") {
      setTranslated(text);
      return;
    }

    translateUI(text)
      .then((res) => {
        if (activeRef.current) setTranslated(res);
      })
      .catch(() => {
        if (activeRef.current) setTranslated(text); // fallback
      });

    return () => {
      activeRef.current = false;
    };
  }, [text, lang]); // removed translateUI from deps to prevent re-render storms

  return translated;
}

// Hook for translating multiple texts at once (more efficient)
export function useTBatch(texts) {
  const { translateUIBatch, lang } = useContext(LanguageContext);
  const [translated, setTranslated] = useState(texts);
  const [loading, setLoading] = useState(false);
  const activeRef = useRef(true);
  const textsKey = Array.isArray(texts) ? texts.join('|') : '';

  useEffect(() => {
    activeRef.current = true;

    if (!texts || !Array.isArray(texts) || lang === "en") {
      setTranslated(texts);
      setLoading(false);
      return;
    }

    setLoading(true);

    translateUIBatch(texts)
      .then((res) => {
        if (activeRef.current) {
          setTranslated(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (activeRef.current) {
          setTranslated(texts); // fallback
          setLoading(false);
        }
      });

    return () => {
      activeRef.current = false;
    };
  }, [textsKey, lang]); // use stable key to avoid re-renders

  return { translated, loading };
}

// Hook with preloading — call once per dashboard to warm cache
export function useTPreload(textArray) {
  const { preloadUI, lang } = useContext(LanguageContext);
  const loadedRef = useRef('');

  useEffect(() => {
    const key = `${lang}:${textArray.length}`;
    if (loadedRef.current === key) return; // already preloaded for this lang
    loadedRef.current = key;

    if (lang !== "en" && Array.isArray(textArray) && textArray.length > 0) {
      preloadUI(textArray);
    }
  }, [lang, textArray, preloadUI]);
}

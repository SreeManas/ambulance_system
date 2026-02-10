// src/components/LanguageSwitcher.jsx
// Enhanced Language Switcher — ~130 languages with search & region grouping
import React, { useContext, useState, useMemo, useRef, useEffect } from "react";
import { LanguageContext } from "../context/LanguageContext.jsx";
import { SUPPORTED_LANGUAGES } from "../constants/languages.js";

export default function LanguageSwitcher() {
  const { lang, setLang, isTranslating, isRTL: rtl } = useContext(LanguageContext);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter languages by search
  const filteredLanguages = useMemo(() => {
    if (!search.trim()) return SUPPORTED_LANGUAGES;
    const q = search.toLowerCase();
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [search]);

  // Current language display
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === lang);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isTranslating}
        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        title="Select language"
      >
        <span className="text-base">🌐</span>
        <span className="font-medium text-gray-700 max-w-[100px] truncate">
          {currentLang?.native || "English"}
        </span>
        <svg
          className={`w-3 h-3 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Translating indicator */}
      {isTranslating && (
        <div className="absolute -top-1 -right-1 z-10">
          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping"></div>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden ${rtl ? "left-0" : "right-0"
            }`}
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search language..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              autoFocus
            />
          </div>

          {/* Language List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredLanguages.length === 0 ? (
              <div className="p-3 text-center text-sm text-gray-400">
                No languages found
              </div>
            ) : (
              filteredLanguages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => {
                    setLang(l.code);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${lang === l.code
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{l.native}</span>
                    <span className="text-[10px] text-gray-400">{l.name}</span>
                  </div>
                  {lang === l.code && (
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

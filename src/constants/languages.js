// src/constants/languages.js
// Complete Google Translate API supported languages (~130)
// Organized by region with native script names for display

export const SUPPORTED_LANGUAGES = [
    // ─── Indian Languages ──────────────────────────────────
    { code: "en", name: "English", native: "English", region: "Global" },
    { code: "hi", name: "Hindi", native: "हिन्दी", region: "India" },
    { code: "te", name: "Telugu", native: "తెలుగు", region: "India" },
    { code: "ta", name: "Tamil", native: "தமிழ்", region: "India" },
    { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", region: "India" },
    { code: "ml", name: "Malayalam", native: "മലയാളം", region: "India" },
    { code: "mr", name: "Marathi", native: "मराठी", region: "India" },
    { code: "bn", name: "Bengali", native: "বাংলা", region: "India" },
    { code: "gu", name: "Gujarati", native: "ગુજરાતી", region: "India" },
    { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", region: "India" },
    { code: "ur", name: "Urdu", native: "اردو", region: "India" },
    { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", region: "India" },
    { code: "as", name: "Assamese", native: "অসমীয়া", region: "India" },
    { code: "ne", name: "Nepali", native: "नेपाली", region: "India" },
    { code: "sa", name: "Sanskrit", native: "संस्कृतम्", region: "India" },
    { code: "sd", name: "Sindhi", native: "سنڌي", region: "India" },
    { code: "si", name: "Sinhala", native: "සිංහල", region: "South Asia" },
    { code: "my", name: "Myanmar (Burmese)", native: "ဗမာ", region: "South Asia" },

    // ─── East Asian Languages ──────────────────────────────
    { code: "zh", name: "Chinese (Simplified)", native: "简体中文", region: "East Asia" },
    { code: "zh-TW", name: "Chinese (Traditional)", native: "繁體中文", region: "East Asia" },
    { code: "ja", name: "Japanese", native: "日本語", region: "East Asia" },
    { code: "ko", name: "Korean", native: "한국어", region: "East Asia" },
    { code: "mn", name: "Mongolian", native: "Монгол", region: "East Asia" },

    // ─── Southeast Asian Languages ─────────────────────────
    { code: "th", name: "Thai", native: "ไทย", region: "Southeast Asia" },
    { code: "vi", name: "Vietnamese", native: "Tiếng Việt", region: "Southeast Asia" },
    { code: "id", name: "Indonesian", native: "Bahasa Indonesia", region: "Southeast Asia" },
    { code: "ms", name: "Malay", native: "Bahasa Melayu", region: "Southeast Asia" },
    { code: "tl", name: "Filipino", native: "Filipino", region: "Southeast Asia" },
    { code: "km", name: "Khmer", native: "ខ្មែរ", region: "Southeast Asia" },
    { code: "lo", name: "Lao", native: "ລາວ", region: "Southeast Asia" },
    { code: "jw", name: "Javanese", native: "Basa Jawa", region: "Southeast Asia" },
    { code: "su", name: "Sundanese", native: "Basa Sunda", region: "Southeast Asia" },
    { code: "ceb", name: "Cebuano", native: "Cebuano", region: "Southeast Asia" },
    { code: "hmn", name: "Hmong", native: "Hmong", region: "Southeast Asia" },

    // ─── Middle Eastern & Central Asian ────────────────────
    { code: "ar", name: "Arabic", native: "العربية", region: "Middle East" },
    { code: "fa", name: "Persian", native: "فارسی", region: "Middle East" },
    { code: "he", name: "Hebrew", native: "עברית", region: "Middle East" },
    { code: "tr", name: "Turkish", native: "Türkçe", region: "Middle East" },
    { code: "ku", name: "Kurdish", native: "Kurdî", region: "Middle East" },
    { code: "ps", name: "Pashto", native: "پښتو", region: "Central Asia" },
    { code: "az", name: "Azerbaijani", native: "Azərbaycan", region: "Central Asia" },
    { code: "kk", name: "Kazakh", native: "Қазақ", region: "Central Asia" },
    { code: "ky", name: "Kyrgyz", native: "Кыргызча", region: "Central Asia" },
    { code: "uz", name: "Uzbek", native: "Oʻzbek", region: "Central Asia" },
    { code: "tg", name: "Tajik", native: "Тоҷикӣ", region: "Central Asia" },
    { code: "tk", name: "Turkmen", native: "Türkmen", region: "Central Asia" },
    { code: "ug", name: "Uyghur", native: "ئۇيغۇر", region: "Central Asia" },
    { code: "tt", name: "Tatar", native: "Татарча", region: "Central Asia" },

    // ─── European Languages ────────────────────────────────
    { code: "fr", name: "French", native: "Français", region: "Europe" },
    { code: "de", name: "German", native: "Deutsch", region: "Europe" },
    { code: "es", name: "Spanish", native: "Español", region: "Europe" },
    { code: "pt", name: "Portuguese", native: "Português", region: "Europe" },
    { code: "it", name: "Italian", native: "Italiano", region: "Europe" },
    { code: "nl", name: "Dutch", native: "Nederlands", region: "Europe" },
    { code: "ru", name: "Russian", native: "Русский", region: "Europe" },
    { code: "pl", name: "Polish", native: "Polski", region: "Europe" },
    { code: "ro", name: "Romanian", native: "Română", region: "Europe" },
    { code: "uk", name: "Ukrainian", native: "Українська", region: "Europe" },
    { code: "el", name: "Greek", native: "Ελληνικά", region: "Europe" },
    { code: "hu", name: "Hungarian", native: "Magyar", region: "Europe" },
    { code: "cs", name: "Czech", native: "Čeština", region: "Europe" },
    { code: "sv", name: "Swedish", native: "Svenska", region: "Europe" },
    { code: "da", name: "Danish", native: "Dansk", region: "Europe" },
    { code: "no", name: "Norwegian", native: "Norsk", region: "Europe" },
    { code: "fi", name: "Finnish", native: "Suomi", region: "Europe" },
    { code: "sk", name: "Slovak", native: "Slovenčina", region: "Europe" },
    { code: "sl", name: "Slovenian", native: "Slovenščina", region: "Europe" },
    { code: "hr", name: "Croatian", native: "Hrvatski", region: "Europe" },
    { code: "sr", name: "Serbian", native: "Српски", region: "Europe" },
    { code: "bs", name: "Bosnian", native: "Bosanski", region: "Europe" },
    { code: "bg", name: "Bulgarian", native: "Български", region: "Europe" },
    { code: "mk", name: "Macedonian", native: "Македонски", region: "Europe" },
    { code: "sq", name: "Albanian", native: "Shqip", region: "Europe" },
    { code: "et", name: "Estonian", native: "Eesti", region: "Europe" },
    { code: "lv", name: "Latvian", native: "Latviešu", region: "Europe" },
    { code: "lt", name: "Lithuanian", native: "Lietuvių", region: "Europe" },
    { code: "be", name: "Belarusian", native: "Беларуская", region: "Europe" },
    { code: "is", name: "Icelandic", native: "Íslenska", region: "Europe" },
    { code: "mt", name: "Maltese", native: "Malti", region: "Europe" },
    { code: "lb", name: "Luxembourgish", native: "Lëtzebuergesch", region: "Europe" },
    { code: "ca", name: "Catalan", native: "Català", region: "Europe" },
    { code: "eu", name: "Basque", native: "Euskara", region: "Europe" },
    { code: "gl", name: "Galician", native: "Galego", region: "Europe" },
    { code: "hy", name: "Armenian", native: "Հայերեն", region: "Europe" },
    { code: "ka", name: "Georgian", native: "ქართული", region: "Europe" },
    { code: "ga", name: "Irish", native: "Gaeilge", region: "Europe" },
    { code: "gd", name: "Scots Gaelic", native: "Gàidhlig", region: "Europe" },
    { code: "cy", name: "Welsh", native: "Cymraeg", region: "Europe" },
    { code: "fy", name: "Frisian", native: "Frysk", region: "Europe" },
    { code: "co", name: "Corsican", native: "Corsu", region: "Europe" },
    { code: "la", name: "Latin", native: "Latina", region: "Europe" },
    { code: "eo", name: "Esperanto", native: "Esperanto", region: "Europe" },
    { code: "yi", name: "Yiddish", native: "ייִדיש", region: "Europe" },

    // ─── African Languages ─────────────────────────────────
    { code: "sw", name: "Swahili", native: "Kiswahili", region: "Africa" },
    { code: "af", name: "Afrikaans", native: "Afrikaans", region: "Africa" },
    { code: "am", name: "Amharic", native: "አማርኛ", region: "Africa" },
    { code: "ha", name: "Hausa", native: "Hausa", region: "Africa" },
    { code: "ig", name: "Igbo", native: "Igbo", region: "Africa" },
    { code: "yo", name: "Yoruba", native: "Yorùbá", region: "Africa" },
    { code: "zu", name: "Zulu", native: "isiZulu", region: "Africa" },
    { code: "xh", name: "Xhosa", native: "isiXhosa", region: "Africa" },
    { code: "st", name: "Sesotho", native: "Sesotho", region: "Africa" },
    { code: "sn", name: "Shona", native: "chiShona", region: "Africa" },
    { code: "so", name: "Somali", native: "Soomaali", region: "Africa" },
    { code: "ny", name: "Chichewa", native: "Chichewa", region: "Africa" },
    { code: "rw", name: "Kinyarwanda", native: "Kinyarwanda", region: "Africa" },
    { code: "mg", name: "Malagasy", native: "Malagasy", region: "Africa" },

    // ─── Pacific Languages ─────────────────────────────────
    { code: "haw", name: "Hawaiian", native: "ʻŌlelo Hawaiʻi", region: "Pacific" },
    { code: "sm", name: "Samoan", native: "Gagana Sāmoa", region: "Pacific" },
    { code: "mi", name: "Maori", native: "Māori", region: "Pacific" },

    // ─── Caribbean / Creole ────────────────────────────────
    { code: "ht", name: "Haitian Creole", native: "Kreyòl Ayisyen", region: "Caribbean" },
];

// RTL languages that require layout direction change
export const RTL_LANGUAGES = ["ar", "ur", "he", "fa", "ps", "sd", "ug", "yi"];

// Helper: get language object by code
export const getLanguageByCode = (code) =>
    SUPPORTED_LANGUAGES.find((l) => l.code === code) || SUPPORTED_LANGUAGES[0];

// Helper: create { code: native } map for LanguageContext
export const createLanguageMap = () =>
    SUPPORTED_LANGUAGES.reduce((map, lang) => {
        map[lang.code] = lang.native;
        return map;
    }, {});

// Helper: check if a language code is RTL
export const isRTL = (code) => RTL_LANGUAGES.includes(code);

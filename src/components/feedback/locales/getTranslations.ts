import { useLocale } from "next-intl";
import en from "./en.json";
import es from "./es.json";

const translationsMap: Record<string, any> = {
    en,
    es,
};

function detectLocale(): string {
    try {
        // Attempt to get the locale from next-intl
        return useLocale();
    } catch (error) {
        // If useLocale is not available, check the URL
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const urlLocale = urlParams.get("locale");
            if (urlLocale && translationsMap[urlLocale]) {
                return urlLocale;
            }
        }
        // Default fallback to English
        return "en";
    }
}

export function getTranslations(locale: string) {
    return translationsMap[locale] || translationsMap["en"];
}

export function useTranslations(component: string) {
    const locale = detectLocale(); // Auto-detect locale
    const translations = getTranslations(locale);

    return (key: string) => {
        return translations[component]?.[key] || key; // Fallback to key if not found
    };
}

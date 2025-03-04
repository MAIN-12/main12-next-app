import { useLocale } from "next-intl";
import en from "./en.json";
import es from "./es.json";

const translationsMap: Record<string, any> = {
    en,
    es,
};

// Custom hook to detect locale
function useDetectedLocale(): string {
    try {
        return useLocale();
    } catch (error) {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const urlLocale = urlParams.get("locale");
            if (urlLocale && translationsMap[urlLocale]) {
                return urlLocale;
            }
        }
        return "en"; // Default fallback
    }
}

export function getTranslations(locale: string) {
    return translationsMap[locale] || translationsMap["en"];
}

export function useTranslations(component: string) {
    const locale = useDetectedLocale(); // Use the custom hook
    const translations = getTranslations(locale);

    return (key: string) => {
        return translations[component]?.[key] || key; // Fallback to key if not found
    };
}

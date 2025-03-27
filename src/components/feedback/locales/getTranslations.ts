"use client"

import { useLocale } from "next-intl"
import en from "./en.json"
import es from "./es.json"
import feedbackConfig from "../feedback.config"
import { useEffect, useState } from "react"

const translationsMap: Record<string, any> = {
    en,
    es,
}

// Custom hook to detect locale with multiple fallback mechanisms
function useDetectedLocale(): string {
    const [locale, setLocale] = useState<string>(feedbackConfig.defaultLanguage)
    const nextIntlLocale = useLocale() // Call useLocale unconditionally

    useEffect(() => {
        let detectedLocale = feedbackConfig.defaultLanguage
        try {
            // First try to use next-intl's useLocale
            detectedLocale = nextIntlLocale
        } catch (error) {
            // If that fails, check URL parameters
            if (typeof window !== "undefined") {
                // Check URL parameters
                const urlParams = new URLSearchParams(window.location.search)
                const urlLocale = urlParams.get("locale")
                if (urlLocale && translationsMap[urlLocale]) {
                    detectedLocale = urlLocale
                } else {
                    // Check localStorage
                    const storedLocale = localStorage.getItem("feedbackLanguage")
                    if (storedLocale && translationsMap[storedLocale]) {
                        detectedLocale = storedLocale
                    } else {
                        // Check browser language
                        const browserLang = navigator.language.split("-")[0]
                        if (browserLang && translationsMap[browserLang]) {
                            detectedLocale = browserLang
                        }
                    }
                }
            }
        }
        setLocale(detectedLocale)
    }, [nextIntlLocale])

    return locale
}

// Set the current language (stores in localStorage)
export function setCurrentLanguage(language: string): void {
    if (typeof window !== "undefined" && translationsMap[language]) {
        localStorage.setItem("feedbackLanguage", language)
    }
}

export function getTranslations(locale: string) {
    return translationsMap[locale] || translationsMap[feedbackConfig.defaultLanguage] || translationsMap["en"]
}

// Replace the entire useTranslations function implementation with this:

// Define a type for our enhanced translation function
type TranslationFunction = {
    (key: string, params?: Record<string, string | number>): string
    locale: string
    t: (key: string, params?: Record<string, string | number>) => string
}

// Implementation that supports all patterns
export function useTranslations(component: string): TranslationFunction {
    const locale = useDetectedLocale() // Use the custom hook
    const translations = getTranslations(locale)

    // Create the translation function
    const translateFn = ((key: string, params?: Record<string, string | number>) => {
        const keys = key.split(".") // Split the key by dot notation
        let value = translations[component]

        for (const k of keys) {
            if (value && typeof value === "object") {
                value = value[k]
            } else {
                return key // Fallback to key if not found
            }
        }

        if (typeof value === "string" && params) {
            return value.replace(/\{(\w+)\}/g, (_, paramKey) =>
                params[paramKey] !== undefined ? String(params[paramKey]) : `{${paramKey}}`,
            )
        }

        return typeof value === "string" ? value : key // Ensure it returns a string or fallback
    }) as TranslationFunction

    // Add properties to the function
    translateFn.locale = locale
    translateFn.t = translateFn // Self-reference for destructuring

    return translateFn
}

// Export default for backward compatibility
export default useTranslations

// Export the current language for components that need it
export function getCurrentLanguage(): string {
    return useDetectedLocale()
}


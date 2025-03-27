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

// Define a type for our enhanced translation function
type TranslationFunction = {
    (key: string, params?: Record<string, string | number>): string
    t: (key: string, params?: Record<string, string | number>) => string
    locale: string
}

// Define function overloads for TypeScript to understand all usage patterns
export function useTranslations(component: string): TranslationFunction

// Implementation that handles all patterns
export function useTranslations(component: string) {
    const locale = useDetectedLocale() // Use the custom hook
    const translations = getTranslations(locale)

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
    }) as TranslationFunction // Cast to our defined type

    // Add properties to the function
    translateFn.locale = locale
    translateFn.t = translateFn // Self-reference for destructuring

    return translateFn
}

// Fix: Rename to useCurrentLanguage to follow React Hook naming conventions
export function useCurrentLanguage(): string {
    return useDetectedLocale()
}

// Non-hook version for use in non-component/non-hook contexts
export function getCurrentLanguage(): string {
    // This is a non-hook implementation that doesn't use React state
    if (typeof window === "undefined") {
        return feedbackConfig.defaultLanguage
    }

    // Try to get from localStorage first
    const storedLocale = localStorage.getItem("feedbackLanguage")
    if (storedLocale && translationsMap[storedLocale]) {
        return storedLocale
    }

    // Try to get from browser language
    try {
        const browserLang = navigator.language.split("-")[0]
        if (browserLang && translationsMap[browserLang]) {
            return browserLang
        }
    } catch (e) {
        // Ignore errors
    }

    // Fallback to default
    return feedbackConfig.defaultLanguage
}

// Default export for backward compatibility
export default useTranslations


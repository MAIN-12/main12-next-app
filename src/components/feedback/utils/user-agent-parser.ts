/**
 * Utility for parsing User-Agent strings into more readable information
 */

export interface UserAgentInfo {
    browser: {
        name: string
        version: string
        fullName: string
    }
    os: {
        name: string
        version: string
        fullName: string
    }
    device: string
    isDesktop: boolean
    isMobile: boolean
    isTablet: boolean
    raw: string
}

/**
 * Parse a User-Agent string into structured information
 */
export function parseUserAgent(userAgentString: string): UserAgentInfo {
    const ua = userAgentString.toLowerCase()
    const result: UserAgentInfo = {
        browser: {
            name: "Unknown",
            version: "Unknown",
            fullName: "Unknown Browser",
        },
        os: {
            name: "Unknown",
            version: "Unknown",
            fullName: "Unknown OS",
        },
        device: "Unknown",
        isDesktop: false,
        isMobile: false,
        isTablet: false,
        raw: userAgentString,
    }

    // Detect browser
    if (ua.includes("firefox")) {
        result.browser.name = "Firefox"
        const match = ua.match(/firefox\/([\d.]+)/)
        if (match) result.browser.version = match[1]
    } else if (ua.includes("edg")) {
        result.browser.name = "Edge"
        const match = ua.match(/edg\/([\d.]+)/)
        if (match) result.browser.version = match[1]
    } else if (ua.includes("chrome")) {
        result.browser.name = "Chrome"
        const match = ua.match(/chrome\/([\d.]+)/)
        if (match) result.browser.version = match[1]
    } else if (ua.includes("safari") && !ua.includes("chrome")) {
        result.browser.name = "Safari"
        const match = ua.match(/version\/([\d.]+)/)
        if (match) result.browser.version = match[1]
    } else if (ua.includes("opr") || ua.includes("opera")) {
        result.browser.name = "Opera"
        const match = ua.match(/(?:opr|opera)\/([\d.]+)/)
        if (match) result.browser.version = match[1]
    }

    result.browser.fullName = `${result.browser.name} ${result.browser.version}`

    // Detect OS
    if (ua.includes("windows")) {
        // For Windows 11, we need additional detection logic since it uses "Windows NT 10.0" in UA
        if (ua.includes("windows nt 10")) {
            // Try to detect Windows 11 using additional checks
            // Note: This is not 100% reliable as User-Agent doesn't explicitly indicate Windows 11

            // Windows 11 was released in October 2021, so newer browser versions are more likely to be on Windows 11
            // We can also check for Windows build number, but that's not always present in the UA string
            const isLikelyWin11 = detectWindows11(userAgentString)

            if (isLikelyWin11) {
                result.os.name = "Windows"
                result.os.version = "11"
            } else {
                result.os.name = "Windows"
                result.os.version = "10"
            }
        } else if (ua.includes("windows nt 6.3")) {
            result.os.name = "Windows"
            result.os.version = "8.1"
        } else if (ua.includes("windows nt 6.2")) {
            result.os.name = "Windows"
            result.os.version = "8"
        } else if (ua.includes("windows nt 6.1")) {
            result.os.name = "Windows"
            result.os.version = "7"
        } else if (ua.includes("windows nt 6.0")) {
            result.os.name = "Windows"
            result.os.version = "Vista"
        } else if (ua.includes("windows nt 5.1")) {
            result.os.name = "Windows"
            result.os.version = "XP"
        }
        result.isDesktop = true
    } else if (ua.includes("macintosh") || ua.includes("mac os x")) {
        result.os.name = "macOS"
        const match = ua.match(/mac os x (\d+[._]\d+[._]\d+)/)
        if (match) {
            result.os.version = match[1].replace(/_/g, ".")
        } else {
            const versionMatch = ua.match(/mac os x (\d+[._]\d+)/)
            if (versionMatch) {
                result.os.version = versionMatch[1].replace(/_/g, ".")
            }
        }
        result.isDesktop = true
    } else if (ua.includes("linux")) {
        result.os.name = "Linux"
        result.isDesktop = true
    } else if (ua.includes("android")) {
        result.os.name = "Android"
        const match = ua.match(/android (\d+(?:\.\d+)*)/)
        if (match) result.os.version = match[1]
        result.isMobile = true
        if (ua.includes("tablet") || (typeof screen !== "undefined" && screen.width > 768)) {
            result.isTablet = true
            result.isMobile = false
        }
    } else if (ua.includes("iphone")) {
        result.os.name = "iOS"
        const match = ua.match(/os (\d+[._]\d+[._]?\d*)/)
        if (match) result.os.version = match[1].replace(/_/g, ".")
        result.isMobile = true
        result.device = "iPhone"
    } else if (ua.includes("ipad")) {
        result.os.name = "iOS"
        const match = ua.match(/os (\d+[._]\d+[._]?\d*)/)
        if (match) result.os.version = match[1].replace(/_/g, ".")
        result.isTablet = true
        result.device = "iPad"
    }

    result.os.fullName = `${result.os.name} ${result.os.version}`

    // Detect device type if not already set
    if (!result.device) {
        if (result.isTablet) {
            result.device = "Tablet"
        } else if (result.isMobile) {
            result.device = "Mobile"
        } else if (result.isDesktop) {
            result.device = "Desktop"
        }
    }

    return result
}

/**
 * Attempt to detect Windows 11 based on various heuristics
 * This is not 100% reliable but can provide a better guess than just assuming Windows 10
 */
function detectWindows11(userAgentString: string): boolean {
    // Windows 11 was released in October 2021
    // We can look for clues that might indicate Windows 11:

    // 1. Check for newer Chrome/Edge versions that were released after Windows 11
    const chromeMatch = userAgentString.match(/Chrome\/(\d+)/i)
    const edgeMatch = userAgentString.match(/Edg\/(\d+)/i)

    if (chromeMatch && Number.parseInt(chromeMatch[1]) >= 94) {
        // Chrome 94+ was released around the same time as Windows 11
        // Higher chance of being Windows 11, but not guaranteed
        return true
    }

    if (edgeMatch && Number.parseInt(edgeMatch[1]) >= 94) {
        // Edge 94+ was released around the same time as Windows 11
        return true
    }

    // 2. Look for Windows build number in the UA string (if available)
    const buildMatch = userAgentString.match(/Windows NT 10.0;.*Build\/(\d+)/i)
    if (buildMatch && Number.parseInt(buildMatch[1]) >= 22000) {
        // Windows 11 starts with build 22000
        return true
    }

    // Add a note about the detection in the result
    return false
}

/**
 * Get a more user-friendly description of the system
 */
export function getUserFriendlySystemInfo(userAgentString: string): string {
    const info = parseUserAgent(userAgentString)

    // For Windows 10/11, add a note about the detection limitations
    if (info.os.name === "Windows" && (info.os.version === "10" || info.os.version === "11")) {
        if (info.os.version === "11") {
            return `${info.browser.fullName} on ${info.os.fullName} (detected based on browser version, as Windows 11 reports itself as "Windows NT 10.0" for compatibility)`
        } else {
            return `${info.browser.fullName} on ${info.os.fullName} (Note: Windows 11 also reports as Windows 10 in User-Agent strings)`
        }
    }

    return `${info.browser.fullName} on ${info.os.fullName}`
}


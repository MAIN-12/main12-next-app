/**
 * Utility for tracking request processing times
 */

// Generate a unique request ID
export function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}

// Get current timestamp in milliseconds
export function getCurrentTimestamp(): number {
    return Date.now()
}

// Calculate processing time in milliseconds
export function calculateProcessingTime(startTime: number): number {
    return Date.now() - startTime
}

// Format processing time for display
export function formatProcessingTime(milliseconds: number): string {
    if (milliseconds < 1000) {
        return `${milliseconds}ms`
    } else {
        const seconds = (milliseconds / 1000).toFixed(2)
        return `${seconds}s`
    }
}


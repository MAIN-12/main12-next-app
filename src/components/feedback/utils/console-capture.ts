/**
 * Utility for capturing browser console logs
 */

// Define the structure for a console log entry
export interface ConsoleLogEntry {
    type: "log" | "info" | "warn" | "error" | "debug"
    message: string
    timestamp: string
    details?: any
}

// Class to capture console logs
export class ConsoleCapture {
    private logs: ConsoleLogEntry[] = []
    private originalConsole: {
        log: typeof console.log
        info: typeof console.info
        warn: typeof console.warn
        error: typeof console.error
        debug: typeof console.debug
    }
    private isCapturing = false
    private maxLogs: number

    constructor(maxLogs = 100) {
        this.maxLogs = maxLogs
        this.originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug,
        }
    }

    // Start capturing console logs
    startCapture() {
        if (this.isCapturing) return
        this.isCapturing = true

        // Override console methods
        console.log = (...args: any[]) => {
            this.captureLog("log", ...args)
            this.originalConsole.log.apply(console, args)
        }

        console.info = (...args: any[]) => {
            this.captureLog("info", ...args)
            this.originalConsole.info.apply(console, args)
        }

        console.warn = (...args: any[]) => {
            this.captureLog("warn", ...args)
            this.originalConsole.warn.apply(console, args)
        }

        console.error = (...args: any[]) => {
            this.captureLog("error", ...args)
            this.originalConsole.error.apply(console, args)
        }

        console.debug = (...args: any[]) => {
            this.captureLog("debug", ...args)
            this.originalConsole.debug.apply(console, args)
        }
    }

    // Stop capturing console logs and restore original console methods
    stopCapture() {
        if (!this.isCapturing) return

        console.log = this.originalConsole.log
        console.info = this.originalConsole.info
        console.warn = this.originalConsole.warn
        console.error = this.originalConsole.error
        console.debug = this.originalConsole.debug

        this.isCapturing = false
    }

    // Helper method to capture a log entry
    private captureLog(type: ConsoleLogEntry["type"], ...args: any[]) {
        try {
            const message = args
                .map((arg) => {
                    if (typeof arg === "object") {
                        try {
                            return JSON.stringify(arg)
                        } catch (e) {
                            return String(arg)
                        }
                    }
                    return String(arg)
                })
                .join(" ")

            const logEntry: ConsoleLogEntry = {
                type,
                message,
                timestamp: new Date().toISOString(),
                details: args.length > 1 ? args : args[0],
            }

            this.logs.push(logEntry)

            // Limit the number of logs to prevent memory issues
            if (this.logs.length > this.maxLogs) {
                this.logs.shift()
            }
        } catch (error) {
            // If there's an error in our logging code, use the original console
            this.originalConsole.error("Error in console capture:", error)
        }
    }

    // Get all captured logs
    getLogs(): ConsoleLogEntry[] {
        return [...this.logs]
    }

    // Clear all captured logs
    clearLogs() {
        this.logs = []
    }

    // Get logs as a formatted string
    getLogsAsString(): string {
        return this.logs.map((log) => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join("\n")
    }
}

// Create a singleton instance
let consoleCapture: ConsoleCapture | null = null

// Initialize the console capture
export function initConsoleCapture(maxLogs = 100): ConsoleCapture {
    if (typeof window === "undefined") {
        // Return a dummy implementation for server-side rendering
        return {
            startCapture: () => { },
            stopCapture: () => { },
            getLogs: () => [],
            clearLogs: () => { },
            getLogsAsString: () => "",
        } as unknown as ConsoleCapture
    }

    console.log("[DEBUG] Console capture initialized with max logs:", maxLogs)

    if (!consoleCapture) {
        consoleCapture = new ConsoleCapture(maxLogs)
        consoleCapture.startCapture()
    }

    return consoleCapture
}

// Get the console capture instance
export function getConsoleCapture(): ConsoleCapture {
    if (!consoleCapture && typeof window !== "undefined") {
        consoleCapture = new ConsoleCapture()
        consoleCapture.startCapture()
    }

    return consoleCapture as ConsoleCapture
}

// Utility function to capture uncaught errors
export function captureUncaughtErrors() {
    if (typeof window === "undefined") return

    const capture = getConsoleCapture()

    window.addEventListener("error", (event) => {
        const { message, filename, lineno, colno, error } = event
        const errorDetails = {
            message,
            source: filename,
            line: lineno,
            column: colno,
            stack: error?.stack,
        }

        capture.getLogs().push({
            type: "error",
            message: `Uncaught error: ${message}`,
            timestamp: new Date().toISOString(),
            details: errorDetails,
        })
    })

    window.addEventListener("unhandledrejection", (event) => {
        const error = event.reason
        const errorDetails = {
            message: error?.message || String(error),
            stack: error?.stack,
        }

        capture.getLogs().push({
            type: "error",
            message: `Unhandled promise rejection: ${errorDetails.message}`,
            timestamp: new Date().toISOString(),
            details: errorDetails,
        })
    })
}


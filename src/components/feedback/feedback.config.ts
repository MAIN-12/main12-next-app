/**
 * Feedback System Configuration
 * 
 * This file contains global configuration settings for the feedback system.
 * Modify these values to customize the behavior of the feedback components.
 */

export type FeedbackLanguage = 'en' | 'es' | string;

export interface FeedbackConfig {
    /**
     * Base URL for the feedback API endpoints
     */
    apiUrl: string;

    /**
     * Default language for the feedback system
     * Supported languages: 'en', 'es'
     */
    defaultLanguage: FeedbackLanguage;

    /**
     * Maximum file size for attachments in MB
     */
    maxFileSize: number;

    /**
     * Maximum number of files that can be attached
     */
    maxFiles: number;

    /**
     * Allowed file types for attachments
     * Example: 'image/*,.pdf,.doc,.docx,.txt'
     */
    allowedFileTypes: string;

    /**
     * Application name to be used in feedback submissions
     * If not provided, will fall back to NEXT_PUBLIC_APP_NAME or location.origin
     */
    appName?: string;

    /**
     * Whether to show the disclaimer at the bottom of feedback forms
     */
    showDisclaimer: boolean;

    /**
     * Company name to be displayed in the disclaimer
     */
    companyName: string;

    /**
     * URL to the privacy policy
     */
    privacyPolicyUrl?: string;

    /**
     * URL to the terms of service
     */
    termsOfServiceUrl?: string;

    /**
     * Whether to automatically collect browser and system information
     */
    collectSystemInfo: boolean;
}

/**
 * Default configuration for the feedback system
 */
const feedbackConfig: FeedbackConfig = {
    apiUrl: '/api/support',
    defaultLanguage: 'en',
    maxFileSize: 20,
    maxFiles: 5,
    allowedFileTypes: 'image/*,.pdf,.doc,.docx,.txt',
    showDisclaimer: true,
    companyName: 'Main 12 LLC',
    collectSystemInfo: true,
};

export default feedbackConfig;

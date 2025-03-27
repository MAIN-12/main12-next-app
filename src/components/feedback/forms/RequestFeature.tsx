"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button, Input, Textarea, Spacer, RadioGroup, Radio } from "@heroui/react"
import { motion } from "framer-motion"

import { useUser } from "../auth/useUser"
import { useTranslations } from "../locales/getTranslations"
import { Disclaimer } from "../Disclaimer"
import SuccessView from "./success-view"
import FileInput from "./file-input"

const API_URL = "/api/support"

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (error) => reject(error)
    })
}

const RequestFeature: React.FC = () => {
    const { user } = useUser()
    const { t, locale } = useTranslations("RequestFeature") // Get both translation function and locale
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [isCurrentPage, setIsCurrentPage] = useState("yes")
    const [location, setLocation] = useState("")
    const [files, setFiles] = useState<File[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [ticketNumber, setTicketNumber] = useState("")
    const app_name = process.env.NEXT_PUBLIC_APP_NAME || globalThis.location?.origin || "Not defined"

    useEffect(() => {
        setLocation(window.location.href)
    }, [])

    const handleFileChange = (newFiles: File[]) => {
        setFiles(newFiles)
    }

    // Update the handleSubmit function to include client timestamp
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setErrorMessage("")

        // Record the timestamp when the form is submitted
        const clientTimestamp = Date.now()

        try {
            // Convert all files to base64
            const filePromises = files.map(async (file) => {
                const base64 = await fileToBase64(file)
                return {
                    name: file.name,
                    type: file.type,
                    data: base64,
                }
            })

            const fileData = await Promise.all(filePromises)

            // Create request body as JSON
            const requestBody = {
                app_name,
                type: "feature", // Type for feature requests
                title,
                description,
                location,
                user,
                files: fileData,
                client_timestamp: clientTimestamp, // Add client timestamp
                // Add form language information
                form_language: {
                    locale: locale, // The locale used for the form
                    browser_language: navigator.language, // The browser's language
                    is_match: locale === navigator.language.split("-")[0], // Whether they match
                },
                // Add system info
                system_info: {
                    userAgent: navigator.userAgent,
                    language: navigator.language,
                    platform: navigator.platform,
                    screenSize: `${window.screen.width}x${window.screen.height}`,
                    viewport: `${window.innerWidth}x${window.innerHeight}`,
                    timestamp: new Date().toISOString(),
                },
            }

            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            })

            const result = await response.json()

            if (response.ok) {
                // Use the ID from the API response as the ticket number
                setTicketNumber(result.id)
                setIsSuccess(true)

                // Check if any files failed to upload
                if (result.data?.files) {
                    const failedUploads = result.data.files.filter((upload: any) => upload.error)
                    if (failedUploads.length > 0) {
                        setErrorMessage(`Some files failed to upload: ${failedUploads.map((u: any) => u.name).join(", ")}`)
                    }
                }
            } else {
                throw new Error(result.error || "Failed to submit feature request")
            }
        } catch (error) {
            if (error instanceof Error) {
                setErrorMessage(`An error occurred: ${error.message}`)
            } else {
                setErrorMessage("An unknown error occurred. Please try again.")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setTitle("")
        setDescription("")
        setLocation(window.location.href)
        setIsCurrentPage("yes")
        setFiles([])
        setIsSuccess(false)
        setErrorMessage("")
        setTicketNumber("")
    }

    if (isSuccess) {
        return (
            <SuccessView
                title={t("successTitle") || "Feature Request Received!"}
                message={
                    t("successMessage") ||
                    "Thank you for your feature request. We appreciate your input and will consider it for future development."
                }
                buttonText={t("submitAnother") || "Submit Another Request"}
                onReset={resetForm}
                type="suggestion"
            />
        )
    }

    return (
        <motion.div
            className="container mx-auto px-2"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
        >
            <h1 className="text-2xl font-bold">{t("title") || "Request a Feature"}</h1>
            <p className="mb-3">{t("description") || "Please fill out the form below to request a new feature."}</p>
            <form onSubmit={handleSubmit}>
                <Spacer y={8} />
                <Input
                    label={t("featureTitle") || "Feature Title"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    fullWidth
                />
                <Spacer y={3} />
                <Textarea
                    label={t("descriptionLabel") || "Feature Description"}
                    placeholder={t("describeFeature") || "Describe the feature you would like to request"}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    fullWidth
                />
                <Spacer y={8} />
                <RadioGroup
                    label={t("currentPageQuestion") || "Is the feature request related to the current page?"}
                    value={isCurrentPage}
                    onValueChange={setIsCurrentPage}
                    orientation="horizontal"
                >
                    <Radio value="yes">{t("yes") || "Yes"}</Radio>
                    <Radio value="no">{t("no") || "No"}</Radio>
                    <Radio value="new">{t("new") || "Create new page"}</Radio>
                </RadioGroup>
                <Spacer y={3} />
                {isCurrentPage !== "yes" && (
                    <Input
                        label={t("FeatureLocation") || "Can you tell us where you would like the feature to be implemented?"}
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                        fullWidth
                    />
                )}
                <Spacer y={8} />
                <FileInput
                    label={t("attachFiles") || "Add files (up to 20MB each)"}
                    onChange={handleFileChange}
                    multiple
                    maxSize={20}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <Spacer y={8} />
                <Button
                    type="submit"
                    isLoading={isSubmitting}
                    fullWidth
                    color="primary"
                    className="text-primary-foreground"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? t("submitting") || "Submitting..." : t("submitButton") || "Submit Feature Request"}
                </Button>
                <Disclaimer />
            </form>
            {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                    <p>{errorMessage}</p>
                </div>
            )}
        </motion.div>
    )
}

export default RequestFeature


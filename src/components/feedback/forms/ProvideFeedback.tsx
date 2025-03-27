"use client"

import type React from "react"
import { useState } from "react"
import { Button, Input, Textarea, Spacer } from "@heroui/react"
import { motion } from "framer-motion"

import { useUser } from "../auth/useUser"
import { useTranslations } from "../locales/getTranslations"
import { Disclaimer } from "../Disclaimer"
import SuccessView from "./success-view"
import FileInput from "./file-input"
import StarRating from "./star-rating"

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

const ProvideFeedback: React.FC = () => {
  const { user } = useUser()
  const { t, locale } = useTranslations("ProvideFeedback") // Get both translation function and locale
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [rating, setRating] = useState(0)
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [ticketNumber, setTicketNumber] = useState("")
  const app_name = process.env.NEXT_PUBLIC_APP_NAME || globalThis.location?.origin || "Not defined"

  const handleFileChange = (newFiles: File[]) => {
    setFiles(newFiles)
  }

  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
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
        type: "feedback", // Different type for feedback
        title,
        description,
        rating, // Include the rating in the submission
        location: window.location.href, // Current page as reference
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
        throw new Error(result.error || "Failed to submit feedback")
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
    setRating(0)
    setFiles([])
    setIsSuccess(false)
    setErrorMessage("")
    setTicketNumber("")
  }

  if (isSuccess) {
    return (
      <SuccessView
        title={t("successTitle") || "Feedback Received!"}
        message={
          t("successMessage") ||
          "Thank you for your feedback! We appreciate your input and will use it to improve our services."
        }
        buttonText={t("submitAnother") || "Submit More Feedback"}
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
      <h1 className="text-2xl font-bold">{t("title") || "Provide Feedback"}</h1>
      <p className="mb-3">
        {t("description") || "We value your feedback. Please fill out the form below to help us improve."}
      </p>
      <form onSubmit={handleSubmit}>
        <Input
          label={t("feedbackTitle") || "Feedback Title"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          fullWidth
        />
        <Spacer y={3} />

        {/* Star Rating Component */}
        <div className="mb-4">
          <StarRating
            value={rating}
            onChange={handleRatingChange}
            label={t("ratingLabel") || "How would you rate your experience?"}
            required
          />
        </div>
        <Spacer y={3} />

        <Textarea
          label={t("descriptionLabel") || "Description"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          fullWidth
        />
        <Spacer y={3} />
        <FileInput
          label={t("attachFiles") || "Add files (up to 20MB each)"}
          onChange={handleFileChange}
          multiple
          maxSize={20}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <Spacer y={3} />
        <Button
          type="submit"
          isLoading={isSubmitting}
          fullWidth
          color="primary"
          className="text-primary-foreground"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("submitting") || "Submitting..." : t("submitButton") || "Submit Feedback"}
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

export default ProvideFeedback


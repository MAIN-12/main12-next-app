"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button, Input, Textarea, Spacer, RadioGroup, Radio, Checkbox, Tooltip } from "@heroui/react"
import { motion } from "framer-motion"

import { useUser } from "../auth/useUser"
import { useTranslations } from "../locales/getTranslations"
import { Disclaimer } from "../Disclaimer"
import SuccessView from "./success-view"
import FileInput from "./file-input"
import feedbackConfig from "../feedback.config"
import { initConsoleCapture, getConsoleCapture, captureUncaughtErrors } from "../utils/console-capture"
import { parseUserAgent } from "../utils/user-agent-parser"
import { HelpCircleIcon } from "lucide-react"

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

const ReportBug: React.FC = () => {
  const { user } = useUser()
  const { t, locale } = useTranslations("ReportBug") // Get both translation function and locale
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isCurrentPage, setIsCurrentPage] = useState("yes")
  const [location, setLocation] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [ticketNumber, setTicketNumber] = useState("")
  const [includeConsoleLogs, setIncludeConsoleLogs] = useState(true)

  const app_name =
    feedbackConfig.appName || process.env.NEXT_PUBLIC_APP_NAME || globalThis.location?.origin || "Not defined"

  // Initialize console capture on component mount
  useEffect(() => {
    initConsoleCapture()
    captureUncaughtErrors()
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

      // Get console logs if enabled
      let consoleLogs = null
      if (includeConsoleLogs) {
        const consoleCapture = getConsoleCapture()
        consoleLogs = {
          logs: consoleCapture.getLogs(),
          text: consoleCapture.getLogsAsString(),
        }

        // Log to verify console logs are being captured
        console.log("Console logs captured:", consoleLogs.logs.length, "entries")
      }

      // Collect system info
      const systemInfo = feedbackConfig.collectSystemInfo
        ? {
          userAgent: navigator.userAgent,
          parsedUserAgent: parseUserAgent(navigator.userAgent),
          language: navigator.language,
          platform: navigator.platform,
          screenSize: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          timestamp: new Date().toISOString(),
        }
        : undefined

      // Log to verify system info is being collected
      if (systemInfo) {
        console.log("System info collected:", Object.keys(systemInfo))
      }

      // Create request body as JSON
      const requestBody = {
        app_name,
        type: "bug",
        title,
        description,
        location,
        user,
        files: fileData,
        console_logs: consoleLogs,
        system_info: systemInfo,
        client_timestamp: clientTimestamp,
        // Add form language information
        form_language: {
          locale: locale, // The locale used for the form
          browser_language: navigator.language, // The browser's language
          is_match: locale === navigator.language.split("-")[0], // Whether they match
        },
      }

      // Log the request body structure to verify all fields are present
      console.log("Request body structure:", Object.keys(requestBody))

      const response = await fetch(feedbackConfig.apiUrl, {
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
        throw new Error(result.error || "Failed to submit bug report")
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
    setIncludeConsoleLogs(true)

    // Clear console logs
    const consoleCapture = getConsoleCapture()
    consoleCapture.clearLogs()
  }

  if (isSuccess) {
    return (
      <SuccessView
        title={t("successTitle") || "Bug Report Submitted!"}
        message={
          t("successMessage") ||
          "Thank you for helping us improve our product. Our team will review your report and take appropriate action."
        }
        buttonText={t("reportAnother") || "Report Another Bug"}
        onReset={resetForm}
        type="bug"
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
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="mb-3">{t("description")}</p>
      <form onSubmit={handleSubmit}>
        <Spacer y={8} />
        <Input label={t("bugTitle")} value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
        <Spacer y={3} />
        <Textarea
          label={t("descriptionLabel")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          fullWidth
        />
        <Spacer y={8} />
        <RadioGroup
          label={t("currentPageQuestion")}
          value={isCurrentPage}
          onValueChange={setIsCurrentPage}
          orientation="horizontal"
        >
          <Radio value="yes">{t("yes")}</Radio>
          <Radio value="no">{t("no")}</Radio>
        </RadioGroup>
        <Spacer y={3} />
        {isCurrentPage === "no" && (
          <Input
            label={t("bugLocation")}
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
          maxSize={feedbackConfig.maxFileSize}
          accept={feedbackConfig.allowedFileTypes}
        />
        <Spacer y={8} />

        {/* Console logs option */}
        <div className="mb-4">
          <Checkbox isSelected={includeConsoleLogs} onValueChange={setIncludeConsoleLogs} color="primary" >
            <span className="text-sm">{t("includeConsoleLogs") || "Include browser console logs (recommended)"}
            </span>
          </Checkbox>
        </div>

        <Spacer y={3} />
        <Button
          type="submit"
          isLoading={isSubmitting}
          fullWidth
          color="primary"
          className="text-primary-foreground"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("submitting") : t("submitButton")}
        </Button>
        {feedbackConfig.showDisclaimer && <Disclaimer />}
      </form>
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          <p>{errorMessage}</p>
        </div>
      )}
    </motion.div>
  )
}

export default ReportBug


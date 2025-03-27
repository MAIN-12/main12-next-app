"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Trash2, X, Upload, Plus } from "lucide-react"
import { Button } from "@heroui/react"
import type { JSX } from "react/jsx-runtime"
import { useTranslations } from "../locales/getTranslations"
import feedbackConfig from "../feedback.config"

interface FileInputProps {
    label: string
    onChange: (files: File[]) => void
    multiple?: boolean
    maxSize?: number // in MB
    accept?: string
    removeIcon?: "trash" | "x"
    className?: string
}

const FileInput: React.FC<FileInputProps> = ({
    label,
    onChange,
    multiple = true,
    maxSize = feedbackConfig.maxFileSize, // Use config default
    accept = feedbackConfig.allowedFileTypes, // Use config default
    removeIcon = "trash",
    className = "",
}) => {
    const [errorMessage, setErrorMessage] = useState<string>("")
    const [files, setFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const t = useTranslations("FileInput")

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files)

            // Check if adding these files would exceed the maximum number of files
            if (files.length + newFiles.length > feedbackConfig.maxFiles) {
                setErrorMessage(`You can only upload a maximum of ${feedbackConfig.maxFiles} files.`)
                setTimeout(() => {
                    setErrorMessage("")
                }, 5000)
                return
            }

            const validFiles = newFiles.filter((file) => {
                const isValidSize = file.size <= maxSize * 1024 * 1024
                if (!isValidSize) {
                    setErrorMessage(
                        t("sizeExceeded", { fileName: file.name, maxSize }) ||
                        `File "${file.name}" exceeds the ${maxSize}MB size limit.`,
                    )
                }
                return isValidSize
            })

            const updatedFiles = [...files, ...validFiles]
            setFiles(updatedFiles)
            onChange(updatedFiles)

            if (newFiles.length !== validFiles.length) {
                setTimeout(() => {
                    setErrorMessage("")
                }, 5000) // Clear error after 5 seconds
            }

            // Reset the file input value so the same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    const removeFile = (index: number) => {
        const updatedFiles = files.filter((_, i) => i !== index)
        setFiles(updatedFiles)
        onChange(updatedFiles)
    }

    const clearFiles = () => {
        setFiles([])
        onChange([])
        // Reset file input by clearing its value
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const RemoveIcon = removeIcon === "trash" ? Trash2 : X

    return (
        <div className={`${className} space-y-3`}>
            <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    multiple={multiple}
                    accept={accept}
                    className="hidden"
                />

                {/* Custom button trigger */}
                <Button
                    type="button"
                    onPress={triggerFileInput}
                    variant="bordered"
                    className="flex items-center justify-center gap-2 w-full border-dashed"
                >
                    {files.length === 0 ? (
                        <>
                            <Upload size={16} />
                            <span>{multiple ? t("addFiles") : t("addFile")}</span>
                        </>
                    ) : (
                        <>
                            <Plus size={16} />
                            <span>{multiple ? t("addAnotherFile") : t("addDifferentFile")}</span>
                        </>
                    )}
                </Button>
            </div>

            {errorMessage && <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errorMessage}</p>}

            {files.length > 0 && (
                <>
                    <div className="flex justify-between items-center mt-2 mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {files.length} {files.length === 1 ? t("fileSelected") : t("filesSelected")}
                        </span>
                        <button
                            type="button"
                            onClick={clearFiles}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs flex items-center"
                        >
                            {t("clearAll")}
                        </button>
                    </div>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 mt-1 space-y-1 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2 dark:bg-gray-800">
                        {files.map((file, index) => (
                            <li
                                key={index}
                                className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                            >
                                <div className="flex items-center overflow-hidden">
                                    <div className="w-6 h-6 flex-shrink-0 mr-2">{getFileIcon(file.type)}</div>
                                    <span className="truncate" title={file.name}>
                                        {file.name} <span className="text-gray-400 dark:text-gray-500">({formatFileSize(file.size)})</span>
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
                                    aria-label="Remove file"
                                >
                                    <RemoveIcon size={16} />
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    )
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
}

// Helper function to get icon based on file type
const getFileIcon = (fileType: string): JSX.Element => {
    if (fileType.startsWith("image/")) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-500"
            >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
        )
    } else if (fileType.startsWith("video/")) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-purple-500"
            >
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                <line x1="7" y1="2" x2="7" y2="22"></line>
                <line x1="17" y1="2" x2="17" y2="22"></line>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="2" y1="7" x2="7" y2="7"></line>
                <line x1="2" y1="17" x2="7" y2="17"></line>
                <line x1="17" y1="17" x2="22" y2="17"></line>
                <line x1="17" y1="7" x2="22" y2="7"></line>
            </svg>
        )
    } else if (fileType.startsWith("application/pdf")) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-500"
            >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
        )
    } else {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-500"
            >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
        )
    }
}

export default FileInput


"use client"

import type React from "react"
import { Button } from "@heroui/react"
import { motion } from "framer-motion"
import { CheckCircle } from "lucide-react"
import { useTranslations } from "../locales/getTranslations"

interface SuccessViewProps {
    title: string
    message: string
    buttonText: string
    onReset: () => void
    type?: "bug" | "suggestion" | "support"
    ticketNumber?: string
}

const SuccessView: React.FC<SuccessViewProps> = ({
    title,
    message,
    buttonText,
    onReset,
    type = "bug",
    ticketNumber,
}) => {
    const t = useTranslations(type === "support" ? "Support" : type === "suggestion" ? "Suggestion" : "ReportBug")

    // Different colors based on feedback type
    const getIconColor = () => {
        switch (type) {
            case "bug":
                return "text-green-500"
            case "suggestion":
                return "text-blue-500"
            case "support":
                return "text-purple-500"
            default:
                return "text-green-500"
        }
    }

    return (
        <motion.div
            className="text-center py-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex justify-center mb-6">
                <CheckCircle size={80} className={`${getIconColor()}`} />
            </div>

            <h2 className="text-2xl font-bold mb-4">{title}</h2>
            <p className="text-gray-500 mb-4 max-w-md mx-auto">{message}</p>

            {ticketNumber && (
                <div className="mb-6">
                    <div className="bg-gray-100 rounded-md py-3 px-4 inline-block">
                        <p className="text-sm text-gray-500 mb-1">{t("ticketNumber") || "Ticket Number"}</p>
                        <p className="font-mono font-bold text-lg text-primary">{ticketNumber}</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                        {t("saveTicketReference") || "Please save this number for your reference"}
                    </p>
                </div>
            )}

            <Button color="primary" onClick={onReset} className="px-6 py-2 text-primary-foreground">
                {buttonText}
            </Button>
        </motion.div>
    )
}

export default SuccessView


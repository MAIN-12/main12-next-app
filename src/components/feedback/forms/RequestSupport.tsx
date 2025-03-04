"use client"

import React, { useState, useEffect } from "react"
import { Button, Input, Textarea, Spacer } from "@heroui/react"
import { motion } from "framer-motion"

import { useUser } from "../auth/useUser";
import { useTranslations } from "../locales/getTranslations";
import { Disclaimer } from "../Disclaimer"

const RequestSupport: React.FC = () => {
    const { user } = useUser();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isCurrentPage, setIsCurrentPage] = useState("yes");
    const [location, setLocation] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const t = useTranslations("RequestSupport");
    const type = "Support Request";
    const app_name = process.env.NEXT_PUBLIC_APP_NAME || globalThis.location?.origin || "Not defined";

    useEffect(() => {
        setLocation(window.location.href);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");

        const formData = new FormData();
        formData.append("app_name", app_name)
        formData.append("title", title);
        formData.append("description", description);
        formData.append("location", location);
        formData.append("type", type);
        if (user) {
            formData.append("user", JSON.stringify(user));
        }
        files.forEach(file => formData.append("files", file));

        try {
            const response = await fetch("/api/support/feedback", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                setSuccessMessage(t("successMessage"));
                if (result.fileUploads) {
                    const failedUploads = result.fileUploads.filter((upload: any) => !upload.success);
                    if (failedUploads.length > 0) {
                        setErrorMessage(`Some files failed to upload: ${failedUploads.map((u: any) => u.name).join(", ")}`);
                    }
                }
                resetForm();
            } else {
                throw new Error(result.error || "Failed to submit feature request");
            }
        } catch (error) {
            if (error instanceof Error) {
                setErrorMessage(`An error occurred: ${error.message}`);
            } else {
                setErrorMessage("An unknown error occurred. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setLocation(window.location.href);
        setIsCurrentPage("yes");
        setFiles([]);
        // Reset file input by clearing its value
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
    };

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
                <Input label={t("title")} value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
                <Spacer y={3} />
                <Textarea
                    label={t("descriptionLabel")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    fullWidth
                />

                <Spacer y={3} />
                <Button type="submit" isLoading={isSubmitting} fullWidth color="primary" className="text-primary-foreground">
                    {isSubmitting ? t("submitting") : t("submitButton")}
                </Button>
                <Disclaimer />
            </form>
            {successMessage && <p className="text-green-600 mt-4">{successMessage}</p>}
            {errorMessage && <p className="text-red-600 mt-4">{errorMessage}</p>}
        </motion.div>
    );
};

export default RequestSupport;
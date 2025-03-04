// components/SupportModal.tsx
import React, { useState } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button
} from "@heroui/react";

import { useTranslations } from "./locales/getTranslations";
import { BugReport, Lightbulb, Feedback, Help } from "./icons/SupportIcons";
import BackArrowIcon from './icons/BackArrow';
import ReportBug from "./forms/ReportBug";
import ProvideFeedback from "./forms/ProvideFeedback";
import RequestFeature from "./forms/RequestFeature";
import RequestSupport from "./forms/RequestSupport";

interface SupportModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onOpenChange }) => {
    const t = useTranslations('FeedBackModal');
    const [currentView, setCurrentView] = useState<string>("");

    const handleButtonClick = (view: string) => {setCurrentView(view);};
    const handleBackClick = () => {setCurrentView("");};

    const buttons = [
        {
            id: 'bug',
            icon: <BugReport />,
            label: t('reportBug'),
        },
        {
            id: 'feature',
            icon: <Lightbulb />,
            label: t('requestFeature'),
        },
        {
            id: 'feedback',
            icon: <Feedback />,
            label: t('provideFeedback'),
        },
        {
            id: 'Help',
            icon: <Help />,
            label: t('help'),
        },
    ];

    return (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} className="bg-light dark:bg-dark">
            <ModalContent>
                <ModalHeader className="flex flex-col">
                    {currentView !== "" ? (
                        <Button
                            onPress={handleBackClick}
                            variant="light"
                            isIconOnly
                        >
                            <BackArrowIcon />
                        </Button>
                    ) : (
                        <h2 className="text-2xl font-bold text-center">{t("title")}</h2>
                    )}
                </ModalHeader>
                <ModalBody>
                    {currentView === "" && (
                        <>
                            <p className="text-center mb-6">{t("intro")}</p>
                            <div className={`grid gap-4 ${buttons.length <= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                {buttons.map((button) => (
                                    <Button
                                        key={button.id}
                                        onPress={() => handleButtonClick(button.id)}
                                        className={`flex flex-col items-center justify-center h-20 w-full p-4 shadow-md transition-all duration-200 hover:shadow-lg ${buttons.length <= 3 ? 'aspect-[3/2]' : 'aspect-square'
                                            }`}
                                        variant="bordered"
                                    >
                                        <div className="flex flex-col items-center">
                                            {React.cloneElement(button.icon, { className: " text-3xl mb-2" })}
                                            <span className="text-center w-full break-words text-sm">{button.label}</span>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        </>
                    )}

                    {currentView === "bug" && (<ReportBug />)}
                    {currentView === "feature" && (<RequestFeature />)}
                    {currentView === "feedback" && (<ProvideFeedback />)}
                    {currentView === "Help" && (<RequestSupport />)}
                </ModalBody>
                <ModalFooter className="z-[1000] bg-light dark:bg-dark">
                    <p className="mt-3 text-sm text-center w-full">Powerd by <a href="https://main12.com" target="_blank" rel="noopener noreferrer" className="text-blue-500">Main 12 LLC</a></p>
                </ModalFooter>
            </ModalContent>
        </Modal >
    );
};

export default SupportModal;

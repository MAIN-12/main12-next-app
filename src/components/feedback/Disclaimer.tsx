import { useTranslations } from "./locales/getTranslations";

export const Disclaimer = () => {
    const t = useTranslations("disclaimer")

    return (
        <p className="text-xs text-gray-400 dark:text-gray-600 darck mt-6 text-justify">
            {t('text')} &nbsp;
            <a href="https://main12.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 font-bold">
                {t('company')}
            </a>.&nbsp;
            {t('moreInfo')} &nbsp;
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-500 font-bold">
                {t('privacyPolicy')}
            </a>&nbsp;
            {t('and')}&nbsp;
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-gray-500 font-bold">
                {t('termsOfService')}
            </a>.&nbsp;
            {t('contactInfo')}
        </p>
    );
};
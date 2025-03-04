import { useTranslations } from "./locales/getTranslations";

export const Disclaimer = () => {
    const t = useTranslations("disclaimer")

    return (
        <p className="text-xs mt-6">
            {t('text')} &nbsp;
            <a href="https://main12.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 font-bold">
                {t('company')}
            </a>.
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
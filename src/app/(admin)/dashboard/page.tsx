import QRCodeWithLogoAndDots from '@/components/qr-test';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('HomePage');
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      {/* <h1>{t("title")}</h1> */}

      <QRCodeWithLogoAndDots
        value="https://main12.com/"
        logoUrl="https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Pepsi_2023.svg/1200px-Pepsi_2023.svg.png"
      />

    </section>
  );
}
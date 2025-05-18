import QRCodeWithLogoAndDots from '@/components/qr-test';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('HomePage');
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      {/* <h1>{t("title")}</h1> */}

      <QRCodeWithLogoAndDots
        value="https://main12.com/"
        logoUrl="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRV03Ea6mRTpBzj1fo3Wqc2NriDiWkNGuE3jw&s"
      />

    </section>
  );
}
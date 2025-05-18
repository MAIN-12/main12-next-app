import QRCodeWithLogoAndDots from '@/components/qr-test';
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('HomePage');
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      {/* <h1>{t("title")}</h1> */}

      <QRCodeWithLogoAndDots
        value="https://main12.com/"
        logoUrl="https://99designs-blog.imgix.net/blog/wp-content/uploads/2022/06/Starbucks_Corporation_Logo_2011.svg-e1657703028844.png?auto=format&q=60&fit=max&w=930"
      />

    </section>
  );
}
"use client"
import React from "react";
import { QRCode } from 'react-qrcode-logo';

type LogoSize = "sm" | "md" | "lg";

interface QRProbes {
    size?: number;
    value: string;
    logoUrl: string;
    ecLevel?: "L" | "M" | "Q" | "H";
    logoSize?: LogoSize;
}

const logoPresets: Record<
    "L" | "M" | "Q" | "H",
    Record<LogoSize, { logoWidth: number; padding: number }>
> = {
    L: {
        sm: { logoWidth: 0.1, padding: 0.01 },
        md: { logoWidth: 0.15, padding: 0.025 },
        lg: { logoWidth: 0.19, padding: 0.01 },
    },
    M: {
        sm: { logoWidth: 0.1, padding: 0.01 },
        md: { logoWidth: 0.18, padding: 0.01 },
        lg: { logoWidth: 0.25, padding: 0.022 },
    },
    Q: {
        sm: { logoWidth: 0.1, padding: 0.01 },
        md: { logoWidth: 0.18, padding: 0.01 },
        lg: { logoWidth: 0.24, padding: 0.024 },
    },
    H: {
        sm: { logoWidth: 0.16, padding: 0.01 },
        md: { logoWidth: 0.21, padding: 0.019 },
        lg: { logoWidth: 0.26, padding: 0.026 },
    },
};

const QRCodeWithLogoAndDots = ({
    size = 200,
    value,
    logoUrl,
    ecLevel = "Q",
    logoSize = "md",
}: QRProbes) => {
    const preset = logoPresets[ecLevel][logoSize];
    const logoWidth = size * preset.logoWidth;
    const padding = size * preset.padding;

    return (
        <div className="p-2 rounded bg-white">
            <QRCode
                value={value}
                size={size}
                ecLevel={ecLevel}
                bgColor="white"
                qrStyle="dots"
                eyeRadius={12}
                logoImage={logoUrl}
                logoWidth={logoWidth}
                logoPadding={padding}
                removeQrCodeBehindLogo
                quietZone={10}
            />
        </div>
    );
};

export default QRCodeWithLogoAndDots;
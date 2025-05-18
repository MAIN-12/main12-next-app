"use client"
import React from "react";
import { QRCode } from 'react-qrcode-logo';

const QRCodeWithLogoAndDots = ({
    value,
    logoUrl,
}: {
    value: string;
    logoUrl: string;
}) => {

    const logoSize = 135

    const size = 500

    const QRVariants: { size?: number; ecLevel: "L" | "M" | "Q" | "H"; padding: number; logoWidth?: number }[] = [
        {
            ecLevel: "H",
            logoWidth: size * 0.2,
            padding: size * 0.02
        },
        {
            ecLevel: "H",
            logoWidth: 80,
            padding: 8
        },
        {
            ecLevel: "L",
            logoWidth: 80,
            padding: 12
        },

    ]

    const variant = 1

    return (
        <div className="p-3 rounded bg-white pb-32">
            <QRCode
                value={value}
                size={QRVariants[variant].size || size}
                ecLevel={QRVariants[variant].ecLevel} //L | M | Q | H
                // bgColor="#ffffff"
                // fgColor="#000000"
                qrStyle="dots"
                eyeRadius={24}
                // eyeColor="red"
                logoImage={logoUrl}
                logoWidth={QRVariants[variant].logoWidth}
                // logoHeight={logoSize}
                // logoOpacity={0.5}
                logoPadding={QRVariants[variant].padding}
                // logoPaddingStyle="circle" //square | circle
                removeQrCodeBehindLogo
            />
        </div>
    );
};

export default QRCodeWithLogoAndDots;

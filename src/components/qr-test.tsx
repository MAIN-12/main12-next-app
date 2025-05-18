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

    return (
        <div className="p-3 rounded bg-white pb-32">
            <QRCode
                value={value}
                size={500}
                ecLevel="H" //L | M | Q | H
                bgColor="#ffffff"
                fgColor="#000000"
                qrStyle="dots"
                eyeRadius={24}
                // eyeColor="red"
                logoImage={logoUrl}
                logoWidth={logoSize}
                // logoHeight={logoSize}
                // logoOpacity={0.5}
                logoPadding={10}
                // logoPaddingStyle="circle" //square | circle
                removeQrCodeBehindLogo
            />
        </div>
    );
};

export default QRCodeWithLogoAndDots;

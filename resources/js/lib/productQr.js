import QRCode from 'qrcode';

export async function createProductQrDownload(codeId, nfcUrl) {
    const dataUrl = await QRCode.toDataURL(nfcUrl, {
        width: 1024,
        margin: 3,
        errorCorrectionLevel: 'M',
        color: { dark: '#0B132B', light: '#FFFFFF' },
    });

    return { dataUrl, filename: `${codeId}-qr.png` };
}

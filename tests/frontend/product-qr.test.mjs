import assert from 'node:assert/strict';
import test from 'node:test';
import { createProductQrDownload } from '../../resources/js/lib/productQr.js';

test('generates a downloadable PNG QR from the unchanged NFC URL', async () => {
    const nfcUrl = 'https://app.shiftrix.io/?id=CARD-00001';
    const result = await createProductQrDownload('CARD-00001', nfcUrl);

    assert.equal(result.filename, 'CARD-00001-qr.png');
    assert.match(result.dataUrl, /^data:image\/png;base64,/);
    assert.ok(result.dataUrl.length > 1_000);
});

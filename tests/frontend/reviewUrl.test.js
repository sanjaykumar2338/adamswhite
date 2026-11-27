import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidGoogleReviewUrl } from '../../resources/js/lib/reviewUrl.js';

test('accepts supported Google Maps and Google Reviews URL formats', () => {
    const urls = [
        'https://g.page/r/AbCdEf123/review',
        'https://g.page/example-business/review?rc',
        'https://maps.app.goo.gl/AbCdEf123',
        'https://goo.gl/maps/AbCdEf123',
        'https://www.google.com/maps/place/Example/@48.1,2.3,17z',
        'https://maps.google.fr/maps?cid=123456789',
        'https://search.google.com/local/writereview?placeid=ChIJ123',
        'https://www.google.co.uk/local/writereview?placeid=ChIJ123',
    ];

    for (const url of urls) assert.equal(isValidGoogleReviewUrl(url), true, url);
});

test('rejects non-Google, SHIFTRIX, deceptive and unsafe URLs', () => {
    const urls = [
        'https://app.shiftrix.io/?id=CARD-00001',
        'https://shiftrix.io/products/CARD-00001',
        'https://google.com.evil.example/maps',
        'https://accounts.google.com/login',
        'https://www.google.com/',
        'https://maps.app.goo.gl/',
        'http://g.page/r/example/review',
        'https://user@g.page/r/example/review',
        'javascript:alert(1)',
    ];

    for (const url of urls) assert.equal(isValidGoogleReviewUrl(url), false, url);
});

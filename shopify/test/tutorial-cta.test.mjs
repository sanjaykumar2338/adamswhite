import assert from 'node:assert/strict';
import test from 'node:test';
import { applyActivationIdToTutorialCtas, preserveActivationId } from '../assets/shiftrix-preserve-activation-query.js';

test('adds the normalized product id to every Shiftrix Track CTA', () => {
    const links = [
        { href: 'https://app.shiftrix.io' },
        { href: 'https://app.shiftrix.io/?locale=fr' },
    ];

    assert.equal(preserveActivationId('?id=card-00001&utm_source=nfc', links), 2);
    assert.equal(links[0].href, 'https://app.shiftrix.io/?id=CARD-00001');
    assert.equal(links[1].href, 'https://app.shiftrix.io/?locale=fr&id=CARD-00001');
});

test('leaves CTAs unchanged when the product id is missing or invalid', () => {
    for (const search of ['', '?id=NOT-A-CODE', '?id=CARD-0001']) {
        const links = [{ href: 'https://app.shiftrix.io' }];

        assert.equal(preserveActivationId(search, links), 0);
        assert.equal(links[0].href, 'https://app.shiftrix.io');
    }
});

test('only updates the existing tutorial CTA selection and Shiftrix Track origin', () => {
    const selectedLinks = [
        { href: 'https://app.shiftrix.io/' },
        { href: 'https://example.com/untouched' },
    ];
    const documentObject = {
        querySelectorAll(selector) {
            assert.equal(selector, 'a.stx-cta-btn[href^="https://app.shiftrix.io"]');

            return selectedLinks;
        },
    };

    assert.equal(applyActivationIdToTutorialCtas(documentObject, { search: '?id=PLATE-00140' }), 1);
    assert.equal(selectedLinks[0].href, 'https://app.shiftrix.io/?id=PLATE-00140');
    assert.equal(selectedLinks[1].href, 'https://example.com/untouched');
});

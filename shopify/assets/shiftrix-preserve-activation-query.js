const PRODUCT_ID_PATTERN = /^(CARD|PLATE|STAND)-\d{5}$/;
const TRACK_ORIGIN = 'https://app.shiftrix.io';

export function preserveActivationId(search, links) {
    const params = new URLSearchParams(search);
    const productId = (params.get('id') || '').trim().toUpperCase();
    if (! PRODUCT_ID_PATTERN.test(productId)) return 0;

    let updated = 0;
    for (const link of links) {
        try {
            const target = new URL(link.href);
            if (target.origin !== TRACK_ORIGIN) continue;

            target.searchParams.set('id', productId);
            link.href = target.toString();
            updated++;
        } catch {
            // Ignore malformed or non-HTTP CTA targets without affecting the page.
        }
    }

    return updated;
}

export function applyActivationIdToTutorialCtas(documentObject = document, locationObject = window.location) {
    const links = documentObject.querySelectorAll('a.stx-cta-btn[href^="https://app.shiftrix.io"]');

    return preserveActivationId(locationObject.search, links);
}

const googleDomain = /^(?:(www|maps|search)\.)?google\.(com|[a-z]{2}|com\.[a-z]{2}|co\.[a-z]{2})$/;

export function isValidGoogleReviewUrl(value) {
    let url;

    try {
        url = new URL(value);
    } catch {
        return false;
    }

    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) {
        return false;
    }

    const host = url.hostname.toLowerCase();
    const path = url.pathname;

    if (host === 'g.page') {
        return /^\/(?:r\/[^/]+\/review|[^/]+(?:\/review)?)\/*$/i.test(path);
    }

    if (host === 'maps.app.goo.gl') {
        return /^\/[A-Za-z0-9_-]+\/*$/.test(path);
    }

    if (host === 'goo.gl') {
        return /^\/maps\/[A-Za-z0-9_-]+\/*$/.test(path);
    }

    const match = host.match(googleDomain);
    if (!match) return false;

    if (match[1] === 'search') {
        return /^\/local\/writereview\/?$/i.test(path) && Boolean(url.search);
    }

    if (match[1] === 'maps') {
        return path === '/' || path.toLowerCase().startsWith('/maps');
    }

    return /^\/(?:maps(?:\/|$)|local\/writereview\/?$)/i.test(path);
}

export function isShiftrixProductUrl(value) {
    try {
        const url = new URL(value);
        return url.hostname.toLowerCase() === 'app.shiftrix.io' && url.searchParams.has('id');
    } catch {
        return false;
    }
}

export function validateGoogleReviewUrl(form, message, productUrlMessage = message) {
    if (isValidGoogleReviewUrl(form.data.google_review_url)) {
        form.clearErrors('google_review_url');
        return true;
    }

    form.setError('google_review_url', isShiftrixProductUrl(form.data.google_review_url) ? productUrlMessage : message);
    return false;
}

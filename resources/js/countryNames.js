export function countryName(code, locale, unknownLabel) {
    if (!code || code === 'unknown') {
        return unknownLabel;
    }

    try {
        return new Intl.DisplayNames([locale], { type: 'region' }).of(code) || code;
    } catch {
        return code;
    }
}

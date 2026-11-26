export function chartDateFormatter(locale) {
    const formatter = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    });

    return (value) => normalizeFrenchAbbreviation(formatter.format(new Date(value)), locale);
}

export function shortWeekday(value, locale) {
    const label = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        weekday: 'short',
        timeZone: 'UTC',
    }).format(new Date(value));
    const normalized = normalizeFrenchAbbreviation(label, locale);

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function normalizeFrenchAbbreviation(value, locale) {
    return locale === 'fr' ? value.replace(/\.$/, '') : value;
}

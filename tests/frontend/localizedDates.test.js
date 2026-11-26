import assert from 'node:assert/strict';
import test from 'node:test';

import { chartDateFormatter, shortWeekday } from '../../resources/js/lib/localizedDates.js';

test('chart dates follow English and French application locales', () => {
    const date = Date.UTC(2026, 9, 27);

    assert.equal(chartDateFormatter('en')(date), 'Oct 27');
    assert.equal(chartDateFormatter('fr')(date), '27 oct');
});

test('French weekday abbreviations are localized and presentation ready', () => {
    assert.equal(shortWeekday(Date.UTC(2026, 10, 15), 'fr'), 'Dim');
    assert.equal(shortWeekday(Date.UTC(2026, 10, 16), 'fr'), 'Lun');
    assert.equal(shortWeekday(Date.UTC(2026, 10, 17), 'fr'), 'Mar');
    assert.equal(shortWeekday(Date.UTC(2026, 10, 15), 'en'), 'Sun');
});

import assert from 'node:assert/strict';
import test from 'node:test';

import { dashboardWelcomeKey } from '../../resources/js/lib/customerExperience.js';

test('business accounts receive the business welcome', () => {
    assert.equal(dashboardWelcomeKey('business'), 'dashboard.welcome_business');
});

test('individual accounts receive the creator welcome', () => {
    assert.equal(dashboardWelcomeKey('individual'), 'dashboard.welcome_individual');
});

test('existing unsegmented accounts retain the original welcome', () => {
    assert.equal(dashboardWelcomeKey(null), 'dashboard.welcome_back');
});

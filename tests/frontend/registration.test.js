import assert from 'node:assert/strict';
import test from 'node:test';

import { isBusinessNameRequired } from '../../resources/js/lib/registration.js';

test('business and unselected registrations require a business name', () => {
    assert.equal(isBusinessNameRequired('business'), true);
    assert.equal(isBusinessNameRequired(''), true);
});

test('individual and creator registrations make the business name optional', () => {
    assert.equal(isBusinessNameRequired('individual'), false);
});

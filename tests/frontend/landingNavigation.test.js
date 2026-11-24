import assert from 'node:assert/strict';
import test from 'node:test';

import { landingNavigation } from '../../resources/js/lib/landingNavigation.js';

test('guest navigation points to sign in', () => {
    assert.deepEqual(landingNavigation(null), {
        routeName: 'login',
        labelKey: 'auth.login',
    });
});

test('customer navigation points to the customer dashboard', () => {
    assert.deepEqual(landingNavigation({ is_admin: false }), {
        routeName: 'dashboard',
        labelKey: 'nav.dashboard',
    });
});

test('admin navigation points to the admin dashboard', () => {
    assert.deepEqual(landingNavigation({ is_admin: true }), {
        routeName: 'admin.dashboard',
        labelKey: 'nav.dashboard',
    });
});

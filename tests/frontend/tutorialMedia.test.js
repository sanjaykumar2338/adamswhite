import assert from 'node:assert/strict';
import test from 'node:test';

import { pauseAndReset } from '../../resources/js/lib/mediaControls.js';

test('pauses and rewinds the previous tutorial before loading another source', () => {
    const calls = [];
    const player = {
        currentTime: 18,
        pause: () => calls.push('pause'),
        load: () => calls.push('load'),
    };

    pauseAndReset(player);

    assert.deepEqual(calls, ['pause', 'load']);
    assert.equal(player.currentTime, 0);
});

test('does nothing when no tutorial video is mounted', () => {
    assert.doesNotThrow(() => pauseAndReset(null));
});

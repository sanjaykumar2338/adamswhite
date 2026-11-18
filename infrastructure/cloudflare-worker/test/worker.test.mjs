import assert from 'node:assert/strict';
import test from 'node:test';
import { proxyRequest } from '../src/worker.mjs';

const env = { SHIFTRIX_ORIGIN: 'https://app.shiftrix.io', EDGE_SHARED_SECRET: 'test-secret' };

test('preserves every query parameter and returns the Laravel redirect unchanged', async () => {
    let fetchCount = 0;
    const response = await proxyRequest(new Request('https://shiftrix.io/configuration?id=CARD-00001&utm_source=nfc&campaign=launch'), env, async (request) => {
        fetchCount++;
        assert.equal(request.url, 'https://app.shiftrix.io/configuration?id=CARD-00001&utm_source=nfc&campaign=launch');
        assert.equal(request.redirect, 'manual');
        assert.equal(request.headers.get('X-Forwarded-Host'), 'shiftrix.io');
        assert.equal(request.headers.get('X-Shiftrix-Edge'), 'test-secret');
        assert.match(request.headers.get('X-Shiftrix-Request-Id'), /^[0-9a-f-]{36}$/i);

        return new Response(null, { status: 302, headers: { Location: 'https://g.page/r/example/review' } });
    });

    assert.equal(fetchCount, 1);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), 'https://g.page/r/example/review');
});

test('supports HEAD and normalizes the optional trailing slash', async () => {
    const response = await proxyRequest(new Request('https://shiftrix.io/configuration/?id=PLATE-00140', { method: 'HEAD' }), env, async (request) => {
        assert.equal(request.method, 'HEAD');
        assert.equal(request.url, 'https://app.shiftrix.io/configuration?id=PLATE-00140');

        return new Response(null, { status: 302, headers: { Location: 'https://shiftrix.io/pages/how-to-configure?id=PLATE-00140' } });
    });

    assert.equal(response.status, 302);
});

test('does not forward storefront cookies or accept a caller supplied request id', async () => {
    const response = await proxyRequest(new Request('https://shiftrix.io/configuration?id=STAND-00280', {
        headers: {
            Cookie: 'private-shopify-session=value',
            'X-Shiftrix-Request-Id': 'caller-controlled',
        },
    }), env, async (request) => {
        assert.equal(request.headers.get('Cookie'), null);
        assert.notEqual(request.headers.get('X-Shiftrix-Request-Id'), 'caller-controlled');

        return new Response(null, { status: 302, headers: { Location: 'https://g.page/r/example/review', 'Set-Cookie': 'origin=value' } });
    });

    assert.equal(response.headers.get('Set-Cookie'), null);
});

test('rejects non-configuration paths and methods without contacting Laravel', async () => {
    const neverFetch = async () => {
        assert.fail('Laravel origin must not be contacted');
    };

    for (const path of ['/products/card', '/', '/login', '/configuration/invalid', '/configuration-extra']) {
        assert.equal((await proxyRequest(new Request(`https://shiftrix.io${path}`), env, neverFetch)).status, 404);
    }

    const response = await proxyRequest(new Request('https://shiftrix.io/configuration?id=CARD-00001', { method: 'POST' }), env, neverFetch);
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('Allow'), 'GET, HEAD');
});

test('fails closed for unsafe or missing origin configuration', async () => {
    const request = new Request('https://shiftrix.io/configuration?id=CARD-00001');

    assert.equal((await proxyRequest(request, { ...env, SHIFTRIX_ORIGIN: 'http://app.shiftrix.io' })).status, 500);
    assert.equal((await proxyRequest(request, { ...env, EDGE_SHARED_SECRET: '' })).status, 500);
    assert.equal((await proxyRequest(request, { ...env, SHIFTRIX_ORIGIN: 'not-a-url' })).status, 500);
});

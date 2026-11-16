import assert from 'node:assert/strict';
import test from 'node:test';
import { proxyRequest } from '../src/worker.mjs';

const env = { SHIFTRIX_ORIGIN: 'https://staging-app.shiftrix.io', EDGE_SHARED_SECRET: 'test-secret' };

test('preserves product query and manual 302 redirect', async () => {
    const response = await proxyRequest(new Request('https://shiftrix.io/configuration?id=CARD-00001'), env, async (request) => {
        assert.equal(request.url, 'https://staging-app.shiftrix.io/configuration?id=CARD-00001');
        assert.equal(request.redirect, 'manual');
        assert.equal(request.headers.get('X-Forwarded-Host'), 'shiftrix.io');
        assert.equal(request.headers.get('X-Shiftrix-Edge'), 'test-secret');
        return new Response(null, { status: 302, headers: { Location: 'https://g.page/r/example/review' } });
    });
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('Location'), 'https://g.page/r/example/review');
});

test('preserves POST body for activation and rejects Shopify paths', async () => {
    const activation = new Request('https://shiftrix.io/saas/activations', { method: 'POST', body: 'code_id=CARD-00001' });
    const response = await proxyRequest(activation, env, async (request) => {
        assert.equal(await request.text(), 'code_id=CARD-00001');
        return new Response('ok');
    });
    assert.equal(await response.text(), 'ok');
    assert.equal((await proxyRequest(new Request('https://shiftrix.io/products/card'), env, async () => new Response('bad'))).status, 404);
});

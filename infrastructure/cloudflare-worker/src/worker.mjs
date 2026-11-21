function isAllowed(pathname) {
    return pathname === '/configuration' || pathname === '/configuration/';
}

function originUrl(value, allowHttp) {
    try {
        const origin = new URL(value);
        if ((origin.protocol !== 'https:' && allowHttp !== 'true') || origin.username || origin.password) {
            return null;
        }

        return origin;
    } catch {
        return null;
    }
}

function upstreamHeaders(request, incoming, secret) {
    const headers = new Headers();
    for (const name of ['Accept', 'Accept-Language', 'Referer', 'User-Agent']) {
        const value = request.headers.get(name);
        if (value) headers.set(name, value);
    }

    const clientIp = request.headers.get('CF-Connecting-IP');
    if (clientIp) headers.set('X-Forwarded-For', clientIp);

    const country = request.headers.get('CF-IPCountry');
    if (country && /^[A-Z]{2}$/i.test(country)) headers.set('X-Shiftrix-Country', country.toUpperCase());

    headers.set('X-Forwarded-Host', incoming.host);
    headers.set('X-Forwarded-Proto', 'https');
    headers.set('X-Shiftrix-Edge', secret);
    headers.set('X-Shiftrix-Request-Id', crypto.randomUUID());

    return headers;
}

export async function proxyRequest(request, env, fetcher = fetch) {
    const incoming = new URL(request.url);
    if (! isAllowed(incoming.pathname)) {
        return fetcher(request);
    }
    if (! ['GET', 'HEAD'].includes(request.method)) {
        return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }

    const origin = originUrl(env.SHIFTRIX_ORIGIN, env.ALLOW_HTTP_ORIGIN);
    if (! env.EDGE_SHARED_SECRET || ! origin) {
        return new Response('Invalid origin configuration', { status: 500 });
    }
    origin.pathname = '/configuration';
    origin.search = incoming.search;

    const upstreamRequest = new Request(origin, {
        method: request.method,
        headers: upstreamHeaders(request, incoming, env.EDGE_SHARED_SECRET),
        redirect: 'manual',
    });

    const upstreamResponse = await fetcher(upstreamRequest);
    const response = new Response(upstreamResponse.body, upstreamResponse);
    response.headers.delete('Set-Cookie');

    return response;
}

export default { fetch: proxyRequest };

const ALLOWED_PATHS = [
    '/configuration', '/saas', '/build/', '/images/products/',
];

function isAllowed(pathname) {
    return ALLOWED_PATHS.some((path) => path.endsWith('/') ? pathname.startsWith(path) : pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxyRequest(request, env, fetcher = fetch) {
    const incoming = new URL(request.url);
    if (! isAllowed(incoming.pathname)) {
        return new Response('Not found', { status: 404 });
    }

    const origin = new URL(env.SHIFTRIX_ORIGIN);
    if (! env.EDGE_SHARED_SECRET || (origin.protocol !== 'https:' && env.ALLOW_HTTP_ORIGIN !== 'true')) {
        return new Response('Invalid origin configuration', { status: 500 });
    }
    origin.pathname = incoming.pathname;
    origin.search = incoming.search;

    const headers = new Headers(request.headers);
    headers.set('X-Forwarded-Host', incoming.host);
    headers.set('X-Forwarded-Proto', 'https');
    headers.set('X-Shiftrix-Edge', env.EDGE_SHARED_SECRET);

    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();
    const upstreamRequest = new Request(origin, {
        method: request.method,
        headers,
        body,
        redirect: 'manual',
    });

    return fetcher(upstreamRequest);
}

export default { fetch: proxyRequest };

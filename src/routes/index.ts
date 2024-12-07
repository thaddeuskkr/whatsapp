import { stripIndents } from 'common-tags';
import type { Route } from '../types';

export const route: Route = {
    url: '/',
    async request({ request, server, version }) {
        return new Response(stripIndents`
            wweb-api v${version} by thaddeuskkr
            https://github.com/thaddeuskkr/whatsapp

            Your IP address is ${(request.headers.get('x-forwarded-for') || server.requestIP(request)?.address) ?? 'unknown'}
        `, { status: 200 });
    },
};

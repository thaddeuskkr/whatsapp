import { stripIndents } from 'common-tags';
import type { Route } from '../types';

export const route: Route = {
    url: '/',
    async request({ request, server, version, client, token }) {
        if (request.method === 'GET') {
            return new Response(stripIndents`
                wweb-api v${version} by thaddeuskkr
                https://github.com/thaddeuskkr/whatsapp

                Your IP address is ${(request.headers.get('x-forwarded-for') || server.requestIP(request)?.address) ?? 'unknown'}
            `, { status: 200 });
        } else if (request.method === 'POST') {
            if (request.headers.get('authorization') !== token) return new Response('Unauthorized', { status: 401 });
            let body;
            try {
                body = await request.json();
            } catch {
                return new Response('Bad request', { status: 400 });
            }
            if (['to', 'from'].some((key) => !body[key])) return new Response('Missing required fields', { status: 400 });
            try {
                await client.sendMessage(`${body.to}@c.us`, body.message);
            } catch (error) {
                return new Response(
                    JSON.stringify({
                        status: 400,
                        message: `Failed to send message to ${body.to}`,
                        sent_message: body.message,
                        error: error,
                        to: body.to,
                        from: body.from,
                    }),
                    { status: 400 },
                );
            }
            return new Response(
                JSON.stringify({
                    status: 200,
                    message: `Message successfully sent to ${body.to}`,
                    sent_message: body.message,
                    to: body.to,
                    from: body.from,
                }),
                { status: 200 },
            );
        } else {
            return new Response('Method not allowed', { status: 405 });
        }
    },
};

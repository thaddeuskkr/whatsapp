import type { Route } from '../types';

export const route: Route = {
    url: '/message',
    async request({ request, client, token }) {
        if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
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
            return new Response(JSON.stringify({
                status: 400,
                message: `Failed to send message to ${body.to}`,
                sent_message: body.message,
                error: error,
                to: body.to,
                from: body.from,
            }), { status: 400 });
        }
        return new Response(JSON.stringify({
            status: 200,
            message: `Message successfully sent to ${body.to}`,
            sent_message: body.message,
            to: body.to,
            from: body.from,
        }), { status: 200 });
    },
};

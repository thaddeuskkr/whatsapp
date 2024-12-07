import { stripIndents } from 'common-tags';
import moment from 'moment';
import crypto from 'node:crypto';
import type { Route } from '../types';

export const route: Route = {
    url: '/otp',
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
        const otp = (!body.otp || body.otp === 'random') ? String(crypto.randomInt(0, 1_000_000)).padStart(6, '0') : body.otp;
        try {
            await client.sendMessage(`${body.to}@c.us`, stripIndents`
                *${otp}* is your one-time password for ${body.from}.
                Do not share this OTP with anyone.
                ${body.validity ? `Valid for ${moment.duration(Number(body.validity), 'seconds').asMinutes()} minutes.` : ''}
            `);
        } catch (error) {
            return new Response(JSON.stringify({
                status: 400,
                message: `Failed to send OTP to ${body.to}`,
                error: error,
                to: body.to,
                from: body.from,
                otp,
            }), { status: 400 });
        }
        return new Response(JSON.stringify({
            status: 200,
            message: `OTP sent to ${body.to}`,
            to: body.to,
            from: body.from,
            otp,
        }), { status: 200 });
    },
};

import Pino from 'pino';
import qrcode from 'qrcode-terminal';
import { Client, LocalAuth } from 'whatsapp-web.js';

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    authStrategy: new LocalAuth({
        dataPath: 'data',
    }),
});

client.logger = Pino();

Bun.serve({
    port: 4567,
    development: process.env.NODE_ENV !== 'production',
    fetch: async (request) => {
        const url = new URL(request.url);
        switch (url.pathname) {
            case '/': {
                return new Response('Hello, world!');
            }
            case '/send': {
                const to = url.searchParams.get('to');
                const message = url.searchParams.get('message');
                if (!to || !message) {
                    return new Response('Missing "to" or "message" query parameter', { status: 400 });
                }
                await client.sendMessage(to, message);
                return new Response('Message sent');
            }
            default: {
                return new Response(`Not found: ${url.pathname}`, { status: 404 });
            }
        }
    },
});

client.logger.info('Initialising client...');

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true }, (code) => {
        client.logger.info('Scan this QR code on WhatsApp on your phone to login:');
        for (const c of code.split('\n')) client.logger.info(c);
    });
});

client.on('authenticated', () => {
    client.logger.info('Client authenticated!');
});

client.on('auth_failure', (message) => {
    client.logger.error('Authentication failed:', message);
});

client.once('ready', () => {
    client.logger.info('Client is ready!');
});

client.initialize();

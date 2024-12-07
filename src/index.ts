import crypto from 'node:crypto';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import Pino from 'pino';
import qrcode from 'qrcode-terminal';
import { Client, LocalAuth, type ClientOptions } from 'whatsapp-web.js';
import type { Route } from './types';

const packageJson = Bun.file(path.join(import.meta.dir, '..', 'package.json'));
const json = await packageJson.json();
const version = json.version;

let puppeteer_arguments: ClientOptions['puppeteer'] = {
    headless: false,
};

if (process.env.HEADLESS?.toLowerCase() === 'true') {
    puppeteer_arguments = {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
    };
}

const client = new Client({
    puppeteer: puppeteer_arguments,
    authStrategy: new LocalAuth({
        dataPath: 'data',
    }),
});

client.logger = Pino();
client.ready = false;
const token = process.env.TOKEN || crypto.randomBytes(8).toString('hex');

const routes = new Map();

const routesRaw = await readdir(path.join(import.meta.dir, 'routes'), { withFileTypes: true, recursive: true });
const routeFiles = routesRaw.filter((dirent) => dirent.isFile() && (dirent.name.endsWith('.js') || dirent.name.endsWith('.ts')));
for (const file of routeFiles) {
    const module = await import(path.join(import.meta.dir, 'routes', file.name)) as { route: Route };
    routes.set(module.route.url, module.route);
}

Bun.serve({
    port: 4567,
    development: process.env.NODE_ENV !== 'production',
    fetch: async (request, server) => {
        if (!client.ready) return new Response('Server not ready for requests', { status: 503 });
        const url = new URL(request.url);
        const route = routes.get(url.pathname);
        return route ? route.request({ client, server, request, url, version, token }) : new Response(`Not found: ${url.pathname}`, { status: 404 });
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

client.on('disconnected', (reason) => {
    client.logger.error('Client disconnected:', reason);
    client.ready = false;
});

client.on('ready', () => {
    client.logger.info('Client is ready!');
    client.logger.warn('Routes that require authentication will need the following token in the Authorization header:');
    client.logger.warn(`${token}`);
    client.ready = true;
});

client.initialize();

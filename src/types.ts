import type pino from 'pino';

declare module 'whatsapp-web.js' {
    interface Client {
        logger: pino.Logger
    }
}
import type { Server } from 'bun';
import type pino from 'pino';
import type { Client } from 'whatsapp-web.js';

declare module 'whatsapp-web.js' {
    interface Client {
        logger: pino.Logger;
        ready: boolean;
    }
}

export type Route = {
    url: string;
    request: ({ request, server, version }: {
        client: Client;
        request: Request;
        server: Server;
        version: string;
        token: string;
    }) => Response | Promise<Response>;
};

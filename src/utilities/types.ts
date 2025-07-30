import type pino from 'pino';
import type { Op } from './constants';

declare module 'whatsapp-web.js' {
    interface Client {
        logger: pino.Logger;
    }
}

export interface MessageT {
    op?: Op;
    message?: string;
    data?: Record<string, any>;
}

import type { Logger } from 'pino';
import type { Message } from 'whatsapp-web.js';

async function messageCreate(message: Message, logger: Logger): Promise<void> {
    // Anything you want here will be executed when a message is created (by self or others)
}

export { messageCreate };

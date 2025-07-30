import type { Logger } from 'pino';
import type { Message } from 'whatsapp-web.js';

async function messageEdit(message: Message, logger: Logger): Promise<void> {
    // Anything you want here will be executed when a message is edited
}

export { messageEdit };

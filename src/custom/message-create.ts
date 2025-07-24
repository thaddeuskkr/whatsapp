import type { Message } from 'whatsapp-web.js';

async function messageCreate(message: Message): Promise<void> {
	// Anything you want here will be executed when a message is created
}

export { messageCreate };

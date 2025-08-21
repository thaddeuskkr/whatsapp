import type { Logger } from 'pino';
import encodeQR from 'qr';
import type { Client } from 'whatsapp-web.js';
import { Message } from '../utilities/models.ts';
import { connections } from '../routes/index.ts';
import { Op } from '../utilities/constants.ts';
import { messageCreate } from '../custom/message-create.ts';
import { messageEdit } from '../custom/message-edit.ts';
import { messageDelete } from '../custom/message-delete.ts';

const IGNORE_MESSAGES_FROM = ['0@c.us', 'status@broadcast'];
const IGNORE_MESSAGE_TYPES = ['e2e_notification', 'notification_template'];

const initializeEvents = (whatsapp: Client, logger: Logger) => {
    whatsapp.once('ready', () => {
        whatsapp.logger.info('Ready');
    });

    whatsapp.on('qr', (qr) => {
        broadcast({
            op: Op.QrCode,
            message: 'Authentication required',
            data: {
                qr,
            },
        });
        const qrc = encodeQR(qr, 'ascii', { scale: 1 });
        qrc.split('\n').forEach((line) => {
            whatsapp.logger.info(line);
        });
    });

    whatsapp.on('authenticated', () => {
        broadcast({
            op: Op.Authenticated,
            message: 'Authentication successful',
        });
        whatsapp.logger.info('Authentication successful');
    });

    whatsapp.on('auth_failure', (message) => {
        whatsapp.logger.error(`Authentication failed${message ? `: ${message}` : ''}`);
    });

    whatsapp.on('message_create', async (message) => {
        if (IGNORE_MESSAGES_FROM.includes(message.from) || IGNORE_MESSAGE_TYPES.includes(message.type)) {
            return;
        }

        const created = await Message.insertOne({
            ack: message.ack,
            author: message.author,
            body: message.body,
            broadcast: message.broadcast,
            deviceType: message.deviceType,
            duration: message.duration,
            forwardingScore: message.forwardingScore,
            from: message.from,
            fromMe: message.fromMe,
            groupMentions: message.groupMentions,
            hasMedia: message.hasMedia,
            hasQuotedMsg: message.hasQuotedMsg,
            hasReaction: message.hasReaction,
            wId: message.id._serialized,
            isEphemeral: message.isEphemeral,
            isForwarded: message.isForwarded,
            isGif: message.isGif,
            isStarred: message.isStarred,
            isStatus: message.isStatus,
            links: message.links,
            location: message.location,
            mediaKey: message.mediaKey,
            mentionedIds: message.mentionedIds,
            timestamp: message.timestamp * 1000,
            to: message.to,
            type: message.type,
            vCards: message.vCards,
        });
        if (created) {
            whatsapp.logger.trace(
                `Message ${message.id._serialized} saved to database with ID ${created._id.toString()}`
            );
        } else {
            whatsapp.logger.error('Failed to save message to database');
        }

        broadcast({
            op: Op.MessageCreate,
            message: 'Message created',
            data: {
                id: created._id,
                wId: created.wId,
                from: created.from,
                to: created.to,
                timestamp: created.timestamp,
            },
        });

        await messageCreate(message, logger);

        whatsapp.logger.debug(`Message created: ${message.id._serialized} from ${message.from}`);
    });

    whatsapp.on('message_edit', async (message) => {
        const dbMessage = await Message.findOne({ wId: message.id._serialized });
        if (!dbMessage) {
            whatsapp.logger.warn(`Message ${message.id._serialized} edited but not found in database`);
            return;
        }

        dbMessage.body = message.body;
        dbMessage.latestEditSenderTimestamp = new Date(message.latestEditSenderTimestampMs!);
        dbMessage.latestEditMsgKey = message.latestEditMsgKey!._serialized;
        await dbMessage.save();

        broadcast({
            op: Op.MessageEdit,
            message: 'Message edited',
            data: {
                id: dbMessage._id,
                wId: dbMessage.wId,
                from: dbMessage.from,
                to: dbMessage.to,
                timestamp: dbMessage.latestEditSenderTimestamp,
            },
        });

        await messageEdit(message, logger);

        whatsapp.logger.debug(`Message edited: ${message.id._serialized} from ${message.from}`);
    });

    whatsapp.on('message_revoke_everyone', async (message) => {
        const dbMessage = await Message.findOne({
            wId: (message as unknown as { _data: { protocolMessageKey: { _serialized: string } } })._data
                .protocolMessageKey._serialized,
        });
        if (!dbMessage) {
            whatsapp.logger.warn(`Message ${message.id._serialized} revoked but not found in database`);
            return;
        }

        if (dbMessage.type === 'revoked') {
            whatsapp.logger.warn(`Message ${message.id._serialized} already revoked`);
            return;
        }

        dbMessage.type = message.type;
        // dbMessage.body = message.body || ''; // I'm not sure if I should clear the body here
        await dbMessage.save();

        broadcast({
            op: Op.MessageRevoke,
            message: 'Message revoked',
            data: {
                id: dbMessage._id,
                wId: dbMessage.wId,
                from: dbMessage.from,
                to: dbMessage.to,
                timestamp: dbMessage.updatedAt,
            },
        });

        await messageDelete(message, logger);

        whatsapp.logger.debug(`Message revoked: ${message.id._serialized} from ${message.from}`);
    });

    logger.trace('WhatsApp events initialized');
};

export { initializeEvents as initializeWhatsAppEvents };

function broadcast(message: Record<any, any>) {
    for (const ws of connections.values()) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
}

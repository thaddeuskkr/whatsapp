import { t } from 'elysia';
import type { Server } from '../index.ts';
import { Message } from '../utilities/models.ts';

const route = (app: Server) =>
    app.post(
        '',
        async ({ status, headers: { authorization }, store: { auth }, body }) => {
            if (!authorization && auth.length > 0) {
                return status(401, { success: false, error: 'No token provided' });
            }

            if (authorization) {
                authorization = authorization.split(' ')[1] ?? authorization;

                if (!auth.includes(authorization)) {
                    return status(401, { success: false, error: 'Invalid token' });
                }
            }

            const { lastMessageId, from } = body;

            let newMessages;
            let editedMessages;
            let deletedMessages;

            let newMessagesFilter: any = {};
            let editedMessagesFilter: any = { latestEditSenderTimestamp: { $exists: true } };
            let deletedMessagesFilter: any = { type: 'revoked' };

            if (from && typeof from === 'string' && from.length > 0) {
                newMessagesFilter.from = from;
                editedMessagesFilter.from = from;
                deletedMessagesFilter.from = from;
            }

            if (lastMessageId && typeof lastMessageId === 'string' && lastMessageId.length > 0) {
                const lastMessage = await Message.findOne({ _id: lastMessageId });
                if (!lastMessage) {
                    return status(404, { success: false, error: 'Invalid last message ID' });
                }

                newMessagesFilter = { timestamp: { $gt: lastMessage.timestamp } };
                editedMessagesFilter = { latestEditSenderTimestamp: { $gt: lastMessage.timestamp } };
                deletedMessagesFilter = { type: 'revoked', updatedAt: { $gt: lastMessage.timestamp } };

                newMessages = await Message.find(newMessagesFilter);
                editedMessages = await Message.find(editedMessagesFilter);
                deletedMessages = await Message.find(deletedMessagesFilter);
            } else {
                newMessages = await Message.find(newMessagesFilter).sort({ timestamp: -1 }).limit(100);
                editedMessages = await Message.find(editedMessagesFilter)
                    .sort({ latestEditSenderTimestamp: -1 })
                    .limit(100);
                deletedMessages = await Message.find(deletedMessagesFilter).sort({ updatedAt: -1 }).limit(100);
            }

            if (newMessages.length === 0 && editedMessages.length === 0 && deletedMessages.length === 0) {
                return {
                    success: true,
                    data: {
                        messageCount: 0,
                        new: [],
                        edited: [],
                        deleted: [],
                    },
                };
            }

            return {
                success: true,
                data: {
                    messageCount: newMessages.length + editedMessages.length + deletedMessages.length,
                    new: newMessages,
                    edited: editedMessages,
                    deleted: deletedMessages,
                },
            };
        },
        {
            body: t.Object({
                lastMessageId: t.Optional(t.String()),
                from: t.Optional(t.String()),
            }),
        }
    );

export default route;

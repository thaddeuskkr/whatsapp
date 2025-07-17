import { t } from 'elysia';
import type { Server } from '../index.ts';
import { Message } from '../utilities/models.ts';

const route = (app: Server) => app.post('', async ({ status, headers: { authorization }, store: { auth }, body }) => {
	if (!authorization && auth.length > 0) {
		return status(401, { success: false, error: 'No token provided' });
	}

	if (authorization) {
		authorization = authorization.split(' ')[1] ?? authorization;

		if (!auth.includes(authorization)) {
			return status(401, { success: false, error: 'Invalid token' });
		}
	}

	const { lastMessageId } = body;

	let newMessages;
	let editedMessages;
	let deletedMessages;

	if (lastMessageId && typeof lastMessageId === 'string' && lastMessageId.length > 0) {
		const lastMessage = await Message.findOne({ _id: lastMessageId });
		if (!lastMessage) {
			return status(404, { success: false, error: 'Invalid last message ID' });
		}

		newMessages = await Message.find({ timestamp: { $gt: lastMessage.timestamp } });
		editedMessages = await Message.find({ latestEditSenderTimestamp: { $gt: lastMessage.timestamp } });
		deletedMessages = await Message.find({ type: 'revoked', updatedAt: { $gt: lastMessage.timestamp } });
	} else {
		newMessages = await Message.find({}).sort({ timestamp: -1 }).limit(100);
		editedMessages = await Message.find({ latestEditSenderTimestamp: { $exists: true } }).sort({ latestEditSenderTimestamp: -1 }).limit(100);
		deletedMessages = await Message.find({ type: 'revoked' }).sort({ updatedAt: -1 }).limit(100);
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
}, {
	body: t.Object({
		lastMessageId: t.Optional(t.String()),
	}),
});

export default route;

import mongoose from 'mongoose';

const tokensSchema = new mongoose.Schema({
	token: { type: String, required: true },
	expiresAt: { type: Date, required: true },
}, {
	collection: 'tokens',
	timestamps: true,
});

const messageSchema = new mongoose.Schema({ // https://docs.wwebjs.dev/Message.html
	ack: { type: Number, required: true }, // ACK status for the message
	author: { type: String, required: false }, // If the message was sent to a group, this field will contain the user that sent the message.
	body: { type: String, required: false }, // Message content
	broadcast: { type: Boolean, required: false }, // Indicates if the message was a broadcast
	deviceType: { type: String, required: false }, // String that represents from which device type the message was sent
	duration: { type: String, required: false }, // Indicates the duration of the message in seconds
	forwardingScore: { type: Number, required: false }, // Indicates how many times the message was forwarded. The maximum value is 127.
	from: { type: String, required: true }, // ID for the Chat that this message was sent to, except if the message was sent by the current user.
	fromMe: { type: Boolean, required: true }, // Indicates if the message was sent by the current user
	groupMentions: { type: [{ subject: String, id: String }], required: true }, // Indicates whether there are group mentions in the message body
	hasMedia: { type: Boolean, required: true }, // Indicates if the message has media available for download
	hasQuotedMsg: { type: Boolean, required: true }, // Indicates if the message was sent as a reply to another message
	hasReaction: { type: Boolean, required: true }, // Indicates whether there are reactions to the message
	wId: { type: String, required: true }, // ID that represents the message
	isEphemeral: { type: Boolean, required: false }, // Indicates if the message will disappear after it expires
	isForwarded: { type: Boolean, required: false }, // Indicates if the message was forwarded
	isGif: { type: Boolean, required: false }, // Indicates if the message is a GIF
	isStarred: { type: Boolean, required: true }, // Indicates if the message was starred
	isStatus: { type: Boolean, required: true }, // Indicates if the message is a status update
	latestEditSenderTimestamp: { type: Date, required: false }, // Timestamp of the latest edit to the message
	latestEditMsgKey: { type: String, required: false }, // Key of the latest edit to the message
	links: { type: [{ link: String, isSuspicious: Boolean }], required: true }, // Links included in the message
	location: {
		type: {
			address: String, description: String, latitude: Number, longitude: Number, name: String, url: String,
		},
		required: false,
	}, // Location information contained in the message, if the message is type "location"
	mediaKey: { type: String, required: false }, // MediaKey that represents the sticker 'ID'
	mentionedIds: { type: [String], required: true }, // Indicates the mentions in the message body.
	timestamp: { type: Date, required: true }, // Timestamp for when the message was created
	to: { type: String, required: true }, // ID for who this message is for. If the message is sent by the current user, it will be the Chat to which the message is being sent. If the message is sent by another user, it will be the ID for the current user.
	type: { type: String, required: true }, // Type of the message. https://docs.wwebjs.dev/global.html#MessageTypes
	vCards: { type: [String], required: true }, // List of vCards contained in the message
}, {
	collection: 'messages',
	timestamps: true,
});

const Tokens = mongoose.model('Tokens', tokensSchema);
const Message = mongoose.model('Message', messageSchema);

export { Tokens, Message };

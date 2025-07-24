import type { ElysiaWS } from 'elysia/ws';
import { type Server } from '../index.ts';
import type { MessageT } from '../utilities/types.ts';
import { Op } from '../utilities/constants.ts';
import { Tokens, Message } from '../utilities/models.ts';

const connections = new Set<ElysiaWS>();
const heartbeatTimeouts = new Map<string, NodeJS.Timeout>();

const route = (app: Server) =>
	app
		.get('', async () => 'Hello!')
		.ws('', {
			async beforeHandle({ query, status, store: { auth } }) {
				if (auth.length > 0) {
					const { token } = query;
					if (!token) {
						return status(400, {
							success: false,
							error: 'No WebSocket connection token provided',
						});
					}

					const dbToken = await Tokens.findOne({
						token,
						expiresAt: { $gt: new Date() },
					});
					if (!dbToken) {
						return status(401, {
							success: false,
							error: 'Invalid or expired WebSocket connection token',
						});
					}

					await dbToken.deleteOne(dbToken._id);
				}
			},
			async open(ws) {
				ws.send(JSON.stringify({
					op: Op.Open,
					message: 'Connection established successfully',
				}));

				connections.add(ws);

				setInterval(() => {
					if (ws.readyState !== WebSocket.OPEN) {
						return;
					}

					if (!ws.id) {
						return ws.send(JSON.stringify({
							op: Op.Error,
							message: 'Connection ID not found',
						}));
					}

					ws.send(JSON.stringify({
						op: Op.Heartbeat,
						message: 'Expecting heartbeat response within 5 seconds',
					}));
					const timeout = setTimeout(() => {
						if (ws.readyState === WebSocket.OPEN) {
							ws.close(1000, 'No heartbeat response received');
						}
					}, 5 * 1000);
					heartbeatTimeouts.set(ws.id as string, timeout);
				}, 30 * 1000);
			},
			async close(ws, code, reason) {
				connections.delete(ws);
				ws.close(code, reason ?? 'Connection closed by server');
			},
			async message(ws, message: MessageT) {
				if (
					typeof message !== 'object'
					|| message === null
					|| Array.isArray(message)
				) {
					return ws.send(JSON.stringify({
						op: Op.Error,
						message: 'Message cannot be parsed as JSON',
					}));
				}

				if (!('op' in message) || typeof message.op !== 'number') {
					return ws.send(JSON.stringify({
						op: Op.Error,
						message: 'Message must contain a valid operation (op) code',
					}));
				}

				switch (message.op as Op | unknown) {
					case Op.Heartbeat: {
						if (!ws.id) {
							return ws.send(JSON.stringify({
								op: Op.Error,
								message: 'Connection ID not found',
							}));
						}

						const heartbeat = heartbeatTimeouts.get(ws.id as string);
						if (heartbeat) {
							clearTimeout(heartbeat);
						}

						heartbeatTimeouts.delete(ws.id as string);
						break;
					}

					case Op.Error: {
						break;
					}

					case Op.Open: {
						break;
					}

					case Op.Close: {
						if ('reason' in message && typeof message.reason === 'string') {
							ws.close(1000, message.reason);
						} else {
							ws.close(1000, 'Connection closed by client');
						}

						break;
					}

					case Op.MessageCreate: {
						break;
					}

					case Op.MessageEdit: {
						break;
					}

					case Op.MessageRevoke: {
						break;
					}

					default: {
						return ws.send(JSON.stringify({
							op: Op.Error,
							message: `Unknown operation code: ${message.op}`,
						}));
					}
				}
			},
		});

export default route;
export { connections };

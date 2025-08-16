import { t } from 'elysia';
import type { Server } from '../index.ts';
import { MessageMedia } from 'whatsapp-web.js';

const route = (app: Server) =>
    app.post(
        '',
        async ({ status, headers: { authorization }, store: { auth }, body, whatsapp }) => {
            if (!authorization && auth.length > 0) {
                return status(401, { success: false, error: 'No token provided' });
            }

            if (authorization) {
                authorization = authorization.split(' ')[1] ?? authorization;

                if (!auth.includes(authorization)) {
                    return status(401, { success: false, error: 'Invalid token' });
                }
            }

            const { to, content, linkPreview, quotedMessageId, mentions } = body;

            const parseImageTags = (text: string): { cleanContent: string; imageUrl: string | null } => {
                const imageTagRegex = /\{img:(https?:\/\/[^\}]+)\}/g;

                const firstMatch = imageTagRegex.exec(text);
                const imageUrl = firstMatch && firstMatch[1] ? firstMatch[1] : null;

                const cleanContent = text.replace(/\{img:(https?:\/\/[^\}]+)\}/g, '').trim();

                return { cleanContent, imageUrl };
            };

            const { cleanContent, imageUrl } = parseImageTags(content);

            try {
                const message = await whatsapp.sendMessage(to, cleanContent, {
                    linkPreview,
                    quotedMessageId,
                    mentions,
                    media: imageUrl ? await MessageMedia.fromUrl(imageUrl) : undefined,
                });
                return {
                    success: true,
                    message: 'Message sent successfully',
                    data: {
                        from: message.from,
                        to: message.to,
                        content: message.body,
                    },
                };
            } catch (error) {
                return status(400, { success: false, error: 'Failed to send message', details: error });
            }
        },
        {
            body: t.Object({
                to: t.String({ description: 'The recipient of the message' }),
                content: t.String({ description: 'The content of the message' }),
                linkPreview: t.Optional(t.Boolean({ description: 'Whether to include a link preview' })),
                quotedMessageId: t.Optional(t.String({ description: 'The ID of the message to quote' })),
                mentions: t.Optional(
                    t.Array(t.String(), { description: 'An array of user IDs to mention in the message' })
                ),
            }),
        }
    );

export default route;

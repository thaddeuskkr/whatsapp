import { randomBytes } from 'node:crypto';
import { Elysia } from 'elysia';
import { autoload } from 'elysia-autoload';
import pino from 'pino';
import { Client, LocalAuth } from 'whatsapp-web.js';
import mongoose from 'mongoose';
import { initializeWhatsAppEvents } from './events/whatsapp.ts';
import { initializeMongooseEvents } from './events/database.ts';
import { Tokens } from './utilities/models.ts';

export const logger = pino({
    name: 'main',
    level: Bun.env.LOG_LEVEL ?? 'info',
});

const auth = Bun.env.AUTH?.split(',').map((t) => t.trim()) ?? [];
if (auth.length === 0) {
    const token = randomBytes(24).toString('hex');
    logger.warn(`No token(s) provided in environment variable AUTH. Use "${token}" to authenticate.`);
    auth.push(token);
}

if (auth.length === 1 && (auth[0] === 'off' || auth[0] === 'false')) {
    logger.warn('Authentication is disabled. This is not recommended for production environments.');
    auth.length = 0;
}

initializeMongooseEvents(mongoose, logger);

try {
    await mongoose.connect(Bun.env.MONGODB_URI ?? 'mongodb://localhost:27017/whatsapp', {
        dbName: Bun.env.MONGODB_DB ?? 'whatsapp',
    });
} catch (error) {
    logger.error('Failed to make initial connection to MongoDB');
    logger.error(error);
    throw error;
}

const whatsapp = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: Bun.env.HEADLESS !== 'false',
    },
    authStrategy: new LocalAuth({
        dataPath: '.whatsapp',
    }),
});

whatsapp.logger = pino({
    name: 'whatsapp',
    level: Bun.env.LOG_LEVEL ?? 'info',
});

setInterval(async () => {
    const deleted = await Tokens.deleteMany({ expiresAt: { $lt: new Date() } });
    if (deleted.deletedCount > 0) {
        logger.debug(`Removed ${deleted.deletedCount} expired tokens`);
    }
}, 60 * 1000);

const host = Bun.env.HOST ?? '0.0.0.0';
const port = Bun.env.PORT ? Number.parseInt(Bun.env.PORT, 10) : 3000;

const app = new Elysia()
    .onAfterResponse(({ set, path, server, request }) => {
        logger.debug(
            `${request.method} ${path} ${set.status} | ${request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? server?.requestIP(request)?.address}`
        );
    })
    .state('auth', auth)
    .decorate('logger', logger)
    .decorate('whatsapp', whatsapp)
    .use(
        // always load this last
        await autoload({
            dir: './routes',
        })
    )
    .listen(
        {
            hostname: host,
            port,
        },
        () => {
            logger.info(`Server listening at ${host}:${port}`);
        }
    );

initializeWhatsAppEvents(whatsapp, logger);

await whatsapp.initialize();

export type Server = typeof app;

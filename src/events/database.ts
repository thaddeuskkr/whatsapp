import type { Mongoose } from 'mongoose';
import type { Logger } from 'pino';

const initializeEvents = (mongoose: Mongoose, logger: Logger) => {
	mongoose.connection.on('connecting', () => {
		logger.debug('Connecting to MongoDB');
	});
	mongoose.connection.on('connected', () => {
		logger.debug('Connected to MongoDB');
	});
	mongoose.connection.on('open', () => {
		logger.info('Database connection opened');
	});
	mongoose.connection.on('disconnecting', () => {
		logger.debug('Disconnecting from MongoDB...');
	});
	mongoose.connection.on('disconnected', () => {
		logger.info('Disconnected from MongoDB');
	});
	mongoose.connection.on('reconnected', () => {
		logger.info('Reconnected to MongoDB');
	});
	mongoose.connection.on('error', error => {
		logger.error('MongoDB connection error');
		logger.error(error);
	});
	logger.trace('Mongoose events initialized');
};

export { initializeEvents as initializeMongooseEvents };

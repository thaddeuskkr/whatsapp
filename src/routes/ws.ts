import { randomBytes } from 'node:crypto';
import type { Server } from '../index.ts';
import { Tokens } from '../utilities/models.ts';

const route = (app: Server) => app.get('', async ({ status, headers: { authorization }, store: { auth } }) => {
	if (!authorization) {
		return status(401, { success: false, error: 'No token provided' });
	}

	if (auth.length === 0) {
		return status(401, { success: false, error: 'Authentication is disabled' });
	}

	authorization = authorization.split(' ')[1] ?? authorization;

	if (!auth.includes(authorization)) {
		return status(401, { success: false, error: 'Invalid token' });
	}

	const token = randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + (5 * 60 * 1000));

	const existingToken = await Tokens.findOne({ token });
	if (existingToken) {
		return status(500, { success: false, error: 'Token generation failed, please try again' });
	}

	const inserted = await Tokens.insertOne({ token, expiresAt });
	if (!inserted) {
		return status(500, { success: false, error: 'Token generation failed, please try again' });
	}

	return {
		success: true,
		data: { token: inserted.token, expiresAt: inserted.expiresAt },
	};
});

export default route;

import type { Server } from '../index.ts';

const route = (app: Server) =>
    app.post('', async ({ status, headers: { authorization }, store: { auth }, whatsapp }) => {
        if (!authorization && auth.length > 0) {
            return status(401, { success: false, error: 'No token provided' });
        }

        if (authorization) {
            authorization = authorization.split(' ')[1] ?? authorization;

            if (!auth.includes(authorization)) {
                return status(401, { success: false, error: 'Invalid token' });
            }
        }

        return {
            success: true,
            wid: whatsapp.info.wid,
        };
    });

export default route;

import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './db/prisma.js';
import './queues/evaluation.worker.js';

const start = async () => {
    try {
        await prisma.$connect();
        console.log('PostgreSQL connected successfully via Prisma');

        app.listen(env.PORT, () => {
            console.log(
                `Skillora Backend running on http://localhost:${env.PORT}`
            );
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

start();

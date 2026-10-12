import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { applicantRoutes } from './modules/applicant/applicant.routes.js';
import { recruiterRoutes } from './modules/recruiter/recruiter.routes.js';
import { publicRoutes } from './modules/public/public.routes.js';

export const app = express();

app.use(helmet());
app.use(
    cors({
        origin: env.CLIENT_URL,
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/applicant', applicantRoutes);
app.use('/api/v1/recruiter', recruiterRoutes);
app.use('/api/v1/public', publicRoutes);

app.use(errorHandler);

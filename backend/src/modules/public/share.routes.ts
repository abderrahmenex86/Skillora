import { Router } from 'express';
import { env } from '../../config/env.js';
import { getPublicPosition } from './public.service.js';

const router = Router();

function escapeHtml(value: string): string {
    return value.replace(
        /[&<>"']/g,
        (character) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[character] ?? character
    );
}

function pageShell(title: string, body: string): string {
    return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
    </head>
    <body>
        ${body}
    </body>
</html>`;
}

router.get('/jobs/:id', async (req, res, next) => {
    try {
        const position = await getPublicPosition(String(req.params.id));

        if (!position) {
            res.status(404)
                .type('html')
                .send(
                    pageShell(
                        'Job not found — Skillora',
                        `<main style="font-family: sans-serif; max-width: 640px; margin: 10vh auto; padding: 24px;">
                            <p style="font-family: monospace; text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px; color: #666;">Skillora</p>
                            <h1 style="font-size: 32px; margin: 8px 0 12px;">This role is no longer available.</h1>
                            <p style="color: #555; line-height: 1.6;">The job may have been removed or the link may be out of date.</p>
                            <p><a href="${escapeHtml(env.CLIENT_URL)}/jobs" style="color: #111;">Browse open roles</a></p>
                        </main>`
                    )
                );
            return;
        }

        const closed =
            position.status !== 'OPEN' ||
            new Date(position.deadline).getTime() <= Date.now();
        const shareOrigin = (
            env.PUBLIC_SHARE_ORIGIN ?? env.CLIENT_URL
        ).replace(/\/$/, '');
        const jobUrl = `${env.CLIENT_URL}/jobs/${position.id}`;
        const shareUrl = `${shareOrigin}/share/jobs/${position.id}`;
        const imageUrl = `${env.CLIENT_URL}/og/skillora-og.png`;
        const title = `${position.title} at ${position.companyName} — Skillora`;
        const baseDescription =
            closed ?
                `Applications are closed for ${position.title} at ${position.companyName}. Browse open roles on Skillora.`
            :   position.description?.trim() ||
                `${position.department} · ${position.location}. Apply on Skillora and get a verified outcome.`;
        const description =
            baseDescription.length > 220 ?
                `${baseDescription.slice(0, 217).trimEnd()}…`
            :   baseDescription;

        res.set('Cache-Control', 'public, max-age=300')
            .type('html')
            .send(`<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
        <meta name="description" content="${escapeHtml(description)}" />
        <link rel="canonical" href="${escapeHtml(jobUrl)}" />
        <meta name="robots" content="index,follow" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Skillora" />
        <meta property="og:title" content="${escapeHtml(title)}" />
        <meta property="og:description" content="${escapeHtml(description)}" />
        <meta property="og:url" content="${escapeHtml(shareUrl)}" />
        <meta property="og:image" content="${escapeHtml(imageUrl)}" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${escapeHtml(title)}" />
        <meta name="twitter:description" content="${escapeHtml(description)}" />
        <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
        <meta http-equiv="refresh" content="0;url=${escapeHtml(jobUrl)}" />
    </head>
    <body>
        <main style="font-family: sans-serif; max-width: 640px; margin: 10vh auto; padding: 24px;">
            <p style="font-family: monospace; text-transform: uppercase; letter-spacing: 0.12em; font-size: 12px; color: #666;">Skillora</p>
            <h1 style="font-size: 32px; margin: 8px 0 12px;">${escapeHtml(position.title)}</h1>
            <p style="color: #555; line-height: 1.6;">${escapeHtml(position.companyName)} · ${escapeHtml(position.location)}</p>
            <p style="color: #555; line-height: 1.6;">${escapeHtml(description)}</p>
            <p><a href="${escapeHtml(jobUrl)}" style="color: #111;">View this job on Skillora</a></p>
        </main>
    </body>
</html>`);
    } catch (error) {
        next(error);
    }
});

export const shareRoutes = router;

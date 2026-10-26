import { z } from 'zod';
import { prisma } from '../db/prisma.js';

export const IngestionOutputSchema = z.object({
    anonymousId: z.string(),
    domain: z.enum(['tech', 'legal', 'finance', 'operations', 'other']),
    yearsOfExperience: z.number().min(0),
    educationLevel: z.string(),
    extractedSkills: z.array(z.string()),
    verifiableArtifacts: z.array(
        z.object({
            type: z.enum([
                'repo',
                'case_brief',
                'bar_license',
                'certification',
                'portfolio',
                'degree',
            ]),
            title: z.string(),
            summary: z.string(),
            metrics: z.record(z.string(), z.any()),
        })
    ),
});

export type IngestionOutput = z.infer<typeof IngestionOutputSchema>;

export class IngestionAgent {
    async run(
        applicationId: string,
        profile: {
            title: string;
            summary: string | null;
            skills: string[];
            metadata?: any;
        },
        anonymousId: string
    ): Promise<IngestionOutput> {
        const rawInput = { profile, anonymousId };

        const lowerTitle = profile.title.toLowerCase();
        let domain: IngestionOutput['domain'] = 'other';
        if (
            lowerTitle.includes('engineer') ||
            lowerTitle.includes('dev') ||
            lowerTitle.includes('cloud') ||
            lowerTitle.includes('data')
        ) {
            domain = 'tech';
        } else if (
            lowerTitle.includes('law') ||
            lowerTitle.includes('legal') ||
            lowerTitle.includes('juriste') ||
            lowerTitle.includes('avocat')
        ) {
            domain = 'legal';
        } else if (
            lowerTitle.includes('finance') ||
            lowerTitle.includes('accounting') ||
            lowerTitle.includes('comptable')
        ) {
            domain = 'finance';
        }

        const education =
            profile.metadata?.education || 'Diplôme Supérieur (Non spécifié)';
        const experience = Number(profile.metadata?.yearsOfExperience || 2);

        const verifiableArtifacts: IngestionOutput['verifiableArtifacts'] = [];

        if (profile.metadata?.githubRepos) {
            profile.metadata.githubRepos.forEach((repo: any) => {
                verifiableArtifacts.push({
                    type: 'repo',
                    title: repo.name || 'Artifact Repo',
                    summary: repo.description || 'Public technical repository',
                    metrics: {
                        languages: repo.language || 'Unknown',
                        testsPresent: Boolean(repo.testsPresent),
                        ciCdPassed: Boolean(repo.ciCdPassed),
                    },
                });
            });
        }

        if (profile.metadata?.barLicense) {
            verifiableArtifacts.push({
                type: 'bar_license',
                title: 'Certificat d’Aptitude à la Profession d’Avocat (CAPA)',
                summary: 'Admitted to the National Bar Association',
                metrics: {
                    verified: true,
                    wilaya: profile.metadata.barWilaya || 'Alger',
                },
            });
        }

        const output: IngestionOutput = {
            anonymousId,
            domain,
            yearsOfExperience: experience,
            educationLevel: education,
            extractedSkills: profile.skills,
            verifiableArtifacts,
        };

        await prisma.agentExecutionLog.create({
            data: {
                applicationId,
                agentType: 'ingestion',
                modelUsed: 'heuristic-normalizer-v1',
                promptTokens: 120,
                outputTokens: 180,
                rawInput,
                structuredOutput: output,
            },
        });

        return output;
    }
}

export const ingestionAgent = new IngestionAgent();

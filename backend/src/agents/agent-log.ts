import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';

export type AgentType = 'ingestion' | 'matcher' | 'growth' | 'coordinator';

interface AgentLogInput {
    applicationId: string;
    agentType: AgentType;
    modelUsed: string;
    usage?: {
        inputTokens?: number | null;
        outputTokens?: number | null;
    };
    rawInput: unknown;
    structuredOutput: unknown;
}

export async function logAgentExecution({
    applicationId,
    agentType,
    modelUsed,
    usage,
    rawInput,
    structuredOutput,
}: AgentLogInput): Promise<void> {
    await prisma.agentExecutionLog.create({
        data: {
            applicationId,
            agentType,
            modelUsed,
            promptTokens: usage?.inputTokens ?? 0,
            outputTokens: usage?.outputTokens ?? 0,
            rawInput: rawInput as Prisma.InputJsonValue,
            structuredOutput: structuredOutput as Prisma.InputJsonValue,
        },
    });
}

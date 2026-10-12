import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { useAuthStore } from '../../store/useAuthStore';
import { Plus, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfilesView() {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);

    const [title, setTitle] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [summary, setSummary] = useState('');
    const [skillsStr, setSkillsStr] = useState('');
    const [formError, setFormError] = useState('');

    const { data: profiles, isLoading } = useQuery({
        queryKey: ['applicant-profiles'],
        queryFn: async () => {
            const { data } = await apiClient.get('/applicant/profiles');
            return data.profiles;
        },
    });

    const createProfileMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await apiClient.post(
                '/applicant/profiles',
                payload
            );
            return data.profile;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applicant-profiles'] });
            setTitle('');
            setResumeUrl('');
            setSummary('');
            setSkillsStr('');
            setFormError('');
        },
        onError: (err: any) => {
            setFormError(
                err.response?.data?.error || 'Failed to create profile'
            );
        },
    });

    const deleteProfileMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/applicant/profiles/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applicant-profiles'] });
        },
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        const skills = skillsStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        createProfileMutation.mutate({
            title,
            resumeUrl,
            summary,
            skills,
        });
    };

    const isFreeLimitReached =
        user?.subscriptionTier === 'FREE' && (profiles?.length ?? 0) >= 1;

    return (
        <div className='flex-1 max-w-5xl w-full mx-auto px-6 py-8'>
            <div className='flex justify-between items-center mb-8 border-b border-(--border-line) pb-6'>
                <div>
                    <span className='font-mono text-xs text-(--text-sub) uppercase tracking-wider block mb-1'>
                        [PERSONA MANAGEMENT]
                    </span>
                    <h1 className='font-grotesque font-extrabold text-4xl text-(--text-main) tracking-tight'>
                        Applicant Profiles
                    </h1>
                </div>
                <div className='font-mono text-xs px-3 py-1.5 rounded border border-(--border-line) bg-(--bg-panel)'>
                    TIER: {user?.subscriptionTier}
                </div>
            </div>

            {isFreeLimitReached && (
                <div className='mb-8 p-4 border border-(--border-line) bg-(--bg-panel) rounded-md flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        <AlertCircle
                            size={18}
                            className='text-(--text-sub)'
                        />
                        <p className='text-xs text-(--text-main)'>
                            Free Plan is limited to 1 active profile. Upgrade to
                            Pro for multi-profile personas (e.g., Data Engineer
                            and Pen Tester).
                        </p>
                    </div>
                    <Link
                        to='/pricing'
                        className='px-3 py-1.5 bg-(--btn-main-bg) text-(--btn-main-text) text-xs font-semibold rounded hover:opacity-90'>
                        Upgrade to Pro
                    </Link>
                </div>
            )}

            <div className='grid grid-cols-1 md:grid-cols-12 gap-8 items-start'>
                <div className='md:col-span-5 border border-(--border-line) rounded-lg p-6 bg-(--bg-canvas)'>
                    <h3 className='font-grotesque font-bold text-2xl text-(--text-main) mb-4 flex items-center gap-2'>
                        <Plus size={18} /> Add New Persona
                    </h3>

                    {formError && (
                        <div className='mb-4 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded'>
                            {formError}
                        </div>
                    )}

                    <form
                        onSubmit={handleCreate}
                        className='space-y-4'>
                        <input
                            type='text'
                            required
                            disabled={isFreeLimitReached}
                            placeholder='Title (e.g. Corporate Lawyer, DevOps)'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main) disabled:opacity-50'
                        />
                        <input
                            type='url'
                            required
                            disabled={isFreeLimitReached}
                            placeholder='Resume / Portfolio Document URL'
                            value={resumeUrl}
                            onChange={(e) => setResumeUrl(e.target.value)}
                            className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main) disabled:opacity-50'
                        />
                        <input
                            type='text'
                            required
                            disabled={isFreeLimitReached}
                            placeholder='Skills (comma-separated: Docker, Linux, CI/CD)'
                            value={skillsStr}
                            onChange={(e) => setSkillsStr(e.target.value)}
                            className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main) disabled:opacity-50'
                        />
                        <textarea
                            rows={3}
                            disabled={isFreeLimitReached}
                            placeholder='Summary & Key Strengths'
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main) disabled:opacity-50'
                        />

                        <button
                            type='submit'
                            disabled={
                                isFreeLimitReached ||
                                createProfileMutation.isPending
                            }
                            className='w-full py-2.5 bg-(--btn-main-bg) text-(--btn-main-text) text-xs font-mono uppercase tracking-wider rounded font-semibold hover:opacity-90 disabled:opacity-50'>
                            {createProfileMutation.isPending ?
                                'Saving...'
                            :   'Create Profile'}
                        </button>
                    </form>
                </div>

                <div className='md:col-span-7 space-y-4'>
                    <h3 className='font-grotesque font-bold text-2xl text-(--text-main) mb-2'>
                        Configured Personas ({profiles?.length ?? 0})
                    </h3>

                    {isLoading ?
                        <div className='text-xs text-(--text-sub)'>
                            Loading profiles...
                        </div>
                    : profiles?.length === 0 ?
                        <div className='p-8 border border-dashed border-(--border-line) text-center text-xs text-(--text-sub) rounded'>
                            No profiles found. Create your first profile to
                            apply to roles.
                        </div>
                    :   profiles?.map((p: any) => (
                            <div
                                key={p.id}
                                className='p-5 border border-(--border-line) rounded-md bg-(--bg-canvas) space-y-3'>
                                <div className='flex justify-between items-start'>
                                    <div>
                                        <h4 className='font-grotesque font-bold text-2xl text-(--text-main)'>
                                            {p.title}
                                        </h4>
                                        <a
                                            href={p.resumeUrl}
                                            target='_blank'
                                            rel='noreferrer'
                                            className='text-xs text-(--text-sub) underline font-mono'>
                                            View Linked Document
                                        </a>
                                    </div>
                                    <button
                                        onClick={() =>
                                            deleteProfileMutation.mutate(p.id)
                                        }
                                        className='p-1.5 text-(--text-sub) hover:text-red-600 rounded transition-colors'>
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {p.summary && (
                                    <p className='text-xs text-(--text-sub)'>
                                        {p.summary}
                                    </p>
                                )}

                                <div className='flex flex-wrap gap-1 text-xs font-mono text-(--text-sub)'>
                                    {p.skills.map((s: string) => (
                                        <span
                                            key={s}
                                            className='px-2 py-0.5 border border-(--border-line) rounded'>
                                            [{s}]
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}

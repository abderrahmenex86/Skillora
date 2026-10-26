import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { useAuthStore } from '../../store/useAuthStore';
import {
    FolderPlus,
    GraduationCap,
    Briefcase,
    Layers,
    Plus,
    Trash2,
    AlertCircle,
    Sparkles,
    ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfilesView() {
    const queryClient = useQueryClient();
    const user = useAuthStore((state) => state.user);

    const [activeTab, setActiveTab] = useState<'personas' | 'vault'>(
        'personas'
    );

    // Vault Project Modal / Form State
    const [projectTitle, setProjectTitle] = useState('');
    const [projectUrl, setProjectUrl] = useState('');
    const [projectDate, setProjectDate] = useState('');
    const [projectTags, setProjectTags] = useState('');
    // Multiple narrative descriptions
    const [angle1Label, setAngle1Label] = useState(
        'Core Architecture / Systems'
    );
    const [angle1Text, setAngle1Text] = useState('');
    const [angle2Label, setAngle2Label] = useState(
        'AI & Machine Learning Focus'
    );
    const [angle2Text, setAngle2Text] = useState('');

    // Vault Education Form State
    const [eduDegree, setEduDegree] = useState('');
    const [eduInstitution, setEduInstitution] = useState('');
    const [eduField, setEduField] = useState('');

    // Persona Synthesizer Form State
    const [personaTitle, setPersonaTitle] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [personaSummary, setPersonaSummary] = useState('');
    const [personaSkills, setPersonaSkills] = useState('');
    const [selectedProjectAngles, setSelectedProjectAngles] = useState<
        Record<string, string>
    >({});
    const [formError, setFormError] = useState('');

    // Queries
    const { data: profiles, isLoading: profilesLoading } = useQuery({
        queryKey: ['applicant-profiles'],
        queryFn: async () => {
            const { data } = await apiClient.get('/applicant/profiles');
            return data.profiles;
        },
    });

    const { data: vaultProjects } = useQuery({
        queryKey: ['vault-projects'],
        queryFn: async () => {
            const { data } = await apiClient.get('/applicant/vault/projects');
            return data.projects || [];
        },
    });

    const { data: vaultEducation } = useQuery({
        queryKey: ['vault-education'],
        queryFn: async () => {
            const { data } = await apiClient.get('/applicant/vault/education');
            return data.education || [];
        },
    });

    // Mutations
    const addProjectMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await apiClient.post(
                '/applicant/vault/projects',
                payload
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vault-projects'] });
            setProjectTitle('');
            setProjectUrl('');
            setProjectTags('');
            setAngle1Text('');
            setAngle2Text('');
        },
    });

    const addEducationMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await apiClient.post(
                '/applicant/vault/education',
                payload
            );
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vault-education'] });
            setEduDegree('');
            setEduInstitution('');
            setEduField('');
        },
    });

    const createPersonaMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await apiClient.post(
                '/applicant/profiles',
                payload
            );
            return data.profile;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applicant-profiles'] });
            setPersonaTitle('');
            setResumeUrl('');
            setPersonaSummary('');
            setPersonaSkills('');
            setFormError('');
        },
        onError: (err: any) => {
            setFormError(
                err.response?.data?.error || 'Failed to synthesize persona'
            );
        },
    });

    const handleCreateProject = (e: React.FormEvent) => {
        e.preventDefault();
        const narratives = [
            { label: angle1Label, text: angle1Text },
            ...(angle2Text ? [{ label: angle2Label, text: angle2Text }] : []),
        ];
        addProjectMutation.mutate({
            title: projectTitle,
            projectUrl,
            date: projectDate,
            tags: projectTags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            narratives,
        });
    };

    const handleCreateEducation = (e: React.FormEvent) => {
        e.preventDefault();
        addEducationMutation.mutate({
            degree: eduDegree,
            institution: eduInstitution,
            field: eduField,
        });
    };

    const handleSynthesizePersona = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        createPersonaMutation.mutate({
            title: personaTitle,
            resumeUrl,
            summary: personaSummary,
            skills: personaSkills
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            metadata: {
                selectedProjectAngles,
            },
        });
    };

    const isFreeLimitReached =
        user?.subscriptionTier === 'FREE' && (profiles?.length ?? 0) >= 1;

    return (
        <div className='flex-1 max-w-6xl w-full mx-auto px-6 py-8'>
            {/* Top Header */}
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-(--border-line) pb-6 gap-4'>
                <div>
                    <h1 className='font-grotesque font-extrabold text-4xl text-(--text-main) tracking-tight'>
                        Evidence Vault & Personas
                    </h1>
                </div>

                <div className='flex items-center gap-3'>
                    <div className='bg-(--bg-panel) p-1 rounded-md border border-(--border-line) flex'>
                        <button
                            onClick={() => setActiveTab('personas')}
                            className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${
                                activeTab === 'personas' ?
                                    'bg-(--bg-canvas) text-(--text-main) font-semibold shadow-xs'
                                :   'text-(--text-sub)'
                            }`}>
                            Active Personas ({profiles?.length ?? 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('vault')}
                            className={`px-4 py-1.5 text-xs font-medium rounded transition-colors ${
                                activeTab === 'vault' ?
                                    'bg-(--bg-canvas) text-(--text-main) font-semibold shadow-xs'
                                :   'text-(--text-sub)'
                            }`}>
                            Master Evidence Vault
                        </button>
                    </div>
                </div>
            </div>

            {isFreeLimitReached && activeTab === 'personas' && (
                <div className='mb-8 p-4 border border-(--border-line) bg-(--bg-panel) rounded-md flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                        <AlertCircle
                            size={18}
                            className='text-(--text-sub)'
                        />
                        <p className='text-xs text-(--text-main)'>
                            Free Plan includes 1 active persona. Upgrade to Pro
                            (1,200 DZD/mo) for unlimited personas tailored to
                            different roles.
                        </p>
                    </div>
                    <Link
                        to='/pricing'
                        className='px-3 py-1.5 bg-(--btn-main-bg) text-(--btn-main-text) text-xs font-semibold rounded hover:opacity-90'>
                        Upgrade to Pro
                    </Link>
                </div>
            )}

            {/* TAB 1: PERSONAS VIEW */}
            {activeTab === 'personas' && (
                <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
                    {/* Persona Synthesizer Form */}
                    <div className='lg:col-span-5 border border-(--border-line) rounded-lg p-6 bg-(--bg-canvas) space-y-4'>
                        <h3 className='font-grotesque font-bold text-2xl text-(--text-main) flex items-center gap-2'>
                            <Sparkles size={18} /> Synthesize Tailored Persona
                        </h3>
                        <p className='text-xs text-(--text-sub)'>
                            Construct a focused profile selecting from your
                            master vault artifacts.
                        </p>

                        {formError && (
                            <div className='p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded'>
                                {formError}
                            </div>
                        )}

                        <form
                            onSubmit={handleSynthesizePersona}
                            className='space-y-3'>
                            <input
                                type='text'
                                required
                                disabled={isFreeLimitReached}
                                placeholder='Persona Title (e.g. AI Systems Engineer, Legal Counsel)'
                                value={personaTitle}
                                onChange={(e) =>
                                    setPersonaTitle(e.target.value)
                                }
                                className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none disabled:opacity-50'
                            />
                            <input
                                type='url'
                                required
                                disabled={isFreeLimitReached}
                                placeholder='Persona Tailored Resume URL (PDF)'
                                value={resumeUrl}
                                onChange={(e) => setResumeUrl(e.target.value)}
                                className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none disabled:opacity-50'
                            />
                            <input
                                type='text'
                                required
                                disabled={isFreeLimitReached}
                                placeholder='Core Skills (e.g. PyTorch, Docker, CI/CD, Go)'
                                value={personaSkills}
                                onChange={(e) =>
                                    setPersonaSkills(e.target.value)
                                }
                                className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none disabled:opacity-50'
                            />
                            <textarea
                                rows={3}
                                disabled={isFreeLimitReached}
                                placeholder='Persona Objective & Summary'
                                value={personaSummary}
                                onChange={(e) =>
                                    setPersonaSummary(e.target.value)
                                }
                                className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none disabled:opacity-50'
                            />

                            {/* Modular Angle Selector from Vault */}
                            {vaultProjects?.length > 0 && (
                                <div className='pt-2 border-t border-(--border-line)'>
                                    <span className='font-mono text-[10px] text-(--text-sub) uppercase block mb-2'>
                                        Select Narrative Angles for Vault
                                        Projects:
                                    </span>
                                    <div className='space-y-2 max-h-48 overflow-y-auto pr-1'>
                                        {vaultProjects.map((proj: any) => (
                                            <div
                                                key={proj.id}
                                                className='p-2.5 border border-(--border-line) rounded bg-(--bg-panel)'>
                                                <div className='text-xs font-semibold text-(--text-main) mb-1'>
                                                    {proj.title}
                                                </div>
                                                <select
                                                    disabled={
                                                        isFreeLimitReached
                                                    }
                                                    value={
                                                        selectedProjectAngles[
                                                            proj.id
                                                        ] || ''
                                                    }
                                                    onChange={(e) =>
                                                        setSelectedProjectAngles(
                                                            (prev) => ({
                                                                ...prev,
                                                                [proj.id]:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        )
                                                    }
                                                    className='w-full text-[11px] p-1 border border-(--border-line) rounded bg-(--bg-canvas) text-(--text-main)'>
                                                    <option value=''>
                                                        -- Exclude from this
                                                        persona --
                                                    </option>
                                                    {proj.narratives?.map(
                                                        (
                                                            n: any,
                                                            idx: number
                                                        ) => (
                                                            <option
                                                                key={idx}
                                                                value={n.label}>
                                                                Angle: {n.label}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                type='submit'
                                disabled={
                                    isFreeLimitReached ||
                                    createPersonaMutation.isPending
                                }
                                className='w-full py-2.5 bg-(--btn-main-bg) text-(--btn-main-text) text-xs font-mono uppercase tracking-wider rounded font-semibold hover:opacity-90 disabled:opacity-50'>
                                {createPersonaMutation.isPending ?
                                    'Synthesizing...'
                                :   'Save & Publish Persona'}
                            </button>
                        </form>
                    </div>

                    {/* Active Personas List */}
                    <div className='lg:col-span-7 space-y-4'>
                        <h3 className='font-grotesque font-bold text-2xl text-(--text-main) mb-2'>
                            Configured Personas ({profiles?.length ?? 0})
                        </h3>

                        {profilesLoading ?
                            <div className='text-xs text-(--text-sub)'>
                                Loading personas...
                            </div>
                        : profiles?.length === 0 ?
                            <div className='p-8 border border-dashed border-(--border-line) text-center text-xs text-(--text-sub) rounded'>
                                No active personas yet. Use the synthesizer on
                                the left to create your first persona.
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
                                                className='text-xs text-(--text-sub) underline font-mono inline-flex items-center gap-1'>
                                                Inspect Linked Resume{' '}
                                                <ExternalLink size={12} />
                                            </a>
                                        </div>
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
            )}

            {/* TAB 2: MASTER EVIDENCE VAULT */}
            {activeTab === 'vault' && (
                <div className='space-y-12'>
                    {/* Projects with Multiple Narrative Angles */}
                    <div>
                        <div className='flex justify-between items-center mb-4'>
                            <div>
                                <h3 className='font-grotesque font-bold text-2xl text-(--text-main) flex items-center gap-2'>
                                    <FolderPlus size={20} /> Master Projects &
                                    Adaptive Narrative Descriptions
                                </h3>
                                <p className='text-xs text-(--text-sub)'>
                                    Store artifacts with multiple focus angles
                                    (e.g. AI Research vs. Systems Engineering).
                                </p>
                            </div>
                        </div>

                        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
                            {/* Add Project Form */}
                            <div className='lg:col-span-5 border border-(--border-line) rounded-lg p-5 bg-(--bg-canvas) space-y-3'>
                                <span className='font-mono text-xs text-(--text-sub) uppercase block'>
                                    Add Artifact to Vault
                                </span>
                                <form
                                    onSubmit={handleCreateProject}
                                    className='space-y-3'>
                                    <input
                                        type='text'
                                        required
                                        placeholder='Project Title (e.g. Distributed Crawler DZ)'
                                        value={projectTitle}
                                        onChange={(e) =>
                                            setProjectTitle(e.target.value)
                                        }
                                        className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main)'
                                    />
                                    <input
                                        type='url'
                                        placeholder='Repository / Artifact URL'
                                        value={projectUrl}
                                        onChange={(e) =>
                                            setProjectUrl(e.target.value)
                                        }
                                        className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main)'
                                    />
                                    <input
                                        type='text'
                                        placeholder='Tags (e.g. Python, Docker, Go)'
                                        value={projectTags}
                                        onChange={(e) =>
                                            setProjectTags(e.target.value)
                                        }
                                        className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main)'
                                    />

                                    {/* Narrative Angle 1 */}
                                    <div className='p-3 border border-(--border-line) rounded bg-(--bg-panel) space-y-2'>
                                        <input
                                            type='text'
                                            required
                                            placeholder='Angle 1 Label (e.g. Systems & Scalability)'
                                            value={angle1Label}
                                            onChange={(e) =>
                                                setAngle1Label(e.target.value)
                                            }
                                            className='w-full font-mono text-[11px] font-semibold bg-transparent border-b border-(--border-line) pb-1 text-(--text-main)'
                                        />
                                        <textarea
                                            rows={2}
                                            required
                                            placeholder='Description focusing on systems, latency, concurrency...'
                                            value={angle1Text}
                                            onChange={(e) =>
                                                setAngle1Text(e.target.value)
                                            }
                                            className='w-full p-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main)'
                                        />
                                    </div>

                                    {/* Narrative Angle 2 */}
                                    <div className='p-3 border border-(--border-line) rounded bg-(--bg-panel) space-y-2'>
                                        <input
                                            type='text'
                                            placeholder='Angle 2 Label (e.g. Machine Learning & Algorithms)'
                                            value={angle2Label}
                                            onChange={(e) =>
                                                setAngle2Label(e.target.value)
                                            }
                                            className='w-full font-mono text-[11px] font-semibold bg-transparent border-b border-(--border-line) pb-1 text-(--text-main)'
                                        />
                                        <textarea
                                            rows={2}
                                            placeholder='Alternative description focusing on AI, models, evaluation...'
                                            value={angle2Text}
                                            onChange={(e) =>
                                                setAngle2Text(e.target.value)
                                            }
                                            className='w-full p-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main)'
                                        />
                                    </div>

                                    <button
                                        type='submit'
                                        disabled={addProjectMutation.isPending}
                                        className='w-full py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-xs font-mono uppercase tracking-wider rounded font-semibold hover:opacity-90'>
                                        Save Project to Vault
                                    </button>
                                </form>
                            </div>

                            {/* Projects Vault List */}
                            <div className='lg:col-span-7 space-y-3'>
                                {vaultProjects?.length === 0 ?
                                    <div className='p-8 border border-dashed border-(--border-line) text-center text-xs text-(--text-sub) rounded'>
                                        No projects saved in vault. Add one on
                                        the left.
                                    </div>
                                :   vaultProjects?.map((proj: any) => (
                                        <div
                                            key={proj.id}
                                            className='p-4 border border-(--border-line) rounded-md bg-(--bg-canvas) space-y-2'>
                                            <div className='flex justify-between items-start'>
                                                <h4 className='font-grotesque font-bold text-xl text-(--text-main)'>
                                                    {proj.title}
                                                </h4>
                                                {proj.projectUrl && (
                                                    <a
                                                        href={proj.projectUrl}
                                                        target='_blank'
                                                        rel='noreferrer'
                                                        className='text-xs font-mono underline text-(--text-sub)'>
                                                        Link
                                                    </a>
                                                )}
                                            </div>

                                            <div className='space-y-2 pt-2 border-t border-(--border-line)'>
                                                {proj.narratives?.map(
                                                    (n: any, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            className='p-2 border border-(--border-line) rounded bg-(--bg-panel) text-xs'>
                                                            <span className='font-mono text-[10px] text-forest dark:text-forest-dark font-semibold uppercase block'>
                                                                [{n.label}]
                                                            </span>
                                                            <span className='text-(--text-sub)'>
                                                                {n.text}
                                                            </span>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>

                    {/* Education Vault Section */}
                    <div className='border-t border-(--border-line) pt-8'>
                        <h3 className='font-grotesque font-bold text-2xl text-(--text-main) flex items-center gap-2 mb-4'>
                            <GraduationCap size={20} /> Master Education
                            Credentials
                        </h3>

                        <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
                            <div className='lg:col-span-5 border border-(--border-line) rounded-lg p-5 bg-(--bg-canvas) space-y-3'>
                                <form
                                    onSubmit={handleCreateEducation}
                                    className='space-y-3'>
                                    <input
                                        type='text'
                                        required
                                        placeholder="Degree (e.g. Ingénieur d'État en Informatique)"
                                        value={eduDegree}
                                        onChange={(e) =>
                                            setEduDegree(e.target.value)
                                        }
                                        className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main)'
                                    />
                                    <input
                                        type='text'
                                        required
                                        placeholder='Institution (e.g. ESI Algiers, USTHB)'
                                        value={eduInstitution}
                                        onChange={(e) =>
                                            setEduInstitution(e.target.value)
                                        }
                                        className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main)'
                                    />
                                    <input
                                        type='text'
                                        required
                                        placeholder='Specialty / Field (e.g. Distributed Systems, Droit des Affaires)'
                                        value={eduField}
                                        onChange={(e) =>
                                            setEduField(e.target.value)
                                        }
                                        className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main)'
                                    />
                                    <button
                                        type='submit'
                                        disabled={
                                            addEducationMutation.isPending
                                        }
                                        className='w-full py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-xs font-mono uppercase tracking-wider rounded font-semibold hover:opacity-90'>
                                        Add Degree to Vault
                                    </button>
                                </form>
                            </div>

                            <div className='lg:col-span-7 space-y-2'>
                                {vaultEducation?.length === 0 ?
                                    <div className='p-6 border border-dashed border-(--border-line) text-center text-xs text-(--text-sub) rounded'>
                                        No education credentials saved.
                                    </div>
                                :   vaultEducation?.map((edu: any) => (
                                        <div
                                            key={edu.id}
                                            className='p-3 border border-(--border-line) rounded bg-(--bg-canvas) flex justify-between items-center text-xs'>
                                            <div>
                                                <div className='font-semibold text-(--text-main)'>
                                                    {edu.degree}
                                                </div>
                                                <div className='text-(--text-sub)'>
                                                    {edu.institution} •{' '}
                                                    {edu.field}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

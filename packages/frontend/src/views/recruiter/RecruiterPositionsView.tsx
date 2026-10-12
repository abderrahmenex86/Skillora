import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/apiClient';
import { Link } from 'react-router-dom';
import { Plus, Users, Clock, ArrowRight } from 'lucide-react';

export default function RecruiterPositionsView() {
    const queryClient = useQueryClient();
    const [showCreateModal, setShowCreateModal] = useState(false);

    const [companyName, setCompanyName] = useState('');
    const [title, setTitle] = useState('');
    const [department, setDepartment] = useState('');
    const [location, setLocation] = useState('Algiers (Hybrid)');
    const [deadline, setDeadline] = useState('');
    const [criteriaStr, setCriteriaStr] = useState('');

    const { data: positions, isLoading } = useQuery({
        queryKey: ['recruiter-positions'],
        queryFn: async () => {
            const { data } = await apiClient.get('/recruiter/positions');
            return data.positions;
        },
    });

    const createPositionMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await apiClient.post(
                '/recruiter/positions',
                payload
            );
            return data.position;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['recruiter-positions'],
            });
            setShowCreateModal(false);
            setCompanyName('');
            setTitle('');
            setDepartment('');
            setCriteriaStr('');
        },
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const mandatoryCriteria = criteriaStr
            .split(',')
            .map((c) => c.trim())
            .filter(Boolean);

        createPositionMutation.mutate({
            companyName,
            title,
            department,
            location,
            deadline: new Date(deadline).toISOString(),
            rubric: {
                mandatoryCriteria,
                preferredCriteria: [],
                minimumScoreThreshold: 70,
            },
        });
    };

    const now = new Date();
    const openPositions = positions?.filter(
        (p: any) => p.status === 'OPEN' && new Date(p.deadline) > now
    );
    const closedPositions = positions?.filter(
        (p: any) => p.status === 'CLOSED' || new Date(p.deadline) <= now
    );

    return (
        <div className='flex-1 max-w-7xl w-full mx-auto px-6 py-8'>
            <div className='flex justify-between items-center mb-8 border-b border-(--border-line) pb-6'>
                <div>
                    <span className='font-mono text-xs text-(--text-sub) uppercase tracking-wider block mb-1'>
                        [EMPLOYER PIPELINES]
                    </span>
                    <h1 className='font-grotesque font-extrabold text-4xl text-(--text-main) tracking-tight'>
                        Positions History
                    </h1>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className='px-4 py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-sm font-medium rounded-md hover:opacity-90 inline-flex items-center gap-2'>
                    <Plus size={16} /> Open New Position
                </button>
            </div>

            {showCreateModal && (
                <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
                    <div className='bg-(--bg-canvas) border border-(--border-line) rounded-lg p-6 max-w-lg w-full space-y-4'>
                        <h3 className='font-grotesque font-bold text-2xl text-(--text-main)'>
                            Create Verifiable Position
                        </h3>
                        <form
                            onSubmit={handleCreate}
                            className='space-y-3'>
                            <input
                                type='text'
                                required
                                placeholder='Company Name (e.g. Sonatrach, TechCorp DZ)'
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                            />
                            <input
                                type='text'
                                required
                                placeholder='Job Title (e.g. Junior Cloud Engineer, Corporate Counsel)'
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                            />
                            <input
                                type='text'
                                required
                                placeholder='Department (e.g. Cloud & Systems, Legal Affairs)'
                                value={department}
                                onChange={(e) => setDepartment(e.target.value)}
                                className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                            />
                            <input
                                type='text'
                                required
                                placeholder='Location (e.g. Algiers Hybrid, Oran)'
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                            />
                            <input
                                type='datetime-local'
                                required
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                            />
                            <textarea
                                rows={2}
                                required
                                placeholder='Mandatory Rubric Criteria (comma-separated: Docker, Linux, CI/CD)'
                                value={criteriaStr}
                                onChange={(e) => setCriteriaStr(e.target.value)}
                                className='w-full px-3 py-2 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none'
                            />

                            <div className='flex justify-end gap-2 pt-2'>
                                <button
                                    type='button'
                                    onClick={() => setShowCreateModal(false)}
                                    className='px-4 py-2 border border-(--border-line) text-xs font-semibold rounded'>
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    disabled={createPositionMutation.isPending}
                                    className='px-4 py-2 bg-(--btn-main-bg) text-(--btn-main-text) text-xs font-semibold rounded hover:opacity-90'>
                                    Create Opening
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isLoading ?
                <div className='text-xs text-(--text-sub)'>
                    Loading position pipelines...
                </div>
            :   <div className='space-y-10'>
                    <div>
                        <h3 className='font-grotesque font-bold text-2xl text-(--text-main) mb-4 flex items-center gap-2'>
                            <span className='w-2 h-2 rounded-full bg-forest dark:bg-forest-dark' />{' '}
                            Active & Open Pipelines (
                            {openPositions?.length ?? 0})
                        </h3>

                        {openPositions?.length === 0 ?
                            <div className='p-6 border border-dashed border-(--border-line) text-xs text-(--text-sub) text-center rounded'>
                                No active openings. Click "Open New Position"
                                above to launch a pipeline.
                            </div>
                        :   <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                {openPositions?.map((p: any) => (
                                    <Link
                                        key={p.id}
                                        to={`/recruiter/positions/${p.id}/applications`}
                                        className='p-5 rounded-md border border-(--border-line) bg-(--bg-canvas) hover:border-(--text-main) transition-all block group'>
                                        <div className='flex justify-between items-start mb-2'>
                                            <div>
                                                <span className='font-mono text-[10px] text-(--text-sub) uppercase'>
                                                    {p.department} •{' '}
                                                    {p.location}
                                                </span>
                                                <h4 className='font-grotesque font-bold text-2xl text-(--text-main) group-hover:text-forest dark:group-hover:text-forest-dark transition-colors'>
                                                    {p.title}
                                                </h4>
                                            </div>
                                            <ArrowRight
                                                size={18}
                                                className='text-(--text-sub) group-hover:text-(--text-main)'
                                            />
                                        </div>

                                        <div className='flex items-center justify-between pt-3 border-t border-(--border-line) text-xs font-mono text-(--text-sub)'>
                                            <div className='flex items-center gap-1.5'>
                                                <Users size={14} />
                                                <span>
                                                    {p._count?.applications ??
                                                        0}{' '}
                                                    Submissions
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-1.5 text-amber-accent'>
                                                <Clock size={14} />
                                                <span>
                                                    Deadline:{' '}
                                                    {new Date(
                                                        p.deadline
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        }
                    </div>

                    <div>
                        <h3 className='font-grotesque font-bold text-2xl text-(--text-sub) mb-4'>
                            Archived & Closed Positions (
                            {closedPositions?.length ?? 0})
                        </h3>
                        {closedPositions?.length > 0 && (
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75'>
                                {closedPositions.map((p: any) => (
                                    <Link
                                        key={p.id}
                                        to={`/recruiter/positions/${p.id}/applications`}
                                        className='p-5 rounded-md border border-(--border-line) bg-(--bg-panel) block'>
                                        <div className='flex justify-between items-start mb-2'>
                                            <div>
                                                <span className='font-mono text-[10px] text-(--text-sub) uppercase'>
                                                    CLOSED • {p.department}
                                                </span>
                                                <h4 className='font-grotesque font-bold text-2xl text-(--text-main)'>
                                                    {p.title}
                                                </h4>
                                            </div>
                                            <span className='font-mono text-[10px] px-2 py-0.5 rounded bg-(--border-line) text-(--text-sub)'>
                                                LOCKED
                                            </span>
                                        </div>
                                        <div className='text-xs font-mono text-(--text-sub)'>
                                            {p._count?.applications ?? 0}{' '}
                                            Applications processed
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            }
        </div>
    );
}

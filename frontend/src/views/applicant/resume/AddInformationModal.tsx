import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/apiClient';
import {
    INFO_ENDPOINTS,
    INFO_SINGULAR_LABELS,
    type InfoKind,
} from './types';

type FieldType = 'text' | 'url' | 'textarea' | 'select';

interface FieldDef {
    name: string;
    label: string;
    placeholder?: string;
    type?: FieldType;
    required?: boolean;
    fullWidth?: boolean;
    options?: { label: string; value: string }[];
    format?: 'lines' | 'comma';
    defaultValue?: string;
}

const FIELDS: Record<InfoKind, FieldDef[]> = {
    education: [
        {
            name: 'degree',
            label: 'Diploma / Degree',
            placeholder: "Ingénieur d'État en Informatique",
            required: true,
            fullWidth: true,
        },
        {
            name: 'institution',
            label: 'Institution',
            placeholder: 'ESI Algiers',
            required: true,
        },
        {
            name: 'field',
            label: 'Field of Study',
            placeholder: 'Distributed Systems',
            required: true,
        },
        {
            name: 'startDate',
            label: 'Start Date',
            placeholder: '2019',
        },
        {
            name: 'endDate',
            label: 'End Date',
            placeholder: '2024',
        },
    ],
    experience: [
        {
            name: 'role',
            label: 'Role',
            placeholder: 'Backend Engineer',
            required: true,
        },
        {
            name: 'company',
            label: 'Company',
            placeholder: 'TechCorp DZ',
            required: true,
        },
        {
            name: 'location',
            label: 'Location',
            placeholder: 'Algiers, Algeria',
        },
        {
            name: 'startDate',
            label: 'Start Date',
            placeholder: '2023',
            required: true,
        },
        {
            name: 'endDate',
            label: 'End Date',
            placeholder: 'Present',
        },
        {
            name: 'highlights',
            label: 'Highlights',
            placeholder: 'One achievement per line',
            type: 'textarea',
            fullWidth: true,
            format: 'lines',
        },
    ],
    project: [
        {
            name: 'title',
            label: 'Project Title',
            placeholder: 'Cloud Infrastructure Orchestrator',
            required: true,
            fullWidth: true,
        },
        {
            name: 'projectUrl',
            label: 'Project Link',
            placeholder: 'https://github.com/username/project',
            type: 'url',
        },
        {
            name: 'date',
            label: 'Date',
            placeholder: '2024',
        },
        {
            name: 'description',
            label: 'Description',
            placeholder: 'What did you build, and what was the impact?',
            type: 'textarea',
            fullWidth: true,
        },
        {
            name: 'tags',
            label: 'Technologies / Tags',
            placeholder: 'Go, Docker, PostgreSQL',
            fullWidth: true,
            format: 'comma',
        },
    ],
    certification: [
        {
            name: 'name',
            label: 'Certification Name',
            placeholder: 'AWS Solutions Architect',
            required: true,
            fullWidth: true,
        },
        {
            name: 'issuer',
            label: 'Issuer',
            placeholder: 'Amazon Web Services',
            required: true,
        },
        {
            name: 'issueDate',
            label: 'Issue Date',
            placeholder: '2024',
        },
        {
            name: 'credentialId',
            label: 'Credential ID',
            placeholder: 'Optional credential reference',
            fullWidth: true,
        },
    ],
    volunteering: [
        {
            name: 'role',
            label: 'Role',
            placeholder: 'Community Mentor',
            required: true,
        },
        {
            name: 'organization',
            label: 'Organization',
            placeholder: 'Local student association',
            required: true,
        },
        {
            name: 'startDate',
            label: 'Start Date',
            placeholder: '2022',
        },
        {
            name: 'endDate',
            label: 'End Date',
            placeholder: '2024',
        },
        {
            name: 'description',
            label: 'Description',
            placeholder: 'What did you contribute?',
            type: 'textarea',
            fullWidth: true,
        },
    ],
    language: [
        {
            name: 'name',
            label: 'Language',
            placeholder: 'Arabic',
            required: true,
        },
        {
            name: 'proficiency',
            label: 'Proficiency',
            type: 'select',
            defaultValue: 'Intermediate',
            options: [
                { label: 'Native', value: 'Native' },
                { label: 'Fluent', value: 'Fluent' },
                { label: 'Intermediate', value: 'Intermediate' },
                { label: 'Basic', value: 'Basic' },
            ],
        },
    ],
    link: [
        {
            name: 'label',
            label: 'Label',
            placeholder: 'Architecture Portfolio',
            required: true,
        },
        {
            name: 'type',
            label: 'Link Type',
            type: 'select',
            defaultValue: 'portfolio',
            options: [
                { label: 'Portfolio', value: 'portfolio' },
                { label: 'GitHub', value: 'github' },
                { label: 'LinkedIn', value: 'linkedin' },
                { label: 'Website', value: 'website' },
                { label: 'Other', value: 'other' },
            ],
        },
        {
            name: 'url',
            label: 'URL',
            placeholder: 'https://portfolio.example.com',
            type: 'url',
            required: true,
            fullWidth: true,
        },
    ],
};

const inputClass =
    'w-full px-3 py-2 text-sm rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)';

const labelClass =
    'block text-[11px] font-mono text-(--text-sub) uppercase mb-1';

function initialValues(kind: InfoKind): Record<string, string> {
    const values: Record<string, string> = {};
    FIELDS[kind].forEach((field) => {
        if (field.defaultValue) values[field.name] = field.defaultValue;
    });
    return values;
}

export default function AddInformationModal({
    kind,
    onClose,
}: {
    kind: InfoKind;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const [values, setValues] = useState<Record<string, string>>(() =>
        initialValues(kind)
    );
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setValues(initialValues(kind));
        setError('');
    }, [kind]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setIsSaving(true);

        const payload: Record<string, unknown> = {};

        for (const field of FIELDS[kind]) {
            const raw = values[field.name]?.trim() ?? '';
            if (!raw) continue;

            if (field.format === 'lines') {
                payload[field.name] = raw
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean);
            } else if (field.format === 'comma') {
                payload[field.name] = raw
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean);
            } else {
                payload[field.name] = raw;
            }
        }

        try {
            await apiClient.post(
                `/applicant/vault/${INFO_ENDPOINTS[kind]}`,
                payload
            );
            await queryClient.invalidateQueries({
                queryKey: ['applicant-vault'],
            });
            onClose();
        } catch (err: any) {
            if (err.response?.data?.issues) {
                setError(
                    err.response.data.issues
                        .map((issue: any) => issue.message)
                        .join(' · ')
                );
            } else {
                setError(
                    err.response?.data?.error ||
                        `Could not add this ${INFO_SINGULAR_LABELS[
                            kind
                        ].toLowerCase()}.`
                );
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}>
            <div className='max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-(--border-line) bg-(--bg-canvas) shadow-xl'>
                <div className='flex items-center justify-between border-b border-(--border-line) px-6 py-4'>
                    <h2 className='font-grotesque text-2xl font-bold text-(--text-main)'>
                        Add {INFO_SINGULAR_LABELS[kind]}
                    </h2>
                    <button
                        type='button'
                        onClick={onClose}
                        aria-label='Close dialog'
                        className='rounded-md p-1.5 text-(--text-sub) transition-colors hover:bg-(--bg-panel) hover:text-(--text-main)'>
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className='space-y-4 p-6'>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                        {FIELDS[kind].map((field) => (
                            <div
                                key={field.name}
                                className={
                                    field.fullWidth ? 'sm:col-span-2' : ''
                                }>
                                <label className={labelClass}>
                                    {field.label}
                                </label>
                                {field.type === 'textarea' ?
                                    <textarea
                                        rows={4}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        value={values[field.name] ?? ''}
                                        onChange={(event) =>
                                            setValues((current) => ({
                                                ...current,
                                                [field.name]:
                                                    event.target.value,
                                            }))
                                        }
                                        className={inputClass}
                                    />
                                : field.type === 'select' ?
                                    <select
                                        required={field.required}
                                        value={values[field.name] ?? ''}
                                        onChange={(event) =>
                                            setValues((current) => ({
                                                ...current,
                                                [field.name]:
                                                    event.target.value,
                                            }))
                                        }
                                        className={inputClass}>
                                        <option value=''>
                                            Select {field.label}
                                        </option>
                                        {field.options?.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                :   <input
                                        type={field.type || 'text'}
                                        required={field.required}
                                        placeholder={field.placeholder}
                                        value={values[field.name] ?? ''}
                                        onChange={(event) =>
                                            setValues((current) => ({
                                                ...current,
                                                [field.name]:
                                                    event.target.value,
                                            }))
                                        }
                                        className={inputClass}
                                    />
                                }
                            </div>
                        ))}
                    </div>

                    {error && (
                        <div className='rounded border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600'>
                            {error}
                        </div>
                    )}

                    <div className='flex justify-end gap-3 border-t border-(--border-line) pt-4'>
                        <button
                            type='button'
                            onClick={onClose}
                            className='rounded-md border border-(--border-line) px-4 py-2 text-sm font-medium text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                            Cancel
                        </button>
                        <button
                            type='submit'
                            disabled={isSaving}
                            className='rounded-md bg-(--btn-main-bg) px-5 py-2 text-sm font-semibold text-(--btn-main-text) transition-opacity hover:opacity-90 disabled:opacity-50'>
                            {isSaving ? 'Saving...' : 'Add Information'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

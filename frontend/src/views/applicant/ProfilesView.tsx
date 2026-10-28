import { useEffect, useState } from 'react';
import { FileText, HelpCircle, Library, X } from 'lucide-react';
import InformationLibrary from './resume/InformationLibrary';
import TailoredResumes from './resume/TailoredResumes';

type BuilderTab = 'information' | 'resumes';

const HELP_ITEMS = [
    {
        title: 'My Resumes',
        text: 'Assemble role-specific resumes from your saved information and keep them ready to send.',
    },
    {
        title: 'My Information',
        text: 'Your master library. Add each item once, then reuse it in any resume. Use the left menu to jump between sections.',
    },
    {
        title: 'Education & work',
        text: 'Education and training, work experience, skills, and language skills.',
    },
    {
        title: 'Credentials & recognition',
        text: 'Certifications, conferences and seminars, honours and awards, and publications.',
    },
    {
        title: 'Projects & creative work',
        text: 'Projects, creative works, links and portfolios, and recommendations.',
    },
    {
        title: 'Activities & memberships',
        text: 'Volunteering, social and political activities, networks and memberships, hobbies, and driving licence.',
    },
    {
        title: 'Other',
        text: 'Use Other (Custom section) for anything that does not fit elsewhere.',
    },
];

export default function ProfilesView() {
    const [activeTab, setActiveTab] = useState<BuilderTab>('resumes');
    const [helpOpen, setHelpOpen] = useState(false);

    useEffect(() => {
        if (!helpOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setHelpOpen(false);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [helpOpen]);

    return (
        <div className='page-frame w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
            <div className='mb-5 flex shrink-0 items-center justify-between gap-3 border-b border-(--border-line)'>
                <div className='flex items-center gap-1'>
                    <button
                        type='button'
                        onClick={() => setActiveTab('resumes')}
                        className={`relative inline-flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4 ${
                            activeTab === 'resumes' ?
                                'text-(--text-main)'
                            :   'text-(--text-sub) hover:text-(--text-main)'
                        }`}>
                        <FileText size={16} />
                        My Resumes
                        {activeTab === 'resumes' && (
                            <span className='absolute inset-x-3 -bottom-px h-0.5 bg-(--text-main)' />
                        )}
                    </button>
                    <button
                        type='button'
                        onClick={() => setActiveTab('information')}
                        className={`relative inline-flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors sm:px-4 ${
                            activeTab === 'information' ?
                                'text-(--text-main)'
                            :   'text-(--text-sub) hover:text-(--text-main)'
                        }`}>
                        <Library size={16} />
                        My Information
                        {activeTab === 'information' && (
                            <span className='absolute inset-x-3 -bottom-px h-0.5 bg-(--text-main)' />
                        )}
                    </button>
                </div>

                <button
                    type='button'
                    onClick={() => setHelpOpen(true)}
                    className='inline-flex shrink-0 items-center gap-1.5 rounded-md border border-(--border-line) px-3 py-2 text-xs font-medium text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                    <HelpCircle size={15} />
                    Help
                </button>
            </div>

            <div
                className={
                    activeTab === 'information' ?
                        'flex min-h-0 flex-1 flex-col'
                    :   'hidden'
                }>
                <InformationLibrary />
            </div>

            <div
                className={
                    activeTab === 'resumes' ?
                        'flex min-h-0 flex-1 flex-col'
                    :   'hidden'
                }>
                <TailoredResumes
                    onOpenInformation={() => setActiveTab('information')}
                />
            </div>

            {helpOpen && (
                <div
                    className='modal-backdrop fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-4 pt-20 sm:pt-24'
                    onClick={() => setHelpOpen(false)}>
                    <div
                        role='dialog'
                        aria-modal='true'
                        aria-labelledby='resume-builder-help-title'
                        className='modal-panel max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg border border-(--border-line) bg-(--bg-canvas) p-6 shadow-xl'>
                        <div className='mb-5 flex items-start justify-between gap-4'>
                            <div>
                                <h2
                                    id='resume-builder-help-title'
                                    className='font-grotesque text-2xl font-bold text-(--text-main)'>
                                    My Resumes Help
                                </h2>
                                <p className='mt-1 text-xs text-(--text-sub)'>
                                    A quick guide to your resumes and saved
                                    information.
                                </p>
                            </div>
                            <button
                                type='button'
                                onClick={() => setHelpOpen(false)}
                                aria-label='Close help'
                                className='rounded p-1 text-(--text-sub) transition-colors hover:bg-(--bg-panel) hover:text-(--text-main)'>
                                <X size={16} />
                            </button>
                        </div>

                        <div className='space-y-4'>
                            {HELP_ITEMS.map((item) => (
                                <div key={item.title}>
                                    <div className='text-sm font-semibold text-(--text-main)'>
                                        {item.title}
                                    </div>
                                    <p className='mt-0.5 text-xs leading-relaxed text-(--text-sub)'>
                                        {item.text}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <p className='mt-5 border-t border-(--border-line) pt-4 font-mono text-[10px] uppercase tracking-wider text-(--text-sub)'>
                            Click anywhere to close
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

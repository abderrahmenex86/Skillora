import { useState } from 'react';
import { FileText, Library } from 'lucide-react';
import InformationLibrary from './resume/InformationLibrary';
import TailoredResumes from './resume/TailoredResumes';

type BuilderTab = 'information' | 'resumes';

export default function ProfilesView() {
    const [activeTab, setActiveTab] = useState<BuilderTab>('information');

    return (
        <div className='flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
            <div className='mb-8 flex items-center gap-1 border-b border-(--border-line)'>
                <button
                    type='button'
                    onClick={() => setActiveTab('information')}
                    className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
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
                <button
                    type='button'
                    onClick={() => setActiveTab('resumes')}
                    className={`relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === 'resumes' ?
                            'text-(--text-main)'
                        :   'text-(--text-sub) hover:text-(--text-main)'
                    }`}>
                    <FileText size={16} />
                    Tailored Resumes
                    {activeTab === 'resumes' && (
                        <span className='absolute inset-x-3 -bottom-px h-0.5 bg-(--text-main)' />
                    )}
                </button>
            </div>

            <div
                className={
                    activeTab === 'information' ? undefined : 'hidden'
                }>
                <InformationLibrary />
            </div>

            <div
                className={activeTab === 'resumes' ? undefined : 'hidden'}>
                <TailoredResumes
                    onOpenInformation={() => setActiveTab('information')}
                />
            </div>
        </div>
    );
}

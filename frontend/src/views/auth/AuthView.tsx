import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { useAuthStore } from '../../store/useAuthStore';

export default function AuthView() {
    const [searchParams] = useSearchParams();
    const [role, setRole] = useState<'APPLICANT' | 'RECRUITER'>('APPLICANT');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const setTokens = useAuthStore((state) => state.setTokens);
    const navigate = useNavigate();

    useEffect(() => {
        if (searchParams.get('mode') === 'register') {
            setIsLogin(false);
        } else {
            setIsLogin(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const payload =
                isLogin ? { email, password } : { email, password, role };

            const { data } = await apiClient.post(endpoint, payload);
            setTokens(data.accessToken, data.user);

            if (data.user.role === 'RECRUITER') {
                navigate('/recruiter/positions');
            } else {
                navigate('/applicant/dashboard');
            }
        } catch (err: any) {
            setErrorMsg(err.response?.data?.error || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='flex-1 flex flex-col md:flex-row'>
            <div className='w-full md:w-[48%] bg-(--bg-panel) border-r border-(--border-line) p-8 md:p-14 flex flex-col justify-between'>
                <div className='max-w-md my-auto'>
                    <h2 className='font-grotesque font-extrabold text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-8 text-(--text-main)'>
                        Every applicant gets either an interview or a path to
                        grow. Guaranteed.
                    </h2>
                    <div className='space-y-4 text-sm text-(--text-main)'>
                        <div className='flex items-center space-x-3'>
                            <span className='font-mono'>✓</span>
                            <span>Zero unread PDF black holes.</span>
                        </div>
                        <div className='flex items-center space-x-3'>
                            <span className='font-mono'>✓</span>
                            <span>
                                Evidence-based matching across all disciplines.
                            </span>
                        </div>
                        <div className='flex items-center space-x-3'>
                            <span className='font-mono'>✓</span>
                            <span>
                                Transparent decision timelines and calendar
                                dispatch.
                            </span>
                        </div>
                    </div>
                </div>
                <div className='font-mono text-xs text-(--text-sub)'>
                    [ALGERIA TALENT INFRASTRUCTURE]
                </div>
            </div>

            <div className='w-full md:w-[52%] p-8 md:p-14 flex flex-col justify-center items-center'>
                <div className='w-full max-w-md'>
                    <div className='bg-(--bg-panel) p-1 rounded-md border border-(--border-line) flex mb-6'>
                        <button
                            type='button'
                            onClick={() => setRole('APPLICANT')}
                            className={`flex-1 py-2 text-xs font-medium rounded transition-colors ${
                                role === 'APPLICANT' ?
                                    'bg-(--bg-canvas) text-(--text-main) font-semibold shadow-xs'
                                :   'text-(--text-sub)'
                            }`}>
                            Seeking Roles (Candidate)
                        </button>
                        <button
                            type='button'
                            onClick={() => setRole('RECRUITER')}
                            className={`flex-1 py-2 text-xs font-medium rounded transition-colors ${
                                role === 'RECRUITER' ?
                                    'bg-(--bg-canvas) text-(--text-main) font-semibold shadow-xs'
                                :   'text-(--text-sub)'
                            }`}>
                            Hiring Talent (Recruiter)
                        </button>
                    </div>

                    <h3 className='font-grotesque font-bold text-3xl tracking-tight mb-1 text-(--text-main)'>
                        {isLogin ? 'Enter the Workspace' : 'Create an Account'}
                    </h3>
                    <p className='text-xs text-(--text-sub) mb-6'>
                        {isLogin ?
                            'Access your applications, profiles, or recruiter pipelines.'
                        :   'Join Skillora with deterministic evaluation on verified evidence.'
                        }
                    </p>

                    {errorMsg && (
                        <div className='mb-4 p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded'>
                            {errorMsg}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className='space-y-4'>
                        <input
                            type='email'
                            required
                            placeholder='Email address'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className='w-full px-3.5 py-2.5 text-sm rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                        />
                        <input
                            type='password'
                            required
                            placeholder='Password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className='w-full px-3.5 py-2.5 text-sm rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                        />

                        <button
                            type='submit'
                            disabled={isLoading}
                            className='w-full py-3 bg-(--btn-main-bg) text-(--btn-main-text) font-grotesque font-bold text-xl rounded-md hover:opacity-90 transition-opacity disabled:opacity-50'>
                            {isLoading ?
                                'Processing...'
                            : isLogin ?
                                'Continue to Workspace'
                            :   'Create Account'}
                        </button>
                    </form>

                    <div className='text-center text-xs text-(--text-sub) mt-6'>
                        {isLogin ?
                            <>
                                Don’t have an account?{' '}
                                <button
                                    onClick={() => setIsLogin(false)}
                                    className='text-(--text-main) font-semibold underline'>
                                    Register here
                                </button>
                            </>
                        :   <>
                                Already registered?{' '}
                                <button
                                    onClick={() => setIsLogin(true)}
                                    className='text-(--text-main) font-semibold underline'>
                                    Log in here
                                </button>
                            </>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}

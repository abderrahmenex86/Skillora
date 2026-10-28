import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { ALGERIA_WILAYAS } from '../../data/algeria';
import {
    consumeStoredRedirect,
    normalizeRedirect,
    redirectFromLocationState,
} from '../../lib/redirect';
import { useAuthStore } from '../../store/useAuthStore';

export default function AuthView() {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [role, setRole] = useState<'APPLICANT' | 'RECRUITER'>('APPLICANT');
    const [isLogin, setIsLogin] = useState(true);

    // Form Fields
    const [firstName, setFirstName] = useState('');
    const [middleName, setMiddleName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [wilaya, setWilaya] = useState('16 - Alger');
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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
                isLogin ?
                    { email, password }
                :   {
                        email,
                        password,
                        firstName,
                        middleName: middleName || undefined,
                        lastName,
                        phone: phone || undefined,
                        wilaya,
                        companyName:
                            role === 'RECRUITER' ? companyName : undefined,
                        role,
                    };

            const { data } = await apiClient.post(endpoint, payload);
            setTokens(data.accessToken, data.user);

            const redirect =
                normalizeRedirect(searchParams.get('redirect')) ??
                normalizeRedirect(redirectFromLocationState(location.state)) ??
                normalizeRedirect(consumeStoredRedirect());

            if (redirect) {
                navigate(redirect, { replace: true });
            } else if (data.user.role === 'RECRUITER') {
                navigate('/recruiter/positions', { replace: true });
            } else {
                navigate('/applicant/dashboard', { replace: true });
            }
        } catch (err: any) {
            if (err.response?.data?.issues) {
                const detailedErrors = err.response.data.issues
                    .map((i: any) => i.message)
                    .join(' • ');
                setErrorMsg(detailedErrors);
            } else {
                setErrorMsg(
                    err.response?.data?.error || 'Authentication failed'
                );
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='flex-1 flex flex-col md:flex-row'>
            <div className='w-full md:w-[42%] bg-(--bg-panel) border-r border-(--border-line) p-8 md:p-14 flex flex-col justify-between'>
                <div className='max-w-md my-auto'>
                    <h2 className='font-grotesque font-extrabold text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-8 text-(--text-main)'>
                        Every applicant gets either an interview or a path to
                        grow. Guaranteed.
                    </h2>
                    <div className='space-y-4 text-sm text-(--text-main)'>
                        <div className='flex items-center space-x-3'>
                            <span className='font-mono'>✓</span>
                            <span>
                                Zero unread PDF black holes across all 58
                                wilayas.
                            </span>
                        </div>
                        <div className='flex items-center space-x-3'>
                            <span className='font-mono'>✓</span>
                            <span>
                                Verified state degrees (ESI, USTHB, CAPA) and
                                real artifacts.
                            </span>
                        </div>
                        <div className='flex items-center space-x-3'>
                            <span className='font-mono'>✓</span>
                            <span>
                                Autonomous scheduling and guaranteed Cedar Amber
                                gap analysis.
                            </span>
                        </div>
                    </div>
                </div>
                <div className='font-mono text-xs text-(--text-sub)'>
                    [ALGERIA TALENT INFRASTRUCTURE • 58 WILAYAS]
                </div>
            </div>

            <div className='w-full md:w-[58%] p-8 md:p-14 flex flex-col justify-center items-center'>
                <div className='w-full max-w-lg'>
                    {!isLogin && (
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
                    )}

                    <h3 className='font-grotesque font-bold text-3xl tracking-tight mb-1 text-(--text-main)'>
                        {isLogin ?
                            'Enter the Workspace'
                        : role === 'RECRUITER' ?
                            'Create Recruiter Profile'
                        :   'Create Candidate Profile'}
                    </h3>
                    <p className='text-xs text-(--text-sub) mb-6'>
                        {isLogin ?
                            'Access your applications, resume, or company cohorts.'
                        :   'Fill in your civil and contact information to create your verified talent account.'
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
                        {!isLogin && (
                            <>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                    <input
                                        type='text'
                                        required
                                        placeholder='Prénom (First Name)'
                                        value={firstName}
                                        onChange={(e) =>
                                            setFirstName(e.target.value)
                                        }
                                        className='w-full px-3.5 py-2.5 text-xs rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                                    />
                                    <input
                                        type='text'
                                        required
                                        placeholder='Nom (Last Name)'
                                        value={lastName}
                                        onChange={(e) =>
                                            setLastName(e.target.value)
                                        }
                                        className='w-full px-3.5 py-2.5 text-xs rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                                    />
                                </div>

                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                    <input
                                        type='text'
                                        placeholder='Deuxième prénom (Middle Name, optional)'
                                        value={middleName}
                                        onChange={(e) =>
                                            setMiddleName(e.target.value)
                                        }
                                        className='w-full px-3.5 py-2.5 text-xs rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                                    />
                                    <input
                                        type='tel'
                                        placeholder='Numéro de téléphone (+213 ...)'
                                        value={phone}
                                        onChange={(e) =>
                                            setPhone(e.target.value)
                                        }
                                        className='w-full px-3.5 py-2.5 text-xs rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                                    />
                                </div>

                                <div>
                                    <label className='block text-[11px] font-mono text-(--text-sub) mb-1'>
                                        Wilaya de Résidence (District)
                                    </label>
                                    <select
                                        value={wilaya}
                                        onChange={(e) =>
                                            setWilaya(e.target.value)
                                        }
                                        className='w-full px-3.5 py-2.5 text-xs rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'>
                                        {ALGERIA_WILAYAS.map((w) => (
                                            <option
                                                key={w}
                                                value={w}>
                                                {w}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {role === 'RECRUITER' && (
                                    <input
                                        type='text'
                                        required
                                        placeholder="Company or Organization (e.g. Sonatrach, Banque d'Algérie)"
                                        value={companyName}
                                        onChange={(e) =>
                                            setCompanyName(e.target.value)
                                        }
                                        className='w-full px-3.5 py-2.5 text-xs rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                                    />
                                )}
                            </>
                        )}

                        <input
                            type='email'
                            required
                            autoComplete='email'
                            placeholder='Email address'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className='w-full px-3.5 py-2.5 text-sm rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                        />
                        <input
                            type='password'
                            required
                            autoComplete={
                                isLogin ? 'current-password' : 'new-password'
                            }
                            placeholder={
                                isLogin ?
                                    'Password'
                                :   'Password (minimum 8 characters)'
                            }
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
                            :   'Complete Registration'}
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

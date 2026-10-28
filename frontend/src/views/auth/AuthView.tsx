import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Check, UserRound } from 'lucide-react';
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
        <div className='flex flex-1 flex-col md:flex-row'>
            <div className='panel-dark w-full p-8 md:w-[42%] md:p-14 flex flex-col justify-between'>
                <div
                    aria-hidden='true'
                    className='orbit -right-24 -top-24 h-80 w-80'
                />
                <div
                    aria-hidden='true'
                    className='orbit -right-6 -top-6 h-44 w-44'
                />
                <div className='relative my-auto max-w-md'>
                    <span className='eyebrow-pill mb-7'>
                        Skillora promise
                    </span>
                    <h2 className='display mb-10 text-5xl text-white sm:text-6xl'>
                        Every applicant gets either an interview or a path to
                        grow.{' '}
                        <span className='text-emerald-brand'>Guaranteed.</span>
                    </h2>
                    <ul className='space-y-4 text-sm text-sage-300'>
                        {[
                            'Zero unread PDF black holes across all 58 wilayas.',
                            'Verified state degrees (ESI, USTHB, CAPA) and real artifacts.',
                            'Autonomous scheduling and guaranteed Cedar Amber gap analysis.',
                        ].map((item) => (
                            <li
                                key={item}
                                className='flex items-start gap-3'>
                                <span className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-brand text-ink'>
                                    <Check
                                        size={12}
                                        strokeWidth={3}
                                    />
                                </span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className='eyebrow relative mt-10'>
                    Algeria Talent Infrastructure · 58 wilayas
                </div>
            </div>

            <div className='w-full md:w-[58%] p-6 py-12 md:p-14 flex flex-col justify-center items-center'>
                <div className='card w-full max-w-lg p-7 shadow-lg sm:p-9'>
                    {!isLogin && (
                        <div className='mb-7 flex rounded-full border border-(--border-line) bg-(--bg-panel) p-1'>
                            <button
                                type='button'
                                onClick={() => setRole('APPLICANT')}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold transition-all ${
                                    role === 'APPLICANT' ?
                                        'bg-(--bg-elevated) text-(--text-main) shadow-sm ring-1 ring-(--border-line)'
                                    :   'text-(--text-sub) hover:text-(--text-main)'
                                }`}>
                                <UserRound size={14} /> Seeking Roles
                            </button>
                            <button
                                type='button'
                                onClick={() => setRole('RECRUITER')}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold transition-all ${
                                    role === 'RECRUITER' ?
                                        'bg-(--bg-elevated) text-(--text-main) shadow-sm ring-1 ring-(--border-line)'
                                    :   'text-(--text-sub) hover:text-(--text-main)'
                                }`}>
                                <Building2 size={14} /> Hiring Talent
                            </button>
                        </div>
                    )}

                    <h3 className='display mb-2 text-5xl text-(--text-main)'>
                        {isLogin ?
                            'Enter the Workspace'
                        : role === 'RECRUITER' ?
                            'Create Recruiter Profile'
                        :   'Create Candidate Profile'}
                    </h3>
                    <p className='mb-7 text-sm text-(--text-sub)'>
                        {isLogin ?
                            'Access your applications, resume, or company cohorts.'
                        :   'Fill in your civil and contact information to create your verified talent account.'
                        }
                    </p>

                    {errorMsg && (
                        <div className='mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400'>
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
                                        className='field'
                                    />
                                    <input
                                        type='text'
                                        required
                                        placeholder='Nom (Last Name)'
                                        value={lastName}
                                        onChange={(e) =>
                                            setLastName(e.target.value)
                                        }
                                        className='field'
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
                                        className='field'
                                    />
                                    <input
                                        type='tel'
                                        placeholder='Numéro de téléphone (+213 ...)'
                                        value={phone}
                                        onChange={(e) =>
                                            setPhone(e.target.value)
                                        }
                                        className='field'
                                    />
                                </div>

                                <div>
                                    <label className='mb-1.5 block text-xs font-medium text-(--text-sub)'>
                                        Wilaya de Résidence (District)
                                    </label>
                                    <select
                                        value={wilaya}
                                        onChange={(e) =>
                                            setWilaya(e.target.value)
                                        }
                                        className='field'>
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
                                        className='field'
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
                            className='field'
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
                            className='field'
                        />

                        <button
                            type='submit'
                            disabled={isLoading}
                            className='btn-primary mt-2 w-full py-3.5!'>
                            {isLoading ?
                                'Processing...'
                            : isLogin ?
                                'Continue to Workspace'
                            :   'Complete Registration'}
                        </button>
                    </form>

                    <div className='mt-7 text-center text-sm text-(--text-sub)'>
                        {isLogin ?
                            <>
                                Don’t have an account?{' '}
                                <button
                                    onClick={() => setIsLogin(false)}
                                    className='text-accent font-semibold underline-offset-4 hover:underline'>
                                    Register here
                                </button>
                            </>
                        :   <>
                                Already registered?{' '}
                                <button
                                    onClick={() => setIsLogin(true)}
                                    className='text-accent font-semibold underline-offset-4 hover:underline'>
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

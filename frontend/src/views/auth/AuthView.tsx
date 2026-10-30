import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { ALGERIA_WILAYAS } from '../../data/algeria';
import {
    consumeStoredRedirect,
    normalizeRedirect,
    redirectFromLocationState,
} from '../../lib/redirect';
import { homeForUser } from '../../data/routes';
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
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [errorMsg, setErrorMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const setTokens = useAuthStore((state) => state.setTokens);
    const navigate = useNavigate();

    useEffect(() => {
        const requestedRole = searchParams.get('role')?.toUpperCase();

        if (requestedRole === 'RECRUITER' || requestedRole === 'APPLICANT') {
            setRole(requestedRole);
        }

        if (searchParams.get('mode') === 'register') {
            setIsLogin(false);
        } else {
            setIsLogin(true);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!isLogin) {
            if (password.length < 8) {
                setErrorMsg('Password must be at least 8 characters.');
                return;
            }
            if (password !== confirmPassword) {
                setErrorMsg('Passwords do not match.');
                return;
            }
        }

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

            const redirect =
                normalizeRedirect(searchParams.get('redirect')) ??
                normalizeRedirect(redirectFromLocationState(location.state)) ??
                normalizeRedirect(consumeStoredRedirect());

            if (redirect) {
                // Navigate before the auth guard sees the new user; otherwise
                // PublicOnlyRoute can bounce to the role home first.
                navigate(redirect, { replace: true });
            }

            setTokens(data.accessToken, data.user);

            if (!redirect) {
                navigate(homeForUser(data.user), { replace: true });
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
        <div className='page-scroll flex flex-col md:flex-row'>
            <div className='order-2 w-full border-t border-(--border-line) bg-(--bg-panel) p-6 sm:p-8 md:order-1 md:w-[42%] md:border-r md:border-t-0 md:p-14 flex flex-col justify-between'>
                <div className='max-w-md md:my-auto'>
                    <h2 className='font-grotesque font-extrabold text-3xl sm:text-4xl md:text-5xl leading-[1.05] tracking-tight mb-6 md:mb-8 text-(--text-main)'>
                        Every applicant gets either an interview or a path to
                        grow. Guaranteed.
                    </h2>
                    <div className='hidden space-y-4 text-sm text-(--text-main) md:block'>
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
                                Autonomous scheduling and a guaranteed
                                skill-gap analysis.
                            </span>
                        </div>
                    </div>
                </div>
                <div className='hidden font-mono text-xs text-(--text-sub) md:block'>
                    [ALGERIA TALENT INFRASTRUCTURE • 58 WILAYAS]
                </div>
            </div>

            <div className='order-1 w-full p-6 sm:p-8 md:order-2 md:w-[58%] md:p-14 flex flex-col justify-start md:justify-center items-center'>
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
                        <div className='mb-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400'>
                            <p>{errorMsg}</p>
                            {isLogin && (
                                <Link
                                    to='/auth/reset-password'
                                    className='mt-1 inline-block font-semibold underline'>
                                    Reset your password
                                </Link>
                            )}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className='space-y-4'>
                        {!isLogin && (
                            <>
                                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                                    <label className='block'>
                                        <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                            First name
                                        </span>
                                        <input
                                            type='text'
                                            required
                                            autoComplete='given-name'
                                            placeholder='e.g. Amine'
                                            value={firstName}
                                            onChange={(e) =>
                                                setFirstName(e.target.value)
                                            }
                                            className='w-full px-3.5 py-2.5 text-xs rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                                        />
                                    </label>
                                    <label className='block'>
                                        <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                            Last name
                                        </span>
                                        <input
                                            type='text'
                                            required
                                            autoComplete='family-name'
                                            placeholder='e.g. Benali'
                                            value={lastName}
                                            onChange={(e) =>
                                                setLastName(e.target.value)
                                            }
                                            className='w-full px-3.5 py-2.5 text-xs rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                                        />
                                    </label>
                                    <label className='block'>
                                        <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                            Middle name (optional)
                                        </span>
                                        <input
                                            type='text'
                                            autoComplete='additional-name'
                                            placeholder='e.g. Karim'
                                            value={middleName}
                                            onChange={(e) =>
                                                setMiddleName(e.target.value)
                                            }
                                            className='w-full px-3.5 py-2.5 text-xs rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                                        />
                                    </label>
                                    <label className='block'>
                                        <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                            Phone number (optional)
                                        </span>
                                        <input
                                            type='tel'
                                            autoComplete='tel'
                                            placeholder='+213 550 00 00 00'
                                            value={phone}
                                            onChange={(e) =>
                                                setPhone(e.target.value)
                                            }
                                            className='w-full px-3.5 py-2.5 text-xs rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                                        />
                                    </label>
                                </div>

                                <label className='block'>
                                    <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                        Wilaya of residence
                                    </span>
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
                                </label>

                                {role === 'RECRUITER' && (
                                    <label className='block'>
                                        <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                            Company
                                        </span>
                                        <input
                                            type='text'
                                            required
                                            autoComplete='organization'
                                            placeholder="e.g. Sonatrach, Banque d'Algérie"
                                            value={companyName}
                                            onChange={(e) =>
                                                setCompanyName(e.target.value)
                                            }
                                            className='w-full px-3.5 py-2.5 text-xs rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                                        />
                                    </label>
                                )}
                            </>
                        )}

                        <label className='block'>
                            <span className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                Email address
                            </span>
                            <input
                                type='email'
                                required
                                autoComplete='email'
                                placeholder='you@example.com'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className='w-full px-3.5 py-2.5 text-sm rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                            />
                        </label>
                        <div>
                            <div className='mb-1 flex items-center justify-between gap-3'>
                                <label
                                    htmlFor='auth-password'
                                    className='font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                    Password
                                </label>
                                {isLogin && (
                                    <Link
                                        to='/auth/reset-password'
                                        className='text-[11px] font-semibold text-(--text-main) underline'>
                                        Forgot password?
                                    </Link>
                                )}
                            </div>
                            <div className='relative'>
                                <input
                                    id='auth-password'
                                    type={
                                        showPassword ? 'text' : 'password'
                                    }
                                    required
                                    autoComplete={
                                        isLogin ?
                                            'current-password'
                                        :   'new-password'
                                    }
                                    placeholder={
                                        isLogin ?
                                            'Password'
                                        :   'Minimum 8 characters'
                                    }
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    className='w-full px-3.5 py-2.5 pr-10 text-sm rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                                />
                                <button
                                    type='button'
                                    onClick={() =>
                                        setShowPassword((visible) => !visible)
                                    }
                                    aria-label={
                                        showPassword ?
                                            'Hide password'
                                        :   'Show password'
                                    }
                                    className='absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-(--text-sub) transition-colors hover:text-(--text-main)'>
                                    {showPassword ?
                                        <EyeOff size={15} />
                                    :   <Eye size={15} />}
                                </button>
                            </div>
                            {!isLogin && (
                                <p className='mt-1 text-[10px] text-(--text-sub)'>
                                    At least 8 characters.
                                </p>
                            )}
                        </div>

                        {!isLogin && (
                            <div>
                                <label
                                    htmlFor='auth-confirm-password'
                                    className='mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)'>
                                    Confirm password
                                </label>
                                <input
                                    id='auth-confirm-password'
                                    type={
                                        showPassword ? 'text' : 'password'
                                    }
                                    required
                                    autoComplete='new-password'
                                    placeholder='Repeat your password'
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    className='w-full px-3.5 py-2.5 text-sm rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)'
                                />
                            </div>
                        )}

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

                        {!isLogin && (
                            <p className='text-center text-[10px] leading-relaxed text-(--text-sub)'>
                                By creating an account you agree to our{' '}
                                <Link
                                    to='/terms'
                                    className='font-semibold text-(--text-main) underline'>
                                    Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link
                                    to='/privacy'
                                    className='font-semibold text-(--text-main) underline'>
                                    Privacy Policy
                                </Link>
                                .
                            </p>
                        )}
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

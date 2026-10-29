import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound, Mail } from 'lucide-react';
import { apiClient } from '../../api/apiClient';

export default function PasswordResetView() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [delivery, setDelivery] = useState<'development' | 'support'>(
        'development'
    );
    const [devResetUrl, setDevResetUrl] = useState('');
    const [resetDone, setResetDone] = useState(false);

    const handleRequest = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { data } = await apiClient.post('/auth/forgot-password', {
                email,
            });
            setRequestSent(true);
            setDelivery(data.delivery === 'support' ? 'support' : 'development');
            setDevResetUrl(data.devResetUrl ?? '');
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                    'Could not request a reset link. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            await apiClient.post('/auth/reset-password', {
                token,
                password,
                confirmPassword,
            });
            setResetDone(true);
        } catch (err: any) {
            setError(
                err.response?.data?.error ||
                    'Could not reset your password. The link may have expired.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass =
        'w-full px-3.5 py-2.5 text-sm rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)';
    const labelClass =
        'mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-(--text-sub)';

    return (
        <div className='page-scroll flex flex-col px-4 py-10 sm:px-6'>
            <div className='mx-auto flex w-full max-w-md flex-1 flex-col justify-center'>
                <Link
                    to='/auth'
                    className='inline-flex items-center gap-1.5 text-xs font-mono text-(--text-sub) transition-colors hover:text-(--text-main)'>
                    <ArrowLeft size={14} /> Back to login
                </Link>

                <div className='mt-4 rounded-lg border border-(--border-line) bg-(--bg-canvas) p-6 sm:p-8'>
                    {token ?
                        resetDone ?
                            <>
                                <CheckCircle2
                                    size={32}
                                    strokeWidth={1.5}
                                    className='text-forest dark:text-forest-dark'
                                    aria-hidden='true'
                                />
                                <h1 className='mt-4 font-grotesque text-3xl font-bold tracking-tight text-(--text-main)'>
                                    Password updated
                                </h1>
                                <p className='mt-2 text-sm leading-relaxed text-(--text-sub)'>
                                    Your password has been changed. Other
                                    devices will need to sign in again.
                                </p>
                                <Link
                                    to='/auth'
                                    className='mt-6 flex w-full items-center justify-center rounded-md bg-(--btn-main-bg) px-3 py-3 font-grotesque text-lg font-bold text-(--btn-main-text) transition-opacity hover:opacity-90'>
                                    Sign in with your new password
                                </Link>
                            </>
                        :   <>
                                <KeyRound
                                    size={28}
                                    strokeWidth={1.5}
                                    className='text-(--text-sub)'
                                    aria-hidden='true'
                                />
                                <h1 className='mt-3 font-grotesque text-3xl font-bold tracking-tight text-(--text-main)'>
                                    Set a new password
                                </h1>
                                <p className='mt-2 text-xs leading-relaxed text-(--text-sub)'>
                                    Choose a new password for your account. This
                                    reset link expires after 30 minutes.
                                </p>

                                {error && (
                                    <div
                                        role='alert'
                                        className='mt-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400'>
                                        {error}
                                    </div>
                                )}

                                <form
                                    onSubmit={handleReset}
                                    className='mt-5 space-y-4'>
                                    <div>
                                        <label
                                            htmlFor='new-password'
                                            className={labelClass}>
                                            New password
                                        </label>
                                        <input
                                            id='new-password'
                                            type='password'
                                            required
                                            autoComplete='new-password'
                                            placeholder='At least 8 characters'
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor='confirm-password'
                                            className={labelClass}>
                                            Confirm new password
                                        </label>
                                        <input
                                            id='confirm-password'
                                            type='password'
                                            required
                                            autoComplete='new-password'
                                            placeholder='Repeat the new password'
                                            value={confirmPassword}
                                            onChange={(e) =>
                                                setConfirmPassword(
                                                    e.target.value
                                                )
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                    <p className='text-[10px] text-(--text-sub)'>
                                        At least 8 characters. Other devices
                                        will be asked to sign in again.
                                    </p>
                                    <button
                                        type='submit'
                                        disabled={isLoading}
                                        className='w-full rounded-md bg-(--btn-main-bg) py-3 font-grotesque text-lg font-bold text-(--btn-main-text) transition-opacity hover:opacity-90 disabled:opacity-50'>
                                        {isLoading ?
                                            'Updating...'
                                        :   'Update password'}
                                    </button>
                                </form>
                            </>
                    :   requestSent ?
                        <>
                            <Mail
                                size={32}
                                strokeWidth={1.5}
                                className='text-forest dark:text-forest-dark'
                                aria-hidden='true'
                            />
                            <h1 className='mt-4 font-grotesque text-3xl font-bold tracking-tight text-(--text-main)'>
                                {delivery === 'support' ?
                                    'Contact support'
                                :   'Check your email'}
                            </h1>
                            {delivery === 'support' ?
                                <p className='mt-2 text-sm leading-relaxed text-(--text-sub)'>
                                    Automated reset emails are not available
                                    yet. Email{' '}
                                    <a
                                        href='mailto:contact@skillora.dz?subject=Password%20reset%20help'
                                        className='font-semibold text-(--text-main) underline'>
                                        contact@skillora.dz
                                    </a>{' '}
                                    from the address on your account and
                                    we&apos;ll help you regain access.
                                </p>
                            :   <p className='mt-2 text-sm leading-relaxed text-(--text-sub)'>
                                    If an account exists for{' '}
                                    <span className='font-semibold text-(--text-main)'>
                                        {email}
                                    </span>
                                    , a reset link is on its way. The link
                                    expires in 30 minutes.
                                </p>
                            }

                            {delivery === 'development' && devResetUrl && (
                                <div className='mt-5 rounded-md border border-amber-accent/30 bg-amber-accent/10 p-3'>
                                    <p className='font-mono text-[9px] uppercase tracking-[0.14em] text-amber-accent'>
                                        Development only
                                    </p>
                                    <a
                                        href={devResetUrl}
                                        className='mt-1 inline-block text-xs font-semibold text-(--text-main) underline'>
                                        Open reset link
                                    </a>
                                </div>
                            )}

                            {delivery !== 'support' && (
                                <p className='mt-5 text-xs leading-relaxed text-(--text-sub)'>
                                    Still not receiving it?{' '}
                                    <a
                                        href='mailto:contact@skillora.dz?subject=Password%20reset%20help'
                                        className='font-semibold text-(--text-main) underline'>
                                        Contact support
                                    </a>
                                    .
                                </p>
                            )}

                            <Link
                                to='/auth'
                                className='mt-6 flex w-full items-center justify-center rounded-md border border-(--border-line) px-3 py-3 text-sm font-medium text-(--text-main) transition-colors hover:bg-(--bg-panel)'>
                                Back to login
                            </Link>
                        </>
                    :   <>
                            <KeyRound
                                size={28}
                                strokeWidth={1.5}
                                className='text-(--text-sub)'
                                aria-hidden='true'
                            />
                            <h1 className='mt-3 font-grotesque text-3xl font-bold tracking-tight text-(--text-main)'>
                                Reset your password
                            </h1>
                            <p className='mt-2 text-xs leading-relaxed text-(--text-sub)'>
                                Enter the email on your account and we&apos;ll
                                send you a link to set a new password.
                            </p>

                            {error && (
                                <div
                                    role='alert'
                                    className='mt-4 rounded border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400'>
                                    {error}
                                </div>
                            )}

                            <form
                                onSubmit={handleRequest}
                                className='mt-5 space-y-4'>
                                <div>
                                    <label
                                        htmlFor='reset-email'
                                        className={labelClass}>
                                        Email address
                                    </label>
                                    <input
                                        id='reset-email'
                                        type='email'
                                        required
                                        autoComplete='email'
                                        placeholder='you@example.com'
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        className={inputClass}
                                    />
                                </div>
                                <button
                                    type='submit'
                                    disabled={isLoading}
                                    className='w-full rounded-md bg-(--btn-main-bg) py-3 font-grotesque text-lg font-bold text-(--btn-main-text) transition-opacity hover:opacity-90 disabled:opacity-50'>
                                    {isLoading ?
                                        'Sending...'
                                    :   'Send reset link'}
                                </button>
                            </form>

                            <p className='mt-5 text-center text-xs text-(--text-sub)'>
                                Remembered it?{' '}
                                <Link
                                    to='/auth'
                                    className='font-semibold text-(--text-main) underline'>
                                    Log in
                                </Link>
                            </p>
                        </>
                    }
                </div>
            </div>
        </div>
    );
}

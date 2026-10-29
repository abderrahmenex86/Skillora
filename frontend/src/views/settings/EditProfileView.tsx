import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
    ArrowLeft,
    Check,
    ChevronDown,
    KeyRound,
    Loader2,
    Save,
    ShieldCheck,
} from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { ALGERIA_WILAYAS } from '../../data/algeria';
import { roleHome } from '../../data/routes';
import { useAuthStore, type User } from '../../store/useAuthStore';
import Footer from '../../components/Footer';

const inputClass =
    'w-full px-3.5 py-2.5 text-sm rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main) disabled:opacity-60 disabled:cursor-not-allowed';

const labelClass =
    'block text-[11px] font-mono text-(--text-sub) uppercase mb-1';

const WILAYA_OPTIONS: readonly string[] = ALGERIA_WILAYAS;

interface ProfilePayload {
    firstName: string;
    middleName?: string;
    lastName: string;
    phone?: string;
    wilaya?: string;
    companyName?: string;
}

interface PasswordPayload {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

function getApiErrorMessage(error: unknown, fallback: string) {
    if (!axios.isAxiosError(error)) return fallback;

    const data = error.response?.data as
        | {
              error?: string;
              issues?: Array<{ message?: string }>;
          }
        | undefined;

    if (data?.issues?.length) {
        return data.issues
            .map((issue) => issue.message)
            .filter(Boolean)
            .join(' • ');
    }

    return data?.error || fallback;
}

export default function EditProfileView() {
    const user = useAuthStore((state) => state.user);

    const [firstName, setFirstName] = useState(user?.firstName ?? '');
    const [middleName, setMiddleName] = useState(user?.middleName ?? '');
    const [lastName, setLastName] = useState(user?.lastName ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [wilaya, setWilaya] = useState(user?.wilaya ?? '16 - Alger');
    const [companyName, setCompanyName] = useState(user?.companyName ?? '');

    const [securityOpen, setSecurityOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMismatch, setPasswordMismatch] = useState('');

    const profileMutation = useMutation({
        mutationFn: async (payload: ProfilePayload) => {
            const { data } = await apiClient.patch<{ user: User }>(
                '/auth/me',
                payload
            );
            return data.user;
        },
        onMutate: (payload) => {
            const previousUser = useAuthStore.getState().user;

            if (previousUser) {
                useAuthStore.getState().setUser({
                    ...previousUser,
                    firstName: payload.firstName,
                    middleName: payload.middleName ?? null,
                    lastName: payload.lastName,
                    phone: payload.phone ?? null,
                    wilaya: payload.wilaya ?? null,
                    companyName: payload.companyName ?? null,
                });
            }

            return { previousUser };
        },
        onError: (_error, _payload, context) => {
            if (context?.previousUser) {
                useAuthStore.getState().setUser(context.previousUser);
            }
        },
        onSuccess: (updatedUser) => {
            useAuthStore.getState().setUser(updatedUser);
        },
    });

    const passwordMutation = useMutation({
        mutationFn: async (payload: PasswordPayload) => {
            const { data } = await apiClient.patch<{ message: string }>(
                '/auth/me/password',
                payload
            );
            return data;
        },
        onSuccess: () => {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordMismatch('');
        },
    });

    if (!user) return null;

    const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        profileMutation.mutate({
            firstName: firstName.trim(),
            middleName: middleName.trim() || undefined,
            lastName: lastName.trim(),
            phone: phone.trim() || undefined,
            wilaya,
            companyName:
                user.role === 'RECRUITER' ?
                    companyName.trim() || undefined
                :   undefined,
        });
    };

    const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPasswordMismatch('');

        if (newPassword !== confirmPassword) {
            setPasswordMismatch('New passwords do not match.');
            return;
        }

        passwordMutation.mutate({
            currentPassword,
            newPassword,
            confirmPassword,
        });
    };

    const handleSecurityToggle = () => {
        setSecurityOpen((open) => !open);
        passwordMutation.reset();
        setPasswordMismatch('');
    };

    return (
        <div className='page-scroll w-full max-w-3xl mx-auto px-6 py-8'>
            <Link
                to={roleHome[user.role]}
                className='inline-flex items-center gap-1.5 text-xs font-mono text-(--text-sub) hover:text-(--text-main) transition-colors mb-6'>
                <ArrowLeft size={14} />
                Back to Dashboard
            </Link>

            <div className='mb-8 border-b border-(--border-line) pb-6'>
                <h1 className='font-grotesque font-extrabold text-4xl text-(--text-main) tracking-tight'>
                    Edit Profile
                </h1>
                <p className='text-sm text-(--text-sub) mt-2'>
                    Keep the details employers and candidates see accurate. You
                    can also rotate your password from the security section.
                </p>
            </div>

            <form
                onSubmit={handleProfileSubmit}
                className='border border-(--border-line) rounded-lg bg-(--bg-panel) p-6 md:p-8 space-y-5'>
                <div className='font-mono text-[11px] text-(--text-sub) uppercase tracking-wider pb-1 border-b border-(--border-line)'>
                    Personal Information
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                        <label
                            htmlFor='firstName'
                            className={labelClass}>
                            First Name
                        </label>
                        <input
                            id='firstName'
                            type='text'
                            required
                            minLength={2}
                            autoComplete='given-name'
                            value={firstName}
                            onChange={(event) =>
                                setFirstName(event.target.value)
                            }
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor='middleName'
                            className={labelClass}>
                            Middle Name (Optional)
                        </label>
                        <input
                            id='middleName'
                            type='text'
                            autoComplete='additional-name'
                            value={middleName}
                            onChange={(event) =>
                                setMiddleName(event.target.value)
                            }
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                        <label
                            htmlFor='lastName'
                            className={labelClass}>
                            Last Name
                        </label>
                        <input
                            id='lastName'
                            type='text'
                            required
                            minLength={2}
                            autoComplete='family-name'
                            value={lastName}
                            onChange={(event) =>
                                setLastName(event.target.value)
                            }
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor='phone'
                            className={labelClass}>
                            Phone Number (Optional)
                        </label>
                        <input
                            id='phone'
                            type='tel'
                            minLength={8}
                            autoComplete='tel'
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor='email'
                        className={labelClass}>
                        Email
                    </label>
                    <input
                        id='email'
                        type='email'
                        disabled
                        value={user.email}
                        className={inputClass}
                    />
                </div>

                <div>
                    <label
                        htmlFor='wilaya'
                        className={labelClass}>
                        Wilaya of Residence
                    </label>
                    <select
                        id='wilaya'
                        value={wilaya}
                        onChange={(event) => setWilaya(event.target.value)}
                        className={inputClass}>
                        {wilaya && !WILAYA_OPTIONS.includes(wilaya) && (
                            <option value={wilaya}>{wilaya}</option>
                        )}
                        {WILAYA_OPTIONS.map((entry) => (
                            <option
                                key={entry}
                                value={entry}>
                                {entry}
                            </option>
                        ))}
                    </select>
                </div>

                {user.role === 'RECRUITER' && (
                    <div>
                        <label
                            htmlFor='companyName'
                            className={labelClass}>
                            Company or Organization
                        </label>
                        <input
                            id='companyName'
                            type='text'
                            autoComplete='organization'
                            value={companyName}
                            onChange={(event) =>
                                setCompanyName(event.target.value)
                            }
                            className={inputClass}
                        />
                    </div>
                )}

                {profileMutation.isPending && (
                    <div className='flex items-center gap-2 p-3 text-xs rounded border border-(--border-line) bg-(--bg-canvas) text-(--text-sub)'>
                        <Loader2
                            size={14}
                            className='animate-spin'
                        />
                        Syncing profile changes...
                    </div>
                )}

                {profileMutation.isSuccess && !profileMutation.isPending && (
                    <div className='flex items-center gap-2 p-3 text-xs rounded border border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400'>
                        <Check size={14} />
                        Profile updated and synced to your account.
                    </div>
                )}

                {profileMutation.isError && (
                    <div className='p-3 text-xs rounded border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'>
                        {getApiErrorMessage(
                            profileMutation.error,
                            'Could not update your profile.'
                        )}
                    </div>
                )}

                <div className='flex items-center justify-end gap-3 pt-2'>
                    <Link
                        to={roleHome[user.role]}
                        className='px-4 py-2.5 text-sm font-medium rounded-md border border-(--border-line) text-(--text-main) hover:bg-(--bg-canvas) transition-colors'>
                        Cancel
                    </Link>
                    <button
                        type='submit'
                        disabled={profileMutation.isPending}
                        className='inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md bg-(--btn-main-bg) text-(--btn-main-text) hover:opacity-90 transition-opacity disabled:opacity-50'>
                        {profileMutation.isPending ?
                            <Loader2
                                size={15}
                                className='animate-spin'
                            />
                        :   <Save size={15} />}
                        {profileMutation.isPending ?
                            'Saving...'
                        :   'Save Changes'}
                    </button>
                </div>
            </form>

            <section className='mt-6 border border-(--border-line) rounded-lg bg-(--bg-panel) overflow-hidden'>
                <button
                    type='button'
                    onClick={handleSecurityToggle}
                    aria-expanded={securityOpen}
                    className='flex w-full items-center justify-between gap-4 px-6 py-4 md:px-8 text-left hover:bg-(--bg-canvas) transition-colors cursor-pointer'>
                    <div className='flex items-center gap-3'>
                        <div className='p-2 rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main)'>
                            <ShieldCheck size={17} />
                        </div>
                        <div>
                            <div className='font-grotesque font-bold text-2xl text-(--text-main) leading-tight'>
                                Security
                            </div>
                            <div className='text-xs text-(--text-sub)'>
                                Rotate your password. Leave closed to keep the
                                current one.
                            </div>
                        </div>
                    </div>
                    <ChevronDown
                        size={17}
                        className={`shrink-0 text-(--text-sub) transition-transform duration-200 ${
                            securityOpen ? 'rotate-180' : ''
                        }`}
                    />
                </button>

                {securityOpen && (
                    <form
                        onSubmit={handlePasswordSubmit}
                        className='border-t border-(--border-line) px-6 py-5 md:px-8 space-y-4'>
                        <div className='flex items-center gap-2 font-mono text-[11px] text-(--text-sub) uppercase tracking-wider'>
                            <KeyRound size={13} />
                            Password Change
                        </div>

                        <div>
                            <label
                                htmlFor='currentPassword'
                                className={labelClass}>
                                Current Password
                            </label>
                            <input
                                id='currentPassword'
                                type='password'
                                required
                                autoComplete='current-password'
                                value={currentPassword}
                                onChange={(event) =>
                                    setCurrentPassword(event.target.value)
                                }
                                className={inputClass}
                            />
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            <div>
                                <label
                                    htmlFor='newPassword'
                                    className={labelClass}>
                                    New Password
                                </label>
                                <input
                                    id='newPassword'
                                    type='password'
                                    required
                                    minLength={8}
                                    autoComplete='new-password'
                                    value={newPassword}
                                    onChange={(event) =>
                                        setNewPassword(event.target.value)
                                    }
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor='confirmPassword'
                                    className={labelClass}>
                                    Confirm New Password
                                </label>
                                <input
                                    id='confirmPassword'
                                    type='password'
                                    required
                                    minLength={8}
                                    autoComplete='new-password'
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(event.target.value)
                                    }
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <p className='font-mono text-[11px] text-(--text-sub)'>
                            Minimum 8 characters. New password must differ from
                            the current one.
                        </p>

                        {passwordMismatch && (
                            <div className='p-3 text-xs rounded border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'>
                                {passwordMismatch}
                            </div>
                        )}

                        {passwordMutation.isSuccess && (
                            <div className='flex items-center gap-2 p-3 text-xs rounded border border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-400'>
                                <Check size={14} />
                                {passwordMutation.data?.message ||
                                    'Password updated successfully.'}
                            </div>
                        )}

                        {passwordMutation.isError && (
                            <div className='p-3 text-xs rounded border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400'>
                                {getApiErrorMessage(
                                    passwordMutation.error,
                                    'Could not update your password.'
                                )}
                            </div>
                        )}

                        <div className='flex items-center justify-end pt-1'>
                            <button
                                type='submit'
                                disabled={passwordMutation.isPending}
                                className='inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md bg-(--btn-main-bg) text-(--btn-main-text) hover:opacity-90 transition-opacity disabled:opacity-50'>
                                {passwordMutation.isPending ?
                                    <Loader2
                                        size={15}
                                        className='animate-spin'
                                    />
                                :   <KeyRound size={15} />}
                                {passwordMutation.isPending ?
                                    'Updating...'
                                :   'Update Password'}
                            </button>
                        </div>
                    </form>
                )}
            </section>
            <Footer />
        </div>
    );
}

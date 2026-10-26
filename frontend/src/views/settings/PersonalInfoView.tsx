import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { apiClient } from '../../api/apiClient';
import { ALGERIA_WILAYAS } from '../../data/algeria';
import { roleHome } from '../../data/routes';
import { useAuthStore } from '../../store/useAuthStore';

const inputClass =
    'w-full px-3.5 py-2.5 text-sm rounded-md border border-(--border-line) bg-(--bg-canvas) text-(--text-main) focus:outline-none focus:ring-1 focus:ring-(--text-main)';

const labelClass =
    'block text-[11px] font-mono text-(--text-sub) uppercase mb-1';

export default function PersonalInfoView() {
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);

    const [firstName, setFirstName] = useState(user?.firstName ?? '');
    const [middleName, setMiddleName] = useState(user?.middleName ?? '');
    const [lastName, setLastName] = useState(user?.lastName ?? '');
    const [phone, setPhone] = useState(user?.phone ?? '');
    const [wilaya, setWilaya] = useState(user?.wilaya ?? '16 - Alger');
    const [companyName, setCompanyName] = useState(user?.companyName ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (!user) return;

        setFirstName(user.firstName ?? '');
        setMiddleName(user.middleName ?? '');
        setLastName(user.lastName ?? '');
        setPhone(user.phone ?? '');
        setWilaya(user.wilaya ?? '16 - Alger');
        setCompanyName(user.companyName ?? '');
    }, [user]);

    if (!user) return null;

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccessMsg('');
        setErrorMsg('');
        setIsSaving(true);

        try {
            const { data } = await apiClient.patch('/auth/me', {
                firstName,
                middleName: middleName || undefined,
                lastName,
                phone: phone || undefined,
                wilaya,
                companyName:
                    user.role === 'RECRUITER' ?
                        companyName || undefined
                    :   undefined,
            });
            setUser(data.user);
            setSuccessMsg('Personal information updated.');
        } catch (err: any) {
            if (err.response?.data?.issues) {
                setErrorMsg(
                    err.response.data.issues
                        .map((issue: any) => issue.message)
                        .join(' • ')
                );
            } else {
                setErrorMsg(
                    err.response?.data?.error ||
                        'Could not update your personal information.'
                );
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className='flex-1 max-w-3xl w-full mx-auto px-6 py-8'>
            <Link
                to={roleHome[user.role]}
                className='inline-flex items-center gap-1.5 text-xs font-mono text-(--text-sub) hover:text-(--text-main) transition-colors mb-6'>
                <ArrowLeft size={14} />
                Back to Dashboard
            </Link>

            <div className='mb-8 border-b border-(--border-line) pb-6'>
                <h1 className='font-grotesque font-extrabold text-4xl text-(--text-main) tracking-tight'>
                    Personal Information
                </h1>
                <p className='text-sm text-(--text-sub) mt-2'>
                    Keep the details employers and candidates see up to date.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className='border border-(--border-line) rounded-lg bg-(--bg-panel) p-6 md:p-8 space-y-5'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div>
                        <label className={labelClass}>First Name</label>
                        <input
                            type='text'
                            required
                            minLength={2}
                            value={firstName}
                            onChange={(event) =>
                                setFirstName(event.target.value)
                            }
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>
                            Middle Name (Optional)
                        </label>
                        <input
                            type='text'
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
                        <label className={labelClass}>Last Name</label>
                        <input
                            type='text'
                            required
                            minLength={2}
                            value={lastName}
                            onChange={(event) =>
                                setLastName(event.target.value)
                            }
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Phone (Optional)</label>
                        <input
                            type='tel'
                            minLength={8}
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            className={inputClass}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Email</label>
                    <input
                        type='email'
                        disabled
                        value={user.email}
                        className={`${inputClass} opacity-60 cursor-not-allowed`}
                    />
                </div>

                <div>
                    <label className={labelClass}>Wilaya of Residence</label>
                    <select
                        value={wilaya}
                        onChange={(event) => setWilaya(event.target.value)}
                        className={inputClass}>
                        {ALGERIA_WILAYAS.map((w) => (
                            <option
                                key={w}
                                value={w}>
                                {w}
                            </option>
                        ))}
                    </select>
                </div>

                {user.role === 'RECRUITER' && (
                    <div>
                        <label className={labelClass}>
                            Company or Organization
                        </label>
                        <input
                            type='text'
                            value={companyName}
                            onChange={(event) =>
                                setCompanyName(event.target.value)
                            }
                            className={inputClass}
                        />
                    </div>
                )}

                {successMsg && (
                    <div className='p-3 text-xs bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded'>
                        {successMsg}
                    </div>
                )}

                {errorMsg && (
                    <div className='p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-600 rounded'>
                        {errorMsg}
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
                        disabled={isSaving}
                        className='inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-md bg-(--btn-main-bg) text-(--btn-main-text) hover:opacity-90 transition-opacity disabled:opacity-50'>
                        <Save size={15} />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}

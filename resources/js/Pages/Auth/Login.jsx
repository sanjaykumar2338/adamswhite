import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PasswordInput from '@/Components/PasswordInput';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { useTranslation } from '@/i18n';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword, adminPortal = false }) {
    const { t } = useTranslation();
    const form = useForm({ email: '', password: '', remember: false });

    return <GuestLayout adminPortal={adminPortal}>
        <Head title={t('auth.login')} />
        <p className="section-eyebrow">{t('auth.welcome_eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0B132B] sm:text-4xl">{t('auth.login')}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{t('auth.login_intro')}</p>
        {status && <p role="status" className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{status}</p>}
        <form className="mt-7 space-y-5" onSubmit={(event) => { event.preventDefault(); form.post(route('login'), { onFinish: () => form.reset('password') }); }}>
            <Field label={t('common.email')} id="email" error={form.errors.email}><TextInput id="email" name="email" type="email" autoComplete="username" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} className="mt-1 block w-full" required /></Field>
            <Field label={t('common.password')} id="password" error={form.errors.password}><PasswordInput id="password" autoComplete="current-password" value={form.data.password} onChange={(event) => form.setData('password', event.target.value)} className="mt-1" required t={t} /></Field>
            <div className="flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm font-medium text-slate-600"><Checkbox checked={form.data.remember} onChange={(event) => form.setData('remember', event.target.checked)} />{t('auth.remember')}</label>{canResetPassword && <Link href={route('password.request')} className="text-sm font-bold text-[#9A6417] hover:text-[#0B132B]">{t('auth.forgot')}</Link>}</div>
            <PrimaryButton className="w-full" disabled={form.processing}>{t('auth.login')}</PrimaryButton>
            <p className="text-center text-sm text-slate-500">{t('auth.new_here')} <Link href={route('register')} className="font-black text-[#0B132B] underline decoration-[#F4B942] decoration-2 underline-offset-4">{t('auth.no_account')}</Link></p>
        </form>
    </GuestLayout>;
}

function Field({ label, id, error, children }) {
    return <div><InputLabel htmlFor={id} value={label} />{children}<InputError message={error} className="mt-2" /></div>;
}

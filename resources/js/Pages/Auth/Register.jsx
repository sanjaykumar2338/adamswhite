import AccountTypeCards from '@/Components/AccountTypeCards';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PasswordInput from '@/Components/PasswordInput';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { useTranslation } from '@/i18n';
import { isBusinessNameRequired } from '@/lib/registration';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { t } = useTranslation();
    const form = useForm({ name: '', business_name: '', account_type: '', email: '', password: '', password_confirmation: '' });
    const businessNameRequired = isBusinessNameRequired(form.data.account_type);

    return <GuestLayout wide>
        <Head title={t('auth.register')} />
        <p className="section-eyebrow">{t('auth.register_eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0B132B] sm:text-4xl">{t('auth.register')}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{t('auth.register_intro')}</p>
        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); form.post(route('register'), { onFinish: () => form.reset('password', 'password_confirmation') }); }}>
            <div className="sm:col-span-2"><AccountTypeCards value={form.data.account_type} onChange={(value) => form.setData('account_type', value)} error={form.errors.account_type} t={t} /></div>
            <Field label={t('common.name')} id="name" error={form.errors.name}><TextInput id="name" autoComplete="name" value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} className="mt-1.5 block w-full" required /></Field>
            <Field label={businessNameRequired ? t('common.business_name') : t('auth.creator_name_optional')} id="business_name" error={form.errors.business_name}><TextInput id="business_name" autoComplete="organization" value={form.data.business_name} onChange={(event) => form.setData('business_name', event.target.value)} className="mt-1.5 block w-full" required={businessNameRequired} /></Field>
            <div className="sm:col-span-2"><Field label={t('common.email')} id="email" error={form.errors.email}><TextInput id="email" type="email" autoComplete="username" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} className="mt-1.5 block w-full" required /></Field></div>
            <Field label={t('common.password')} id="password" error={form.errors.password}><PasswordInput id="password" autoComplete="new-password" value={form.data.password} onChange={(event) => form.setData('password', event.target.value)} className="mt-1.5" required t={t} /></Field>
            <Field label={t('common.confirm_password')} id="password_confirmation" error={form.errors.password_confirmation}><PasswordInput id="password_confirmation" autoComplete="new-password" value={form.data.password_confirmation} onChange={(event) => form.setData('password_confirmation', event.target.value)} className="mt-1.5" required t={t} /></Field>
            <div className="sm:col-span-2 pt-1"><PrimaryButton className="w-full" disabled={form.processing}>{t('auth.register')}</PrimaryButton><p className="mt-4 text-center text-sm text-slate-500">{t('auth.already')} <Link href={route('login')} className="font-black text-[#0B132B] underline decoration-[#F4B942] decoration-2 underline-offset-4">{t('auth.login')}</Link></p></div>
        </form>
    </GuestLayout>;
}

function Field({ label, id, error, children }) {
    return <div><InputLabel htmlFor={id} value={label} />{children}<InputError message={error} className="mt-2" /></div>;
}

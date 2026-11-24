import AccountTypeCards from '@/Components/AccountTypeCards';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { useTranslation } from '@/i18n';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { t } = useTranslation();
    const form = useForm({ name: '', business_name: '', account_type: '', email: '', password: '', password_confirmation: '' });
    const fields = [
        ['name', t('common.name'), 'text', 'name'],
        ['business_name', t('common.business_name'), 'text', 'organization'],
        ['email', t('common.email'), 'email', 'username'],
        ['password', t('common.password'), 'password', 'new-password'],
        ['password_confirmation', t('common.confirm_password'), 'password', 'new-password'],
    ];

    return <GuestLayout>
        <Head title={t('auth.register')} />
        <p className="section-eyebrow">{t('auth.register_eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0B132B] sm:text-4xl">{t('auth.register')}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">{t('auth.register_intro')}</p>
        <form className="mt-7 grid gap-5 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); form.post(route('register'), { onFinish: () => form.reset('password', 'password_confirmation') }); }}>
            <div className="sm:col-span-2"><AccountTypeCards value={form.data.account_type} onChange={(value) => form.setData('account_type', value)} error={form.errors.account_type} t={t} /></div>
            {fields.map(([id, label, type, auto], index) => <div className={index > 1 ? 'sm:col-span-2' : ''} key={id}><InputLabel htmlFor={id} value={label} /><TextInput id={id} type={type} autoComplete={auto} value={form.data[id]} onChange={(event) => form.setData(id, event.target.value)} className="mt-2 block w-full" required /><InputError message={form.errors[id]} className="mt-2" /></div>)}
            <div className="sm:col-span-2"><PrimaryButton className="w-full" disabled={form.processing}>{t('auth.register')}</PrimaryButton><p className="mt-5 text-center text-sm text-slate-500">{t('auth.already')} <Link href={route('login')} className="font-black text-[#0B132B] underline decoration-[#F4B942] decoration-2 underline-offset-4">{t('auth.login')}</Link></p></div>
        </form>
    </GuestLayout>;
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head, Link, usePage } from '@inertiajs/react';
import PrivacySettings from './Partials/PrivacySettings';
import SecuritySettings from './Partials/SecuritySettings';
import TeamSettings from './Partials/TeamSettings';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status, activeTab, customer, role, members, invitations, sessions, deletionRequest }) {
    const { t } = useTranslation();
    const flash = usePage().props.flash;
    const tabs = [['profile', t('settings.profile')], ['security', t('settings.security')], ['team', t('settings.team')], ['privacy', t('settings.privacy')]];

    return <AuthenticatedLayout header={<><p className="text-xs font-bold uppercase tracking-[.2em] text-[#B8773C]">SHIFTRIX TRACK</p><p className="mt-0.5 text-sm font-semibold text-slate-500">{t('settings.workspace')}</p></>}>
        <Head title={t('settings.title')} />
        <div className="mx-auto max-w-[1400px] px-4 py-7 sm:px-6 lg:px-8 xl:px-10">
            <section className="rounded-3xl bg-[#0B132B] px-6 py-7 text-white shadow-xl shadow-[#0B132B]/10 sm:px-8 sm:py-9"><p className="text-xs font-black uppercase tracking-[.22em] text-[#F1C156]">{t('settings.eyebrow')}</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">{t('settings.title')}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{t('settings.intro')}</p></section>
            {flash.success && <div role="status" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">{flash.success}</div>}
            <nav className="mt-5 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:flex" aria-label={t('settings.tabs')}>{tabs.map(([key, label]) => <Link key={key} href={route('profile.edit', { tab: key })} className={`rounded-xl px-3 py-3 text-center text-sm font-black transition sm:px-4 ${activeTab === key ? 'bg-[#E1A339] text-[#0B132B]' : 'text-slate-500 hover:bg-slate-100 hover:text-[#0B132B]'}`}>{label}</Link>)}</nav>
            <div className="mt-5">{activeTab === 'profile' && <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} />}{activeTab === 'security' && <SecuritySettings sessions={sessions} />}{activeTab === 'team' && <TeamSettings customer={customer} role={role} members={members} invitations={invitations} />}{activeTab === 'privacy' && <PrivacySettings role={role} deletionRequest={deletionRequest} />}</div>
        </div>
    </AuthenticatedLayout>;
}

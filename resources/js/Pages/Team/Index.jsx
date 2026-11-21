import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function Team({ customer, role, members, invitations }) {
    const { locale, t } = useTranslation();
    const flash = usePage().props.flash;
    const form = useForm({ email: '' });

    return <AuthenticatedLayout>
        <Head title={t('team.title')} />
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {flash.success && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-800">{flash.success}</div>}

            <section className="relative overflow-hidden rounded-[1.75rem] bg-[#0B132B] px-6 py-7 text-white shadow-xl shadow-[#0B132B]/15 sm:px-8 sm:py-9">
                <div className="relative z-10 max-w-2xl">
                    <p className="text-sm font-bold uppercase tracking-[.2em] text-[#FFDC7A]">{t('team.workspace')}</p>
                    <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t('team.title')}</h1>
                    <p className="mt-3 text-base leading-7 text-slate-300">{t('team.overview', { business: customer.business_name })}</p>
                </div>
                <span className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full border border-[#F4B942]/20" />
                <span className="pointer-events-none absolute -right-4 top-4 h-32 w-32 rounded-full bg-[#F4B942]/10 blur-2xl" />
            </section>

            <div className={`mt-5 grid gap-5 ${role === 'owner' ? 'lg:grid-cols-[minmax(0,1.25fr)_minmax(19rem,.75fr)]' : ''}`}>
                <section className="surface-card overflow-hidden rounded-2xl bg-white">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
                        <div><p className="text-sm font-bold uppercase tracking-[.16em] text-[#B7791F]">{t('team.directory')}</p><h2 className="mt-1 text-xl font-extrabold text-[#0B132B]">{t('team.members')}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{t('team.members_help')}</p></div>
                        <span className="shrink-0 rounded-full bg-[#0B132B] px-3 py-1.5 text-sm font-bold text-[#FFDC7A]">{members.length.toLocaleString(locale)}</span>
                    </div>
                    <div className="divide-y divide-slate-100 px-5 sm:px-6">
                        {members.map(member => <div className="flex items-center justify-between gap-4 py-4" key={member.id}>
                            <div className="flex min-w-0 items-center gap-3.5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-sm font-extrabold text-[#B7791F]">{member.name.charAt(0).toUpperCase()}</span><div className="min-w-0"><p className="truncate font-bold text-[#0B132B]">{member.name}</p><p className="truncate text-sm text-slate-500">{member.email}</p></div></div>
                            <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${member.pivot.role === 'owner' ? 'bg-[#0B132B] text-[#FFDC7A]' : 'bg-slate-100 text-slate-600'}`}>{t(`team.${member.pivot.role}`)}</span>
                        </div>)}
                    </div>
                </section>

                {role === 'owner' && <form className="surface-card h-fit rounded-2xl bg-white p-5 sm:p-6" onSubmit={event => { event.preventDefault(); form.post(route('team.store'), { onSuccess: () => form.reset() }); }}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B132B] text-[#FFDC7A]" aria-hidden="true"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 19a6 6 0 0 0-12 0m6-8a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10-1v6m3-3h-6" /></svg></div>
                    <h2 className="mt-5 text-xl font-extrabold text-[#0B132B]">{t('team.invite')}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{t('team.invite_help')}</p>
                    <label className="mt-5 block text-sm font-semibold text-slate-700">{t('common.email')}<input type="email" className="mt-2 w-full rounded-xl border-slate-300 px-4 py-3 focus:border-[#F4B942] focus:ring-[#F4B942]" value={form.data.email} onChange={event => form.setData('email', event.target.value)} placeholder={t('team.email_placeholder')} required /></label>
                    {form.errors.email && <p className="mt-2 text-sm text-red-600">{form.errors.email}</p>}
                    <button disabled={form.processing} className="gold-button mt-4 w-full rounded-xl px-5 py-3 font-bold disabled:opacity-50">{t('team.send')}</button>
                    <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm"><span className="font-medium text-slate-500">{t('team.pending_label')}</span><span className="font-extrabold text-[#0B132B]">{invitations.length.toLocaleString(locale)}</span></div>
                </form>}
            </div>
        </div>
    </AuthenticatedLayout>;
}

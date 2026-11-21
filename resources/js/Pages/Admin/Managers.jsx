import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Managers({ members, invitations, filters, summary }) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    const apply = status => router.get(route('admin.managers.index'), { search, status }, { preserveState: true });
    const statusText = state => state === 'pending' ? t('team.state_pending') : state === 'revoked' ? t('team.state_revoked') : t('common.status_active');

    return <AuthenticatedLayout><Head title={t('admin.managers')}/><div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-[#0B132B] p-7 text-white"><p className="text-xs font-black uppercase tracking-[.2em] text-[#F1C156]">SHIFTRIX TRACK</p><h1 className="mt-2 text-3xl font-black">{t('admin.managers')}</h1><p className="mt-2 text-slate-300">{t('admin.managers_help')}</p></section>
        <div className="mt-5 grid grid-cols-3 gap-3">{['active', 'pending', 'revoked'].map(state => <button type="button" onClick={() => apply(state)} className={`rounded-2xl border bg-white p-4 text-left sm:p-5 ${filters.status === state ? 'border-[#E1A339] ring-2 ring-[#E1A339]/20' : 'border-slate-200'}`} key={state}><p className="text-xs font-bold uppercase text-slate-500">{t(`admin.manager_${state}`)}</p><p className="mt-2 text-3xl font-black">{summary[state]}</p></button>)}</div>
        <form onSubmit={event => { event.preventDefault(); apply(filters.status); }} className="mt-5 flex gap-2 rounded-2xl border border-slate-200 bg-white p-5"><input className="premium-input mt-0" value={search} onChange={event => setSearch(event.target.value)} placeholder={t('admin.search_managers')}/><button className="rounded-xl bg-[#0B132B] px-5 font-bold text-white">{t('products.search')}</button></form>
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="divide-y divide-slate-100">{members.map(member => <div className="flex justify-between gap-4 p-5" key={`${member.id}-${member.business_name}`}><div><p className="font-black">{member.name}</p><p className="text-sm text-slate-500">{member.email} · {member.business_name}</p></div><Badge text={statusText(member.status)}/></div>)}{invitations.map(invitation => <div className="flex justify-between gap-4 p-5" key={invitation.id}><div><p className="font-black">{invitation.email}</p><p className="text-sm text-slate-500">{invitation.customer.business_name}</p></div><Badge text={statusText('pending')}/></div>)}{!members.length && !invitations.length && <p className="p-10 text-center text-sm text-slate-500">{t('admin.no_managers')}</p>}</div></section>
    </div></AuthenticatedLayout>;
}
function Badge({ text }) { return <span className="h-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">{text}</span>; }

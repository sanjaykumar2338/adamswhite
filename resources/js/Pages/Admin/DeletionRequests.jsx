import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function DeletionRequests({ requests }) {
    const { locale, t } = useTranslation();
    return <AuthenticatedLayout><Head title={t('deletion.title')} /><div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8"><section className="premium-hero rounded-3xl p-7 text-white"><p className="text-xs font-black uppercase tracking-[.2em] text-[#FFDC7A]">{t('admin.deletion_requests')}</p><h1 className="mt-2 text-3xl font-black">{t('deletion.title')}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{t('deletion.intro')}</p></section><div className="mt-5 space-y-4">{requests.length ? requests.map((item) => <RequestCard key={item.id} item={item} locale={locale} t={t} />) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">{t('deletion.empty')}</div>}</div></div></AuthenticatedLayout>;
}

function RequestCard({ item, locale, t }) {
    const [notes, setNotes] = useState(item.admin_notes || '');
    const review = (status) => router.patch(route('admin.deletion-requests.update', item.id), { status, admin_notes: notes }, { preserveScroll: true });
    return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-black text-[#0B132B]">{item.user.name}</h2><p className="text-sm text-slate-500">{item.user.email}</p><p className="mt-2 text-xs text-slate-500">{t('deletion.organization')}: {item.customer?.business_name || '—'} · {t('deletion.requested')}: {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(item.requested_at))}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{t(`deletion.status_${item.status}`)}</span></div>{item.reason && <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{item.reason}</p>}{item.status === 'pending' && <div className="mt-4"><label className="text-sm font-bold text-[#0B132B]">{t('deletion.notes')}<textarea rows="2" value={notes} onChange={(event) => setNotes(event.target.value)} className="premium-input" /></label><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => review('approved')} className="rounded-xl bg-[#0B132B] px-4 py-2.5 text-sm font-black text-white">{t('deletion.approve')}</button><button type="button" onClick={() => review('rejected')} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-black text-red-700">{t('deletion.reject')}</button></div></div>}</article>;
}

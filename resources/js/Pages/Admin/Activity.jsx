import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

export default function Activity({ logs, filters }) {
    const { locale, t } = useTranslation();
    const [search, setSearch] = useState(filters.search || '');
    return <AuthenticatedLayout><Head title={t('admin.activity_log')}/><div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-[#0B132B] p-7 text-white"><p className="text-xs font-black uppercase tracking-[.2em] text-[#F1C156]">SHIFTRIX TRACK</p><h1 className="mt-2 text-3xl font-black">{t('admin.activity_log')}</h1><p className="mt-2 text-slate-300">{t('admin.activity_help')}</p></section>
        <form onSubmit={event => { event.preventDefault(); router.get(route('admin.activity.index'), { search }); }} className="mt-5 flex gap-2 rounded-2xl border border-slate-200 bg-white p-4"><input className="premium-input mt-0" value={search} onChange={event => setSearch(event.target.value)} placeholder={t('admin.activity_search')}/><button className="rounded-xl bg-[#E1A339] px-5 font-black">{t('products.search')}</button></form>
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="divide-y divide-slate-100">{logs.data.map(log => <article className="grid gap-3 p-5 lg:grid-cols-[1fr_1fr_1.5fr_auto]" key={log.id}><div><p className="font-black">{log.action}</p><p className="text-sm text-slate-500">{log.actor?.name || t('admin.system_actor')}</p></div><p className="break-all text-xs text-slate-500">{log.subject_type ? `${log.subject_type} #${log.subject_id}` : '—'}</p><SafeMetadata metadata={log.metadata}/><time className="text-xs text-slate-500">{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(log.created_at))}</time></article>)}{!logs.data.length && <p className="p-10 text-center text-sm text-slate-500">{t('admin.no_recent_actions')}</p>}</div>{logs.links?.length > 3 && <nav className="flex flex-wrap gap-2 border-t border-slate-100 p-4">{logs.links.map((link, index) => link.url ? <Link className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${link.active ? 'bg-[#0B132B] text-white' : 'bg-white'}`} href={link.url} key={index}>{link.label.replace('&laquo;', '‹').replace('&raquo;', '›')}</Link> : null)}</nav>}</section>
    </div></AuthenticatedLayout>;
}
function SafeMetadata({ metadata }) { if (!metadata || !Object.keys(metadata).length) return <span className="text-xs text-slate-400">—</span>; return <dl className="grid gap-1 text-xs text-slate-500">{Object.entries(metadata).map(([key, value]) => <div className="flex gap-2" key={key}><dt className="font-bold">{key}:</dt><dd className="break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div>)}</dl>; }

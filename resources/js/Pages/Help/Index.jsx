import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head } from '@inertiajs/react';

export default function Help({ whatsappUrl, supportEmail }) {
    const { t } = useTranslation();
    const topics = ['activation', 'review', 'products', 'qr', 'statistics', 'troubleshooting'];

    return <AuthenticatedLayout header={<><p className="text-xs font-bold uppercase tracking-[.2em] text-[#B7791F]" translate="no">SHIFTRIX TRACK</p><p className="mt-0.5 text-sm font-semibold text-slate-500">{t('help.workspace')}</p></>}>
        <Head title={t('help.title')} />
        <div className="mx-auto max-w-[1250px] px-4 py-7 sm:px-6 lg:px-8 xl:px-10">
            <section className="relative overflow-hidden rounded-3xl premium-hero px-6 py-8 text-white shadow-xl shadow-[#0B132B]/10 sm:px-9 sm:py-10"><div className="relative z-10 max-w-2xl"><p className="text-xs font-black uppercase tracking-[.22em] text-[#FFDC7A]">{t('help.eyebrow')}</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">{t('help.title')}</h1><p className="mt-3 text-sm leading-6 text-slate-300">{t('help.intro')}</p></div><span className="absolute -right-14 -top-16 h-56 w-56 rounded-full border border-[#F4B942]/20" /></section>
            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]"><section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="text-2xl font-black text-[#0B132B]">{t('help.faq')}</h2><div className="mt-5 divide-y divide-slate-100">{topics.map((topic, index) => <details key={topic} className="group py-4" open={index === 0}><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black text-[#0B132B]"><span>{t(`help.${topic}_title`)}</span><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg text-[#B7791F] group-open:rotate-45">+</span></summary><p className="mt-3 pr-10 text-sm leading-7 text-slate-600">{t(`help.${topic}_body`)}</p></details>)}</div></section>
                <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4B942] text-[#0B132B]"><SupportIcon /></div><h2 className="mt-4 text-xl font-black text-[#0B132B]">{t('help.contact')}</h2>{whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#0B132B] px-5 py-3 text-sm font-black text-white">{t('help.whatsapp')}</a> : <p className="mt-4 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-900">{t('help.whatsapp_unavailable')}</p>}<a href={`mailto:${supportEmail}`} className="mt-3 flex w-full items-center justify-center rounded-xl border border-[#F4B942] px-5 py-3 text-sm font-black text-[#9A6417]">{t('help.email_support')}</a><p className="mt-3 break-all text-center text-xs text-slate-400">{supportEmail}</p></aside></div>
        </div>
    </AuthenticatedLayout>;
}

function SupportIcon() { return <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M4 13a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2h-2v-7h4M4 13v7h4v-7H4Z" /></svg>; }

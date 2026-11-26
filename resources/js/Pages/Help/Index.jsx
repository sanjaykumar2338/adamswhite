import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head } from '@inertiajs/react';

export default function Help({ whatsappUrl, supportEmail }) {
    const { t } = useTranslation();
    const topics = ['activation', 'review', 'products', 'qr', 'statistics', 'troubleshooting'];

    return <AuthenticatedLayout header={<><p className="notranslate text-xs font-bold tracking-[.12em] text-[#8F6D1E]" translate="no">SHIFTRIX TRACK</p><p className="mt-0.5 text-sm font-medium text-slate-500">{t('help.workspace')}</p></>}>
        <Head title={t('help.title')} />
        <div className="mx-auto max-w-[1250px] px-4 py-7 sm:px-6 lg:px-8 xl:px-10">
            <section className="premium-hero relative overflow-hidden rounded-2xl px-5 py-7 text-white shadow-xl shadow-[#0B1120]/10 sm:px-9 sm:py-10"><div className="relative z-10 max-w-2xl"><p className="text-xs font-semibold tracking-[.1em] text-[#E6C87A]">{t('help.eyebrow')}</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">{t('help.title')}</h1><p className="mt-3 text-sm leading-6 text-slate-300">{t('help.intro')}</p></div></section>
            <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_21rem]">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="text-2xl font-bold text-[#0B1120]">{t('help.faq')}</h2><div className="mt-5 divide-y divide-slate-100">{topics.map((topic, index) => <details key={topic} className="group py-4" open={index === 0}><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[#0B1120]"><span>{t(`help.${topic}_title`)}</span><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#8F6D1E]"><PlusIcon /></span></summary><p className="mt-3 pr-10 text-sm leading-7 text-slate-600">{t(`help.${topic}_body`)}</p></details>)}</div></section>
                <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6C87A] text-[#0B1120]"><SupportIcon /></div><h2 className="mt-4 text-xl font-bold text-[#0B1120]">{t('help.contact')}</h2>{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-5 flex min-h-[46px] w-full items-center justify-center rounded-[10px] bg-[#0B1120] px-5 py-3 text-sm font-semibold text-white hover:bg-[#131C31]">{t('help.whatsapp')}</a>}<a href={`mailto:${supportEmail}`} className="mt-3 flex min-h-[46px] w-full items-center justify-center rounded-[10px] border border-[#8F6D1E] bg-white px-5 py-3 text-sm font-semibold text-[#8F6D1E] hover:bg-[#FBF7EC]">{t('help.email_support')}</a><p className="mt-3 break-all text-center text-xs text-slate-400">{supportEmail}</p></aside>
            </div>
        </div>
    </AuthenticatedLayout>;
}

function PlusIcon() { return <svg className="h-4 w-4 transition-transform group-open:rotate-45" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><path d="M10 4v12M4 10h12" strokeWidth="2" strokeLinecap="round" /></svg>; }
function SupportIcon() { return <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M4 13a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2h-2v-7h4M4 13v7h4v-7H4Z" /></svg>; }

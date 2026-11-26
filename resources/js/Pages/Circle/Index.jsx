import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head } from '@inertiajs/react';

export default function Circle({ circleUrl }) {
    const { t } = useTranslation();
    const features = ['recommend', 'share', 'participate'];

    return <AuthenticatedLayout header={<><p className="text-xs font-bold uppercase tracking-[.2em] text-[#8F6D1E]" translate="no">SHIFTRIX CIRCLE</p><p className="mt-0.5 text-sm font-semibold text-slate-500">{t('circle.workspace')}</p></>}>
        <Head title={t('circle.title')} />
        <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
            <section className="premium-hero relative overflow-hidden rounded-2xl px-6 py-10 text-white shadow-2xl shadow-[#0B1120]/15 sm:px-10 sm:py-14 lg:grid lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:gap-12 lg:px-14 lg:py-16">
                <div className="relative z-10"><p className="text-xs font-black uppercase tracking-[.28em] text-[#E6C87A]">{t('circle.eyebrow')}</p><h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">{t('circle.heading')}</h1><p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">{t('circle.intro')}</p><a href={circleUrl} target="_blank" rel="noopener noreferrer" className="gold-button mt-8 inline-flex items-center justify-center rounded-[10px] px-7 py-4 text-base font-black">{t('circle.join')} <span className="ml-2" aria-hidden="true">→</span></a><p className="mt-3 text-xs leading-5 text-slate-400">{t('circle.external_note')}</p></div>
                <div className="relative z-10 mt-9 grid gap-4 lg:mt-0">{features.map((feature, index) => <article key={feature} className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur"><div className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] metallic-gold font-black text-[#0B1120]">{index + 1}</span><div><h2 className="text-lg font-black">{t(`circle.${feature}_title`)}</h2><p className="mt-1 text-sm leading-6 text-slate-300">{t(`circle.${feature}_body`)}</p></div></div></article>)}</div>
                <span className="pointer-events-none absolute -right-28 -top-32 h-96 w-96 rounded-full border border-[#E6C87A]/20" />
            </section>
            <section className="mt-6 grid gap-5 md:grid-cols-2"><article className="surface-card rounded-2xl bg-white p-6 sm:p-8"><p className="section-eyebrow">{t('circle.for_businesses')}</p><h2 className="mt-2 text-2xl font-black text-[#0B1120]">{t('circle.businesses_title')}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{t('circle.businesses_body')}</p></article><article className="surface-card rounded-2xl bg-white p-6 sm:p-8"><p className="section-eyebrow">{t('circle.for_creators')}</p><h2 className="mt-2 text-2xl font-black text-[#0B1120]">{t('circle.creators_title')}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{t('circle.creators_body')}</p></article></section>
            <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-6 text-slate-500">{t('circle.disclaimer')}</p>
        </div>
    </AuthenticatedLayout>;
}

import ApplicationLogo from '@/Components/ApplicationLogo';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { useTranslation } from '@/i18n';
import { Head, Link } from '@inertiajs/react';

export default function Tutorial({ product, continueUrl, videoUrl, videoType }) {
    const { t } = useTranslation();
    const steps = [
        ['account', 'account_text'],
        ['destination', 'destination_text'],
        ['ready', 'ready_text'],
    ];

    return <div className="flex min-h-[100dvh] flex-col bg-[#f4f6fa]">
        <Head title={t('tutorial.title')} />
        <header className="border-b border-white/10 bg-[#081027] text-white">
            <div className="mx-auto flex h-[4.75rem] max-w-7xl items-center justify-between px-5 sm:px-8">
                <Link href={route('home')} aria-label="SHIFTRIX Track"><ApplicationLogo className="h-9 w-36 sm:h-10 sm:w-52" dark /></Link>
                <LanguageSwitcher dark />
            </div>
        </header>

        <main className="flex-1">
            <section className="brand-gradient relative overflow-hidden px-5 py-12 text-white sm:px-8 sm:py-16">
                <div className="relative mx-auto max-w-6xl">
                    <p className="text-xs font-black uppercase tracking-[.24em] text-[#FFDC7A]">{t('tutorial.eyebrow')}</p>
                    <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">{t('tutorial.heading')}</h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">{t('tutorial.intro')}</p>
                    <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                        <img src={product.image_url} alt="" className="h-12 w-12 rounded-xl bg-white object-cover" />
                        <div><p className="text-xs font-bold uppercase tracking-wider text-slate-300">{product.variant}</p><p className="font-mono text-lg font-black" translate="no">{product.code_id}</p></div>
                    </div>
                </div>
            </section>

            <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.15fr_.85fr]">
                <div>
                    <div className="aspect-video overflow-hidden rounded-3xl border border-slate-200 bg-[#0B132B] shadow-xl shadow-slate-200/70">
                        {videoUrl ? videoType === 'file'
                            ? <video className="h-full w-full" controls preload="metadata" src={videoUrl}>{t('tutorial.video_fallback')}</video>
                            : <iframe className="h-full w-full" src={videoUrl} title={t('tutorial.video_title')} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                            : <div className="flex h-full flex-col items-center justify-center px-8 text-center text-white"><VideoIcon /><p className="mt-4 text-lg font-black">{t('tutorial.video_placeholder')}</p><p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{t('tutorial.video_placeholder_help')}</p></div>}
                    </div>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-2xl font-black text-[#0B132B]">{t('tutorial.steps_title')}</h2>
                    <ol className="mt-6 space-y-5">{steps.map(([title, text], index) => <li key={title} className="flex gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF3B0] font-black text-[#0B132B]">{index + 1}</span><div><h3 className="font-black text-[#0B132B]">{t(`tutorial.${title}`)}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{t(`tutorial.${text}`)}</p></div></li>)}</ol>
                    <Link href={continueUrl} className="gold-button mt-8 block rounded-xl px-6 py-4 text-center text-base font-black">{t('tutorial.continue')}</Link>
                    <p className="mt-3 text-center text-xs leading-5 text-slate-500">{t('tutorial.continue_help')}</p>
                </div>
            </section>
        </main>
        <footer className="border-t border-white/10 bg-[#070D1F] px-5 py-6 text-center text-sm text-[#94A3B8]">{t('legal.copyright')}</footer>
    </div>;
}

function VideoIcon() { return <svg className="h-12 w-12 text-[#FFDC7A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><rect x="3" y="5" width="14" height="14" rx="2" strokeWidth="1.6"/><path d="m17 10 4-2v8l-4-2" strokeWidth="1.6" strokeLinejoin="round"/><path d="m9 9 4 3-4 3V9Z" fill="currentColor" stroke="none"/></svg>; }

import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { useTranslation } from '@/i18n';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Track({ code, invalid, product, customer, canActivate, needsVerification }) {
    const { t } = useTranslation();
    const [lookup, setLookup] = useState(code || '');
    const form = useForm({ code_id: product?.code_id || '', business_name: customer?.business_name || '', google_review_url: '' });

    useEffect(() => {
        form.setData('code_id', product?.code_id || '');
        if (customer?.business_name) form.setData('business_name', customer.business_name);
    }, [product?.code_id, customer?.business_name]);

    const findProduct = (event) => {
        event.preventDefault();
        window.location.assign(route('home', { id: lookup.trim().toUpperCase() }));
    };

    const hasResult = Boolean(invalid || product);

    return <div className="viewport-shell flex flex-col bg-[#f4f6fa]">
        <Head title={t('track.title')} />
        <header className="shrink-0 border-b border-white/10 bg-[#081027] text-white">
            <div className="mx-auto flex h-[4.75rem] max-w-7xl items-center justify-between px-5 sm:px-8">
                <Link href={route('home')} aria-label="SHIFTRIX Track"><ApplicationLogo className="h-9 w-36 sm:h-10 sm:w-52" dark /></Link>
                <div className="flex items-center gap-2 sm:gap-3"><LanguageSwitcher dark />{!product && <Link href={route('login')} className="rounded-full border border-white/25 px-3 py-2 text-xs font-semibold text-white hover:border-[#FFDC7A]/60 hover:bg-white/10 sm:px-4 sm:py-2.5 sm:text-sm">{t('auth.login')}</Link>}</div>
            </div>
        </header>

        <main className="flex flex-1 flex-col">
            <section className={`brand-gradient relative flex overflow-hidden text-white ${hasResult ? '' : 'flex-1'}`}>
                <img src="/images/marketing/customer-activation.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center saturate-50" aria-hidden="true" />
                <span className="absolute inset-0 bg-[#0B132B]/[.82]" aria-hidden="true" />
                <span className="pointer-events-none absolute -right-40 -top-48 h-[34rem] w-[34rem] rounded-full border border-[#FFDC7A]/15" />
                <span className="pointer-events-none absolute -bottom-36 left-[42%] h-80 w-80 rounded-full bg-[#F4B942]/10 blur-3xl" />
                <div className="relative mx-auto grid w-full max-w-7xl gap-10 self-center px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:gap-16 lg:py-20">
                    <div><p className="text-xs font-bold tracking-[.3em] text-[#FFDC7A]">{t('track.eyebrow')}</p><h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">{t('track.activation_headline')}</h1><p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">{t('track.intro')}</p>
                        <form onSubmit={findProduct} className="mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl border border-white/10 bg-white/10 p-3 shadow-2xl shadow-black/10 backdrop-blur-md sm:flex-row">
                            <label className="sr-only" htmlFor="product-code">{t('track.placeholder')}</label>
                            <input id="product-code" value={lookup} onChange={event => setLookup(event.target.value.toUpperCase())} className="min-h-14 min-w-0 grow rounded-xl border-0 bg-white px-5 py-3 font-mono text-base uppercase tracking-wide text-[#0B132B] shadow-sm placeholder:text-slate-400 focus:ring-2 focus:ring-[#FFDC7A]" placeholder={t('track.placeholder')} pattern="(CARD|PLATE|STAND)-[0-9]{5}" required />
                            <button type="submit" className="gold-button min-h-14 shrink-0 rounded-xl px-7 py-3 text-base font-extrabold shadow-lg shadow-black/10 sm:min-w-44">{t('track.find')}</button>
                        </form><p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">{t('track.manual_help')}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><Feature icon="shield" title={t('track.secure')} text={t('track.secure_text')} /><Feature icon="activity" title={t('track.analytics')} text={t('track.analytics_text')} /></div>
                </div>
            </section>

            {hasResult && <section className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
                {invalid && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900" role="alert">{t('track.invalid')}</div>}
                {product && <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-xl shadow-slate-200/70 lg:grid lg:grid-cols-[.9fr_1.1fr]">
                    <div className="relative min-h-72 bg-[#e9edf4]"><img src={product.image_url} alt={t('track.photo_alt', { variant: product.variant })} className="absolute inset-0 h-full w-full object-cover" /><span className="absolute left-5 top-5 rounded-full bg-[#0B132B]/90 px-4 py-2 text-xs font-bold tracking-wider text-white">{product.variant}</span></div>
                    <div className="p-6 sm:p-9"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#B7791F]">{t('track.recognized')}</p><h2 className="mt-3 text-3xl font-black text-[#0B132B]" translate="no">{product.code_id}</h2>
                        {!product.is_available ? <div className="mt-7 rounded-xl bg-slate-100 p-5 text-slate-700">{t('track.already_active')}</div> : canActivate ? <form className="mt-7 space-y-5" onSubmit={event => { event.preventDefault(); form.post(route('activations.store')); }}>
                            <label className="block text-sm font-semibold text-slate-700">{t('track.business_details')}<input value={form.data.business_name} onChange={event => form.setData('business_name', event.target.value)} className="mt-2 w-full rounded-xl border-slate-300 px-4 py-3 focus:border-[#F4B942] focus:ring-[#F4B942]" required /></label><InputError message={form.errors.business_name} />
                            <label className="block text-sm font-semibold text-slate-700">{t('track.review_link')}<input type="url" value={form.data.google_review_url} onChange={event => form.setData('google_review_url', event.target.value)} className="mt-2 w-full rounded-xl border-slate-300 px-4 py-3 focus:border-[#F4B942] focus:ring-[#F4B942]" placeholder={t('track.review_placeholder')} required /></label><InputError message={form.errors.google_review_url} /><InputError message={form.errors.code_id} />
                            <button disabled={form.processing} className="gold-button w-full rounded-xl px-5 py-3.5 font-bold disabled:opacity-50">{t('track.activate')}</button>
                        </form> : <div className="mt-7 space-y-3">{needsVerification ? <><p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{t('track.verify')}</p><Link href={route('verification.notice')} className="gold-button block rounded-xl px-5 py-3 text-center font-bold">{t('track.verify_action')}</Link></> : <><Link href={route('login')} className="gold-button block rounded-xl px-5 py-3 text-center font-bold">{t('track.signin')}</Link><Link href={route('register')} className="block rounded-xl border border-slate-300 px-5 py-3 text-center font-bold text-[#0B132B]">{t('track.register')}</Link></>}</div>}
                    </div>
                </div>}
            </section>}
        </main>
        <footer className="shrink-0 border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-sm font-medium text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p>{t('legal.copyright')}</p><nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label={t('legal.footer_navigation')}><Link className="hover:text-[#0B132B]" href={route('legal')}>{t('legal.notice_title')}</Link><Link className="hover:text-[#0B132B]" href={route('privacy')}>{t('legal.privacy_title')}</Link><Link className="hover:text-[#0B132B]" href={route('cookies')}>{t('legal.cookies_title')}</Link></nav></div></footer>
    </div>;
}

function Feature({ icon, title, text }) { return <article className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-6 shadow-xl shadow-black/5 backdrop-blur-md sm:p-7"><span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFDC7A]/80 to-transparent" /><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFDC7A]/15 text-[#FFDC7A]">{icon === 'shield' ? <ShieldIcon /> : <ActivityIcon />}</span><h2 className="mt-5 text-xl font-bold tracking-tight">{title}</h2><p className="mt-3 text-base leading-7 text-slate-300">{text}</p></article>; }
function ShieldIcon() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-5" /></svg>; }
function ActivityIcon() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 12h3l2-6 4 12 2-6h5" /></svg>; }

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

    return <main className="min-h-screen bg-[#f4f6fa]">
        <Head title={t('track.title')} />
        <header className="border-b border-white/10 bg-[#0B132B] text-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
                <Link href={route('home')} aria-label="SHIFTRIX Track"><ApplicationLogo className="h-10 w-48" dark /></Link>
                <div className="flex items-center gap-3"><LanguageSwitcher dark />{!product && <Link href={route('login')} className="hidden rounded-full border border-white/25 px-4 py-2 text-sm font-semibold sm:block">{t('auth.login')}</Link>}</div>
            </div>
        </header>

        <section className="brand-gradient overflow-hidden text-white">
            <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-20">
                <div><p className="text-xs font-bold tracking-[.28em] text-[#F1C156]">{t('track.eyebrow')}</p><h1 className="mt-4 max-w-2xl text-4xl font-black leading-tight sm:text-5xl">{t('track.title')}</h1><p className="mt-5 max-w-xl text-base leading-7 text-blue-100 sm:text-lg">{t('track.intro')}</p>
                    <form onSubmit={findProduct} className="mt-8 flex max-w-xl flex-col gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur sm:flex-row">
                        <input value={lookup} onChange={event => setLookup(event.target.value.toUpperCase())} className="min-w-0 grow rounded-xl border-0 bg-white px-4 py-3 font-mono text-base uppercase text-[#0B132B] shadow-sm focus:ring-2 focus:ring-[#E1A339]" placeholder={t('track.placeholder')} pattern="(CARD|PLATE|STAND)-[0-9]{5}" required />
                        <button className="gold-button rounded-xl px-6 py-3 font-bold">{t('track.find')}</button>
                    </form><p className="mt-3 text-sm text-blue-200">{t('track.manual_help')}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2"><Feature number="01" title={t('track.secure')} text={t('track.secure_text')} /><Feature number="02" title={t('track.analytics')} text={t('track.analytics_text')} /></div>
            </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
            {invalid && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900" role="alert">{t('track.invalid')}</div>}
            {product && <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-xl shadow-slate-200/70 lg:grid lg:grid-cols-[.9fr_1.1fr]">
                <div className="relative min-h-72 bg-[#e9edf4]"><img src={product.image_url} alt={t('track.photo_alt', { variant: product.variant })} className="absolute inset-0 h-full w-full object-cover" /><span className="absolute left-5 top-5 rounded-full bg-[#0B132B]/90 px-4 py-2 text-xs font-bold tracking-wider text-white">{product.variant}</span></div>
                <div className="p-6 sm:p-9"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#B8773C]">{t('track.recognized')}</p><h2 className="mt-3 text-3xl font-black text-[#0B132B]">{product.code_id}</h2>
                    {!product.is_available ? <div className="mt-7 rounded-xl bg-slate-100 p-5 text-slate-700">{t('track.already_active')}</div> : canActivate ? <form className="mt-7 space-y-5" onSubmit={event => { event.preventDefault(); form.post(route('activations.store')); }}>
                        <label className="block text-sm font-semibold text-slate-700">{t('track.business_details')}<input value={form.data.business_name} onChange={event => form.setData('business_name', event.target.value)} className="mt-2 w-full rounded-xl border-slate-300 px-4 py-3 focus:border-[#E1A339] focus:ring-[#E1A339]" required /></label><InputError message={form.errors.business_name} />
                        <label className="block text-sm font-semibold text-slate-700">{t('track.review_link')}<input type="url" value={form.data.google_review_url} onChange={event => form.setData('google_review_url', event.target.value)} className="mt-2 w-full rounded-xl border-slate-300 px-4 py-3 focus:border-[#E1A339] focus:ring-[#E1A339]" placeholder={t('track.review_placeholder')} required /></label><InputError message={form.errors.google_review_url} /><InputError message={form.errors.code_id} />
                        <button disabled={form.processing} className="gold-button w-full rounded-xl px-5 py-3.5 font-bold disabled:opacity-50">{t('track.activate')}</button>
                    </form> : <div className="mt-7 space-y-3">{needsVerification ? <><p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{t('track.verify')}</p><Link href={route('verification.notice')} className="gold-button block rounded-xl px-5 py-3 text-center font-bold">{t('track.verify_action')}</Link></> : <><Link href={route('login')} className="gold-button block rounded-xl px-5 py-3 text-center font-bold">{t('track.signin')}</Link><Link href={route('register')} className="block rounded-xl border border-slate-300 px-5 py-3 text-center font-bold text-[#0B132B]">{t('track.register')}</Link></>}</div>}
                </div>
            </div>}
        </section>
        <footer className="border-t bg-white"><div className="mx-auto flex max-w-7xl flex-wrap gap-5 px-5 py-7 text-sm text-slate-500 sm:px-8"><Link href={route('legal')}>{t('legal.notice_title')}</Link><Link href={route('privacy')}>{t('legal.privacy_title')}</Link><Link href={route('cookies')}>{t('legal.cookies_title')}</Link></div></footer>
    </main>;
}

function Feature({ number, title, text }) { return <div className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur"><p className="text-sm font-black text-[#F1C156]">{number}</p><h2 className="mt-4 text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-blue-100">{text}</p></div>; }

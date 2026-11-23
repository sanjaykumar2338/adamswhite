import ApplicationLogo from '@/Components/ApplicationLogo';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { useTranslation } from '@/i18n';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children, adminPortal = false }) {
    const { t } = useTranslation();

    return (
        <div className="viewport-shell relative overflow-hidden bg-[#F7F8FB] px-4 py-5 sm:px-6 lg:flex lg:items-center lg:py-8">
            <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-[#F4B942]/10 blur-3xl" />
            <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_28px_90px_rgba(11,19,43,.14)] lg:min-h-[690px] lg:grid-cols-[1.04fr_.96fr]">
                <aside className="premium-hero relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
                    <img src={adminPortal ? '/images/marketing/admin-portal.webp' : '/images/marketing/customer-login.webp'} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
                    <span className={`absolute inset-0 ${adminPortal ? 'bg-[#0B132B]/70' : 'bg-[#0B132B]/[.78]'}`} aria-hidden="true" />
                    <div className="relative z-10"><Link href={route('home')}><ApplicationLogo className="h-12 w-56" dark /></Link><p className="mt-16 text-xs font-black uppercase tracking-[.24em] text-[#FFDC7A]">{t('auth.portal_eyebrow')}</p><h1 className="mt-4 max-w-lg text-4xl font-black leading-[1.12] tracking-tight xl:text-5xl">{t('auth.portal_title')}</h1><p className="mt-5 max-w-md text-base leading-7 text-slate-300">{t('auth.portal_intro')}</p></div>
                    <div className="relative z-10 grid gap-3">{['challenges', 'multisite', 'remote', 'analytics'].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0B132B]/35 px-4 py-3 backdrop-blur"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl metallic-gold font-black text-[#0B132B]">✓</span><span className="text-sm font-bold text-slate-100">{t(`auth.portal_${item}`)}</span></div>)}</div>
                    <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full border border-[#F4B942]/20" />
                </aside>
                <main className="flex min-w-0 flex-col p-5 sm:p-9 lg:p-12 xl:p-14">
                    <div className="flex items-center justify-between gap-4 lg:justify-end"><Link href={route('home')} className="lg:hidden"><ApplicationLogo className="h-10 w-44 sm:h-11 sm:w-48" /></Link><LanguageSwitcher /></div>
                    <div className="my-auto w-full max-w-md self-center py-8 sm:py-10">{children}</div>
                    <p className="text-center text-xs text-slate-400">{t('auth.secure_session')}</p>
                </main>
            </div>
        </div>
    );
}

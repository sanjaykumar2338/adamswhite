import ApplicationLogo from '@/Components/ApplicationLogo';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { useTranslation } from '@/i18n';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children, adminPortal = false, wide = false }) {
    const { t } = useTranslation();

    return (
        <div className="viewport-shell relative overflow-x-hidden bg-white">
            <div className="relative grid min-h-screen w-full bg-white lg:min-h-[100dvh] lg:grid-cols-[minmax(0,.9fr)_minmax(36rem,1.1fr)]">
                <aside className="premium-hero relative hidden min-h-[100dvh] overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14 2xl:p-16">
                    <img src={adminPortal ? '/images/marketing/admin-portal.webp' : '/images/marketing/customer-login.webp'} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
                    <span className={`absolute inset-0 ${adminPortal ? 'bg-[#0B132B]/70' : 'bg-[#0B132B]/[.78]'}`} aria-hidden="true" />
                    <div className="relative z-10"><Link href={route('home')}><ApplicationLogo className="h-11 w-52" dark /></Link><p className="mt-12 text-xs font-black uppercase tracking-[.24em] text-[#FFDC7A] xl:mt-16">{t('auth.portal_eyebrow')}</p><h1 className="mt-4 max-w-xl text-3xl font-black leading-[1.14] tracking-[-.025em] xl:text-4xl 2xl:text-[2.75rem]">{t('auth.portal_title')}</h1><p className="mt-4 max-w-lg text-sm leading-7 text-slate-300 xl:text-base">{t('auth.portal_intro')}</p></div>
                    <div className="relative z-10 grid max-w-xl gap-2.5">{['products', 'destinations', 'team_access', 'analytics'].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B132B]/35 px-4 py-2.5 backdrop-blur"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg metallic-gold text-sm font-black text-[#0B132B]">✓</span><span className="text-sm font-semibold text-slate-100">{t(`auth.portal_${item}`)}</span></div>)}</div>
                    <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full border border-[#F4B942]/20" />
                </aside>
                <main className="flex min-h-screen min-w-0 flex-col p-5 sm:p-8 lg:min-h-[100dvh] lg:p-10 xl:p-12">
                    <div className="flex items-center justify-between gap-4 lg:justify-end"><Link href={route('home')} className="lg:hidden"><ApplicationLogo className="h-10 w-44 sm:h-11 sm:w-48" /></Link><LanguageSwitcher /></div>
                    <div className={`my-auto w-full self-center py-6 sm:py-8 ${wide ? 'max-w-2xl' : 'max-w-md'}`}>{children}</div>
                    <p className="text-center text-xs text-slate-400">{t('auth.secure_session')}</p>
                </main>
            </div>
        </div>
    );
}

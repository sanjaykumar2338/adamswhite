import ApplicationLogo from '@/Components/ApplicationLogo';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import { useTranslation } from '@/i18n';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children, adminPortal = false, wide = false }) {
    const { t } = useTranslation();

    return (
        <div className="viewport-shell relative overflow-x-hidden bg-white">
            <div className="relative grid min-h-screen w-full bg-white lg:min-h-[100dvh] lg:grid-cols-[minmax(0,.9fr)_minmax(36rem,1.1fr)]">
                <aside className="premium-hero relative hidden min-h-[100dvh] overflow-hidden p-10 text-white lg:flex lg:items-center lg:justify-start xl:p-14 2xl:p-16">
                    <img src={adminPortal ? '/images/marketing/admin-portal.webp' : '/images/marketing/customer-login.webp'} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
                    <span className={`absolute inset-0 ${adminPortal ? 'bg-[#0B1120]/70' : 'bg-[#0B1120]/[.78]'}`} aria-hidden="true" />
                    <Link href={route('home')} className="absolute left-10 top-10 z-10 xl:left-14 2xl:left-16"><ApplicationLogo className="h-11 w-52" dark /></Link>
                    <div className="relative z-10 w-full max-w-xl">
                        <section>
                            <p className="text-xs font-black uppercase tracking-[.24em] text-[#E6C87A]">{t('auth.portal_eyebrow')}</p>
                            <h1 className="mt-3 text-3xl font-black leading-[1.14] tracking-[-.025em] xl:text-4xl 2xl:text-[2.75rem]">{t('auth.portal_title')}</h1>
                            <p className="mt-4 max-w-lg text-sm leading-7 text-slate-300 xl:text-base">{t('auth.portal_intro')}</p>
                            <div className="mt-7 grid gap-2">{['products', 'destinations', 'team_access', 'analytics'].map((item) => <div key={item} className="flex items-center gap-2.5 rounded-[10px] border border-white/10 bg-[#0B1120]/35 px-3.5 py-2 backdrop-blur"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg metallic-gold text-xs font-black text-[#0B1120]">✓</span><span className="text-sm font-semibold text-slate-100">{t(`auth.portal_${item}`)}</span></div>)}</div>
                        </section>
                    </div>
                    <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full border border-[#E6C87A]/20" />
                </aside>
                <main className="flex min-h-screen min-w-0 flex-col p-5 sm:p-8 lg:min-h-[100dvh] lg:p-10 xl:p-12">
                    <div className="flex items-center justify-between gap-4 lg:justify-end"><Link href={route('home')} className="lg:hidden"><ApplicationLogo className="h-10 w-44 sm:h-11 sm:w-48" /></Link><LanguageSwitcher /></div>
                    <div className={`my-6 w-full self-center py-3 sm:my-8 sm:py-5 lg:my-auto lg:py-8 ${wide ? 'max-w-2xl' : 'max-w-md'}`}>{children}</div>
                    <p className="text-center text-xs text-slate-400">{t('auth.secure_session')}</p>
                </main>
            </div>
        </div>
    );
}

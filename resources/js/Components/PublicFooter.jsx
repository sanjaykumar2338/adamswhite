import { useTranslation } from '@/i18n';
import { Link } from '@inertiajs/react';

export default function PublicFooter({ dark = false }) {
    const { t } = useTranslation();
    const border = dark ? 'border-white/[.08]' : 'border-slate-200';
    const background = dark ? 'bg-[#0B1120]' : 'bg-white';
    const text = dark ? 'text-[#94A3B8]' : 'text-slate-500';
    const hover = dark ? 'hover:text-[#E6C87A]' : 'hover:text-[#0B1120]';

    return <footer className={`shrink-0 border-t ${border} ${background} ${text}`}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-5 gap-y-3 px-5 py-6 text-[13px] font-medium sm:px-8">
            <p>{t('legal.copyright')}</p>
            <nav className={`flex flex-wrap gap-x-5 gap-y-3 ${dark ? 'text-[#CBD5E1]' : ''}`} aria-label={t('legal.footer_navigation')}>
                <Link className={hover} href={route('legal')}>{t('legal.notice_title')}</Link>
                <Link className={hover} href={route('privacy')}>{t('legal.privacy_title')}</Link>
                <Link className={hover} href={route('cookies')}>{t('legal.cookies_title')}</Link>
            </nav>
        </div>
    </footer>;
}

import { useTranslation } from '@/i18n';
import { Link } from '@inertiajs/react';

export default function PublicFooter({ dark = false }) {
    const { t } = useTranslation();
    const border = dark ? 'border-white/10' : 'border-slate-200';
    const background = dark ? 'bg-[#070D1F]' : 'bg-white';
    const text = dark ? 'text-slate-400' : 'text-slate-500';
    const hover = dark ? 'hover:text-[#FFDC7A]' : 'hover:text-[#0B132B]';

    return <footer className={`shrink-0 border-t ${border} ${background} ${text}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 text-sm font-medium sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>{t('legal.copyright')}</p>
            <nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label={t('legal.footer_navigation')}>
                <Link className={hover} href={route('legal')}>{t('legal.notice_title')}</Link>
                <Link className={hover} href={route('privacy')}>{t('legal.privacy_title')}</Link>
                <Link className={hover} href={route('cookies')}>{t('legal.cookies_title')}</Link>
            </nav>
        </div>
    </footer>;
}

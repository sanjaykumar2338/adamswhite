import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { useTranslation } from '@/i18n';

export default function LanguageSwitcher({ dark = false }) {
    const { locale, t } = useTranslation();
    useEffect(() => { document.documentElement.lang = locale; }, [locale]);

    return <div className={`inline-flex rounded-full border p-1 text-xs font-bold ${dark ? 'border-white/25 bg-white/10 text-white' : 'border-slate-200 bg-white text-[#0b2854]'}`} aria-label={t('common.language')}>
        {['en', 'fr'].map(option => <button key={option} type="button" onClick={() => option !== locale && router.post(route('locale.update', option), {}, { preserveScroll: true })} className={`rounded-full px-3 py-1.5 transition ${locale === option ? 'bg-[#c49a49] text-white' : ''}`}>{option.toUpperCase()}</button>)}
    </div>;
}

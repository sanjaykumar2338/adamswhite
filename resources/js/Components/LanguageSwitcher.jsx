import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { useTranslation } from '@/i18n';

export default function LanguageSwitcher({ dark = false, onBeforeChange }) {
    const { locale, t } = useTranslation();
    useEffect(() => { document.documentElement.lang = locale; }, [locale]);

    return <div translate="no" className={`notranslate inline-flex shrink-0 rounded-full border p-1 text-xs font-bold ${dark ? 'border-white/20 bg-white/[.08] text-white' : 'border-slate-200 bg-white text-[#0B1120]'}`} aria-label={t('common.language')}>
        {['en', 'fr'].map(option => <button key={option} type="button" onClick={() => {
            if (option === locale) return;
            onBeforeChange?.();
            router.post(route('locale.update', option), {}, { preserveScroll: true, preserveState: false });
        }} aria-pressed={locale === option} className={`rounded-full px-2.5 py-1.5 transition sm:px-3 ${locale === option ? 'bg-[#E6C87A] text-[#0B1120]' : ''}`}>{option.toUpperCase()}</button>)}
    </div>;
}

import AccountTypeCards from '@/Components/AccountTypeCards';
import { useTranslation } from '@/i18n';
import { useForm } from '@inertiajs/react';

export default function AccountTypeSettings({ customer, role }) {
    const { t } = useTranslation();
    const form = useForm({ account_type: customer?.account_type || '' });

    if (!customer || role !== 'owner') return null;

    return <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-[.18em] text-[#8F6D1E]">{t('profile.account_type_eyebrow')}</p>
        <h2 className="mt-1 text-2xl font-black text-[#0B1120]">{t('profile.account_type_title')}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{t('profile.account_type_intro')}</p>
        <form className="mt-5" onSubmit={(event) => { event.preventDefault(); form.patch(route('profile.account-type.update'), { preserveScroll: true }); }}>
            <AccountTypeCards value={form.data.account_type} onChange={(value) => form.setData('account_type', value)} error={form.errors.account_type} t={t} />
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm font-bold text-emerald-600">{form.recentlySuccessful ? t('common.saved') : ''}</span><button disabled={form.processing || !form.data.account_type} className="min-h-[46px] w-full rounded-[10px] bg-[#0B1120] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto">{t('common.save')}</button></div>
        </form>
    </section>;
}

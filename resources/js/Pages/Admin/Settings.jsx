import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function Settings({ settings }) {
    const { t } = useTranslation();
    const flash = usePage().props.flash;
    const form = useForm({ support_email: settings.support_email, whatsapp_url: settings.whatsapp_url || '', default_product_limit: settings.default_product_limit || 100 });

    return <AuthenticatedLayout>
        <Head title={t('common.settings')} />
        <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 lg:px-8">
            <section className="premium-hero relative overflow-hidden rounded-3xl px-6 py-8 text-white shadow-xl shadow-[#0B132B]/10 sm:px-9 sm:py-10">
                <p className="text-xs font-black uppercase tracking-[.2em] text-[#FFDC7A]" translate="no">SHIFTRIX TRACK</p>
                <h1 className="mt-2 text-3xl font-black sm:text-4xl">{t('common.settings')}</h1>
                <p className="mt-3 max-w-2xl leading-7 text-slate-300">{t('admin.settings_intro')}</p>
            </section>
            {flash.success && <div role="status" className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">{flash.success}</div>}
            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.48fr]">
                <form className="premium-panel rounded-3xl p-6 sm:p-8" onSubmit={(event) => { event.preventDefault(); form.patch(route('admin.settings.update'), { preserveScroll: true }); }}>
                    <p className="section-eyebrow">{t('admin.configuration')}</p>
                    <h2 className="mt-1 text-2xl font-black text-[#0B132B]">{t('common.settings')}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{t('admin.settings_help')}</p>
                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                        <Field label={t('common.support_email')} error={form.errors.support_email}><input type="email" required className="premium-input" value={form.data.support_email} onChange={(event) => form.setData('support_email', event.target.value)}/></Field>
                        <Field label={t('common.whatsapp_support')} error={form.errors.whatsapp_url}><input type="text" className="premium-input" value={form.data.whatsapp_url} onChange={(event) => form.setData('whatsapp_url', event.target.value)} placeholder="https://wa.me/33612345678"/><span className="mt-1 block text-xs font-medium leading-5 text-slate-500">{t('admin.whatsapp_help')}</span></Field>
                        <Field label={t('common.default_product_limit')} error={form.errors.default_product_limit}><input type="number" min="1" max="10000" required className="premium-input" value={form.data.default_product_limit} onChange={(event) => form.setData('default_product_limit', event.target.value)}/></Field>
                    </div>
                    <div className="mt-7 flex justify-end border-t border-slate-100 pt-5"><button disabled={form.processing} className="gold-button rounded-xl px-6 py-3 text-sm font-black disabled:opacity-50">{t('admin.save_settings')}</button></div>
                </form>
                <aside className="h-fit rounded-3xl bg-[#0B132B] p-6 text-white shadow-xl shadow-[#0B132B]/10"><span className="metallic-gold flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black text-[#0B132B]">i</span><h2 className="mt-5 text-xl font-black">{t('admin.inventory_health')}</h2><p className="mt-3 text-sm leading-6 text-slate-300">{t('admin.future_warning')}</p></aside>
            </div>
        </div>
    </AuthenticatedLayout>;
}

function Field({ label, error, children }) { return <label className="block text-sm font-bold text-[#0B132B]">{label}{children}{error && <span className="mt-1 block text-xs text-red-600">{error}</span>}</label>; }

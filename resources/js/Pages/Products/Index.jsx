import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head, router, useForm } from '@inertiajs/react';
import { createProductQrDownload } from '@/lib/productQr';
import { useState } from 'react';

export default function ProductsIndex({ products, filters, counts }) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search);

    const filter = (variant = filters.variant) => router.get(route('products.index'), { search, variant }, { preserveState: true, replace: true });

    return <AuthenticatedLayout header={<><p className="text-xs font-bold uppercase tracking-[.2em] text-[#B7791F]" translate="no">SHIFTRIX TRACK</p><p className="mt-0.5 text-sm font-semibold text-slate-500">{t('products.workspace')}</p></>}>
        <Head title={t('products.title')} />
        <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8 xl:px-10">
            <section className="overflow-hidden rounded-3xl premium-hero px-6 py-7 text-white shadow-xl shadow-[#0B132B]/10 sm:px-8 lg:flex lg:items-end lg:justify-between lg:gap-8">
                <div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#FFDC7A]">{t('products.eyebrow')}</p><h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{t('products.title')}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{t('products.intro')}</p></div>
                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.07] px-5 py-4 lg:mt-0"><span className="text-3xl font-black text-[#FFDC7A]">{counts.all}</span><span className="ml-2 text-sm font-semibold text-slate-200">{t('products.owned')}</span></div>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <form onSubmit={(event) => { event.preventDefault(); filter(); }} className="flex flex-col gap-3 md:flex-row">
                    <label className="relative flex-1"><span className="sr-only">{t('products.search')}</span><SearchIcon /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border-slate-200 py-3 pl-11 pr-4 text-sm focus:border-[#F4B942] focus:ring-[#F4B942]" placeholder={t('products.search_placeholder')} /></label>
                    <button className="rounded-xl bg-[#0B132B] px-5 py-3 text-sm font-bold text-white hover:bg-[#142044]">{t('products.search')}</button>
                    {(filters.search || filters.variant) && <button type="button" onClick={() => { setSearch(''); router.get(route('products.index')); }} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600">{t('common.clear')}</button>}
                </form>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {[['', 'all'], ['CARD', 'CARD'], ['PLATE', 'PLATE'], ['STAND', 'STAND']].map(([value, label]) => <button key={label} type="button" onClick={() => filter(value)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold ${filters.variant === value ? 'bg-[#F4B942] text-[#0B132B]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{label === 'all' ? t('products.all') : label} <span className="ml-1 opacity-70">{counts[label]}</span></button>)}
                </div>
            </section>

            {products.length ? <div className="mt-6 grid gap-5 xl:grid-cols-2">{products.map((product) => <ProductCard key={product.id} product={product} t={t} />)}</div> : <EmptyState t={t} />}
        </div>
    </AuthenticatedLayout>;
}

function ProductCard({ product, t }) {
    const form = useForm({ display_name: product.display_name || '', google_review_url: product.google_review_url || '' });
    const [copied, setCopied] = useState('');
    const [qrBusy, setQrBusy] = useState(false);
    const copy = async (value, field) => { await navigator.clipboard.writeText(value); setCopied(field); window.setTimeout(() => setCopied(''), 1800); };
    const downloadQr = async () => {
        setQrBusy(true);
        try {
            const download = await createProductQrDownload(product.code_id, product.nfc_url);
            const link = document.createElement('a'); link.href = download.dataUrl; link.download = download.filename; link.click();
        } finally { setQrBusy(false); }
    };

    return <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 bg-gradient-to-r from-[#0B132B] to-[#152346] p-5 text-white sm:p-6">
            <img src={product.image_url} alt="" className="h-16 w-16 rounded-2xl bg-white object-cover ring-1 ring-white/15" />
            <div className="min-w-0"><span className="inline-flex rounded-full bg-[#F4B942] px-2.5 py-1 text-[.68rem] font-black tracking-wider text-[#0B132B]" translate="no">{product.variant}</span><h2 className="mt-2 truncate text-xl font-black">{product.display_name || product.code_id}</h2><p className="mt-0.5 text-xs text-slate-300" translate="no">{t('products.product_id')}: {product.code_id}</p></div>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); form.patch(route('products.update', product.id), { preserveScroll: true }); }} className="space-y-5 p-5 sm:p-6">
            <Field label={t('products.name_label')} hint={t('products.name_hint')} error={form.errors.display_name}><input value={form.data.display_name} onChange={(event) => form.setData('display_name', event.target.value)} maxLength="120" className="mt-2 w-full rounded-xl border-slate-200 focus:border-[#F4B942] focus:ring-[#F4B942]" placeholder={t('products.name_placeholder')} /></Field>
            <Field label={t('products.review_url')} hint={t('products.review_hint')} error={form.errors.google_review_url}><input type="url" required value={form.data.google_review_url} onChange={(event) => form.setData('google_review_url', event.target.value)} className="mt-2 w-full rounded-xl border-slate-200 focus:border-[#F4B942] focus:ring-[#F4B942]" placeholder="https://g.page/r/.../review" /></Field>
            <div><p className="text-sm font-bold text-[#0B132B]">{t('products.nfc_url')}</p><p className="mt-1 text-xs leading-5 text-slate-500">{t('products.nfc_hint')}</p><div className="mt-2 flex gap-2"><input readOnly value={product.nfc_url} className="min-w-0 flex-1 rounded-xl border-slate-200 bg-slate-50 text-xs text-slate-600" /><button type="button" onClick={() => copy(product.nfc_url, 'nfc')} className="rounded-xl border border-[#F4B942]/40 bg-[#FFF8E8] px-4 text-sm font-bold text-[#9A6417]">{copied === 'nfc' ? t('products.copied') : t('products.copy')}</button></div></div>
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><button type="button" disabled={qrBusy} onClick={downloadQr} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-[#0B132B] hover:bg-slate-50 disabled:opacity-60"><QrIcon />{qrBusy ? t('products.generating') : t('products.download_qr')}</button><button disabled={form.processing} className="rounded-xl bg-[#0B132B] px-6 py-3 text-sm font-bold text-white hover:bg-[#142044] disabled:opacity-60">{form.processing ? t('products.saving') : t('products.save')}</button></div>
            {form.recentlySuccessful && <p role="status" className="text-right text-sm font-bold text-emerald-600">{t('products.saved')}</p>}
        </form>
    </article>;
}

function Field({ label, hint, error, children }) { return <label className="block"><span className="text-sm font-bold text-[#0B132B]">{label}</span><span className="ml-2 text-xs text-slate-400">{hint}</span>{children}{error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}</label>; }
function EmptyState({ t }) { return <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center"><p className="text-lg font-black text-[#0B132B]">{t('products.empty')}</p><p className="mt-2 text-sm text-slate-500">{t('products.empty_help')}</p></div>; }
function SearchIcon() { return <svg className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>; }
function QrIcon() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.7" d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-6v-2"/></svg>; }

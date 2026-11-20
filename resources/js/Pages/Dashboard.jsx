import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ScanActivityChart from '@/Components/ScanActivityChart';
import { useTranslation } from '@/i18n';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function Dashboard({ customer, products, summary, series }) {
    const { locale, t } = useTranslation();
    const flash = usePage().props.flash;

    const metrics = [
        [t('dashboard.active_products'), summary.products, 'products'],
        [t('dashboard.scans_7d'), summary.scans7d, 'week'],
        [t('dashboard.scans_30d'), summary.scans30d, 'month'],
    ];

    return <AuthenticatedLayout>
        <Head title={t('dashboard.title')} />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {flash.success && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-800">{flash.success}</div>}

            <section className="relative overflow-hidden rounded-[1.75rem] bg-[#0B132B] px-6 py-7 text-white shadow-xl shadow-[#0B132B]/15 sm:px-8 lg:flex lg:items-end lg:justify-between lg:px-10 lg:py-9">
                <div className="relative z-10"><p className="text-sm font-bold uppercase tracking-[.22em] text-[#F1C156]">{t('dashboard.overview_label')}</p><h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{customer.business_name}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">{t('dashboard.overview_help')}</p></div>
                <div className="relative z-10 mt-6 flex flex-wrap gap-3 lg:mt-0 lg:justify-end"><Link className="gold-button rounded-xl px-5 py-3 text-sm font-bold shadow-lg shadow-black/10" href={route('home')}>{t('nav.activate')}</Link><a className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/15" href={route('statistics.export')}>{t('dashboard.export')}</a></div>
                <span className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-[#E1A339]/20" /><span className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full bg-[#E1A339]/10 blur-2xl" />
            </section>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {metrics.map(([label, value, icon], index) => <SummaryCard key={label} label={label} value={value} icon={icon} featured={index === 1} locale={locale} />)}
            </div>

            <section className="surface-card mt-5 rounded-2xl bg-white p-5 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div><p className="text-sm font-bold uppercase tracking-[.16em] text-[#B8773C]">{t('dashboard.engagement')}</p><h2 className="mt-1 text-xl font-extrabold text-[#0B132B]">{t('dashboard.chart_title')}</h2></div>
                    <p className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">{t('dashboard.humans')}</p>
                </div>
                <ScanActivityChart series={series} locale={locale} t={t} />
            </section>

            <div className="mt-8">
                <p className="text-sm font-bold uppercase tracking-[.16em] text-[#B8773C]">{t('common.products')}</p>
                <h2 className="mt-1 text-2xl font-extrabold text-[#0B132B]">{t('dashboard.your_products')}</h2>
            </div>
            <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => <ProductCard key={product.id} product={product} t={t} />)}
                {!products.length && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-[#B8773C]"><ProductIcon /></div><p className="mt-4 font-bold text-[#0B132B]">{t('dashboard.no_products')}</p><p className="mt-2 text-sm text-slate-500">{t('dashboard.no_products_help')}</p><Link className="gold-button mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-bold" href={route('home')}>{t('nav.activate')}</Link></div>}
            </div>
        </div>
    </AuthenticatedLayout>;
}

function ProductCard({ product, t }) {
    const form = useForm({ google_review_url: product.google_review_url || '' });

    return <article className="surface-card overflow-hidden rounded-2xl bg-white transition hover:-translate-y-0.5 hover:shadow-xl">
        <div className="relative h-52 overflow-hidden bg-slate-200"><img src={product.image_url} alt={product.variant} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#0B132B]/95 via-[#0B132B]/20 to-transparent" /><div className="absolute inset-x-5 bottom-4 text-white"><span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold tracking-wide backdrop-blur">{product.variant}</span><h3 className="mt-3 text-xl font-extrabold">{product.code_id}</h3><p className="text-sm text-white/75">{t('common.batch')} {product.batch?.code}</p></div></div>
        <form className="space-y-4 p-5" onSubmit={(event) => { event.preventDefault(); form.patch(route('products.update', product.id)); }}>
            <div className="grid grid-cols-2 divide-x divide-slate-200 rounded-xl bg-slate-50 py-3 text-sm"><span className="px-3"><b className="text-lg text-[#0B132B]">{product.scans_7d}</b><span className="ml-1 text-slate-500">{t('dashboard.scans_short_7')}</span></span><span className="px-3"><b className="text-lg text-[#0B132B]">{product.scans_30d}</b><span className="ml-1 text-slate-500">{t('dashboard.scans_short_30')}</span></span></div>
            <label className="block text-sm font-semibold text-slate-700">{t('dashboard.review_url')}<input type="url" className="mt-2 w-full rounded-xl border-slate-300 text-sm focus:border-[#E1A339] focus:ring-[#E1A339]" value={form.data.google_review_url} onChange={(event) => form.setData('google_review_url', event.target.value)} placeholder={t('dashboard.review_url')} /></label>
            {form.errors.google_review_url && <p className="text-xs text-red-600">{form.errors.google_review_url}</p>}
            {form.recentlySuccessful && <p className="text-sm font-semibold text-emerald-700">{t('common.saved')}</p>}
            <button disabled={form.processing} className="gold-button w-full rounded-xl px-4 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-50">{t('dashboard.save_destination')}</button>
        </form>
    </article>;
}

function SummaryCard({ label, value, icon, featured, locale }) { return <article className={`surface-card relative overflow-hidden rounded-2xl p-5 sm:p-6 ${featured ? 'bg-gradient-to-br from-[#F1C156] to-[#E1A339] text-[#0B132B]' : 'bg-white text-[#0B132B]'}`}><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold opacity-65">{label}</p><p className="mt-2 text-3xl font-extrabold tracking-tight">{Number(value).toLocaleString(locale)}</p></div><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${featured ? 'bg-white/30' : 'bg-[#0B132B] text-[#F1C156]'}`}><MetricIcon type={icon} /></span></div><span className="absolute -bottom-8 -right-6 h-24 w-24 rounded-full border border-current opacity-[.06]" /></article>; }
function MetricIcon({ type }) { if (type === 'products') return <ProductIcon />; return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d={type === 'week' ? 'M8 2v3m8-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z' : 'M4 19V9m5 10V5m5 14v-7m5 7V3'} /></svg>; }
function ProductIcon() { return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 0v9m8-4.5-8 4.5m-8-4.5 8 4.5" /></svg>; }

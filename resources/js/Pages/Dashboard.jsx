import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function Dashboard({ customer, products, summary, series }) {
    const { locale, t } = useTranslation();
    const flash = usePage().props.flash;

    return <AuthenticatedLayout header={<h1 className="text-xl font-bold text-[#0b2854]">{customer.business_name}</h1>}>
        <Head title={t('dashboard.title')} />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {flash.success && <div className="mb-5 rounded-xl bg-emerald-50 p-4 text-emerald-800">{flash.success}</div>}
            <div className="grid gap-4 md:grid-cols-3">
                {[[t('dashboard.active_products'), summary.products], [t('dashboard.scans_7d'), summary.scans7d], [t('dashboard.scans_30d'), summary.scans30d]].map(([label, value]) => <div key={label} className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-[#0b2854]">{value}</p></div>)}
            </div>

            <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div><p className="text-sm text-slate-500">{t('dashboard.engagement')}</p><h2 className="text-lg font-bold">{t('dashboard.chart_title')}</h2></div>
                    <p className="text-sm text-slate-500">{t('dashboard.humans')}</p>
                </div>
                <ScanChart series={series} locale={locale} t={t} />
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold">{t('dashboard.your_products')}</h2>
                <div className="flex gap-2"><Link className="gold-button rounded-lg px-4 py-2 text-sm font-bold" href={route('home')}>{t('nav.activate')}</Link><a className="rounded-lg border bg-white px-4 py-2 text-sm" href={route('statistics.export')}>{t('dashboard.export')}</a></div>
            </div>
            <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => <ProductCard key={product.id} product={product} t={t} />)}
                {!products.length && <div className="col-span-full rounded-2xl border border-dashed bg-white p-10 text-center"><p className="font-semibold">{t('dashboard.no_products')}</p><p className="mt-2 text-sm text-slate-500">{t('dashboard.no_products_help')}</p></div>}
            </div>
        </div>
    </AuthenticatedLayout>;
}

function ScanChart({ series, locale, t }) {
    const max = Math.max(1, ...series.map((point) => Number(point.total)));
    const formatter = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });

    return <div className="mt-5 overflow-x-auto pb-2">
        <div className="grid h-52 min-w-[720px] grid-cols-[repeat(30,minmax(16px,1fr))] items-end gap-1.5 border-b border-slate-200 px-1" role="img" aria-label={t('dashboard.chart_accessible')}>
            {series.map((point, index) => {
                const count = Number(point.total);
                const label = formatter.format(new Date(`${point.day}T00:00:00Z`));
                const showDate = index % 5 === 0 || index === series.length - 1;

                return <div key={point.day} className="flex h-full min-w-0 flex-col items-center justify-end" title={t('dashboard.chart_tooltip', { date: label, count })}>
                    <span className={`mb-1 text-[10px] font-bold ${count ? 'text-[#0b2854]' : 'text-slate-400'}`}>{count}</span>
                    <div className={`w-full rounded-t-sm ${count ? 'bg-[#c49a49]' : 'bg-slate-200'}`} style={{ height: count ? `${Math.max(12, (count / max) * 138)}px` : '4px' }} />
                    <span className="mt-2 h-7 whitespace-nowrap text-[10px] text-slate-500">{showDate ? label : ''}</span>
                </div>;
            })}
        </div>
    </div>;
}

function ProductCard({ product, t }) {
    const form = useForm({ google_review_url: product.google_review_url || '' });

    return <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="relative h-48 overflow-hidden bg-slate-200"><img src={product.image_url} alt={product.variant} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#071a3b]/90 to-transparent" /><div className="absolute inset-x-5 bottom-4 text-white"><span className="rounded-full bg-white/20 px-3 py-1 text-xs">{product.variant}</span><h3 className="mt-3 text-xl font-bold">{product.code_id}</h3><p className="text-sm text-white/70">{t('common.batch')} {product.batch?.code}</p></div></div>
        <form className="space-y-3 p-5" onSubmit={(event) => { event.preventDefault(); form.patch(route('products.update', product.id)); }}>
            <div className="flex gap-5 text-sm"><span><b>{product.scans_7d}</b> {t('dashboard.scans_short_7')}</span><span><b>{product.scans_30d}</b> {t('dashboard.scans_short_30')}</span></div>
            <input className="w-full rounded-lg border-slate-300 text-sm" value={form.data.google_review_url} onChange={(event) => form.setData('google_review_url', event.target.value)} placeholder={t('dashboard.review_url')} />
            {form.errors.google_review_url && <p className="text-xs text-red-600">{form.errors.google_review_url}</p>}
            <button disabled={form.processing} className="gold-button w-full rounded-lg px-4 py-2 font-semibold">{t('dashboard.save_destination')}</button>
        </form>
    </article>;
}

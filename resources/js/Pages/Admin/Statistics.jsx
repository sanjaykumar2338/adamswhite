import ScanActivityChart from '@/Components/ScanActivityChart';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head, router } from '@inertiajs/react';

export default function Statistics({ days, total, series, variants, devices, countries, topCustomers, topProducts }) {
    const { locale, t } = useTranslation();
    const customerGrowth = series.reduce((sum, item) => sum + item.customers, 0);

    return <AuthenticatedLayout>
        <Head title={t('admin.advanced_statistics')} />
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <section className="rounded-3xl bg-[#0B132B] p-7 text-white sm:p-9">
                <p className="text-xs font-black uppercase tracking-[.2em] text-[#F1C156]">SHIFTRIX TRACK</p>
                <div className="mt-2 flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-3xl font-black">{t('admin.advanced_statistics')}</h1><p className="mt-2 max-w-2xl text-slate-300">{t('admin.statistics_help')}</p></div><div className="flex gap-2">{[7, 30, 90].map(value => <button key={value} onClick={() => router.get(route('admin.statistics.index'), { days: value }, { preserveState: true })} className={`rounded-xl px-4 py-2 text-sm font-black ${days === value ? 'bg-[#E1A339] text-[#0B132B]' : 'bg-white/10 text-white'}`}>{value} {t('statistics.days', { count: '' }).trim()}</button>)}</div></div>
            </section>
            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label={t('dashboard.total_eligible')} value={total} locale={locale}/><Metric label={t('admin.customer_growth')} value={customerGrowth} locale={locale}/>{variants.map(item => <Metric key={item.variant} label={item.variant === 'unknown' ? t('common.unavailable') : item.variant} value={item.total} locale={locale}/>)}</div>
            <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="text-xl font-black">{t('admin.eligible_trend')}</h2><ScanActivityChart series={series} locale={locale} t={t}/></section>
            <div className="mt-5 grid gap-5 lg:grid-cols-2"><Distribution title={t('admin.device_distribution')} rows={devices} total={total} t={t}/><Distribution title={t('admin.country_distribution')} rows={countries} total={total} t={t}/><Ranking title={t('admin.top_customers')} rows={topCustomers} label="name" locale={locale}/><Ranking title={t('admin.top_products')} rows={topProducts} label="code" locale={locale}/></div>
            <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t('admin.source_unavailable')}</p>
        </div>
    </AuthenticatedLayout>;
}
function Metric({ label, value, locale }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-3xl font-black text-[#0B132B]">{Number(value).toLocaleString(locale)}</p></article>; }
function Distribution({ title, rows, total, t }) { return <section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-black">{title}</h2><div className="mt-5 space-y-4">{rows.map(row => <div key={row.label}><div className="flex justify-between text-sm font-bold"><span>{row.label === 'unknown' ? t('common.unavailable') : row.label}</span><span>{row.total}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#E1A339]" style={{ width: `${total ? (row.total / total) * 100 : 0}%` }}/></div></div>)}{!rows.length && <p className="py-8 text-center text-sm text-slate-500">{t('statistics.empty')}</p>}</div></section>; }
function Ranking({ title, rows, label, locale }) { return <section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-black">{title}</h2><ol className="mt-4 divide-y divide-slate-100">{rows.map((row, index) => <li className="flex items-center gap-3 py-3" key={`${row.id}-${index}`}><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B132B] text-xs font-black text-[#F1C156]">{index + 1}</span><span className="min-w-0 flex-1 truncate font-bold">{row[label]}</span><span className="font-black">{Number(row.total).toLocaleString(locale)}</span></li>)}</ol></section>; }

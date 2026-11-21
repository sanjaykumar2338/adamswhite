import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ScanActivityChart from '@/Components/ScanActivityChart';
import { useTranslation } from '@/i18n';
import { Head, Link } from '@inertiajs/react';
import ReactApexChart from 'react-apexcharts';

export default function AdminDashboard({ metrics, scanSeries, variantDistribution, batchActivity, recentCustomers, deviceDistribution, countryDistribution, topProducts, topCustomers, recentActions }) {
    const { locale, t } = useTranslation();
    const metricCards = [
        { label: t('admin.active_customers'), value: metrics.activeCustomers, detail: t('admin.total_customers_value', { count: metrics.customers }), tone: 'navy' },
        { label: t('admin.claimed'), value: metrics.claimed, detail: t('admin.claim_rate_value', { rate: metrics.claimRate }), tone: 'gold' },
        { label: t('admin.missing_review'), value: metrics.missingReview, detail: t('admin.needs_configuration'), tone: 'green' },
        { label: t('admin.multi_product'), value: metrics.multiProductCustomers, detail: t('admin.customer_accounts'), tone: 'blue' },
        { label: t('admin.active_managers'), value: metrics.activeManagers, detail: t('admin.workspace_access'), tone: 'blue' },
        { label: t('admin.disabled_accounts'), value: metrics.disabledCustomers, detail: t('admin.dashboard_only'), tone: 'green' },
        { label: t('dashboard.scans_today'), value: metrics.scansToday, detail: t('dashboard.humans'), tone: 'navy' },
        { label: t('admin.total_inventory'), value: metrics.totalProducts, detail: t('admin.inventory_units'), tone: 'gold' },
    ];
    const variantLabels = variantDistribution.map((item) => item.variant);
    const variantValues = variantDistribution.map((item) => Number(item.total));
    const donutOptions = {
        chart: { type: 'donut', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' },
        labels: variantLabels,
        colors: ['#E1A339', '#0B132B', '#64748b'],
        stroke: { colors: ['#ffffff'], width: 4 },
        dataLabels: { enabled: false },
        legend: { position: 'bottom', fontWeight: 600, markers: { size: 6 } },
        plotOptions: { pie: { donut: { size: '72%', labels: { show: true, total: { show: true, label: t('admin.total_inventory'), formatter: () => Number(metrics.totalProducts).toLocaleString(locale) }, value: { fontWeight: 800, color: '#0B132B' } } } } },
        tooltip: { y: { formatter: (value) => t('admin.units_value', { count: Number(value).toLocaleString(locale) }) } },
        noData: { text: t('admin.no_inventory_data') },
        responsive: [{ breakpoint: 640, options: { chart: { height: 280 }, legend: { position: 'bottom' } } }],
    };

    return <AuthenticatedLayout>
        <Head title={t('admin.page_title')} />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <section className="relative overflow-hidden rounded-[1.75rem] bg-[#0B132B] px-6 py-7 text-white shadow-xl shadow-[#0B132B]/15 sm:px-8 lg:flex lg:items-end lg:justify-between lg:px-10 lg:py-9">
                <div className="relative z-10"><p className="text-sm font-bold uppercase tracking-[.22em] text-[#F1C156]">{t('admin.overview')}</p><h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{t('admin.title')}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">{t('admin.overview_help')}</p></div>
                <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 lg:mt-0 lg:min-w-[310px]">
                    <HeroMetric label={t('dashboard.range_7')} value={metrics.scans7d} locale={locale} />
                    <HeroMetric label={t('dashboard.range_30')} value={metrics.scans30d} locale={locale} />
                </div>
                <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-[#E1A339]/20" /><div className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full bg-[#E1A339]/10 blur-2xl" />
            </section>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metricCards.map((card) => <MetricCard key={card.label} {...card} locale={locale} />)}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.65fr_.85fr]">
                <section className="surface-card rounded-2xl bg-white p-5 sm:p-6">
                    <SectionHeading eyebrow={t('admin.analytics')} title={t('admin.scan_activity')} description={t('admin.scan_activity_help')} />
                    <ScanActivityChart series={scanSeries} locale={locale} t={t} />
                </section>
                <section className="surface-card rounded-2xl bg-white p-5 sm:p-6">
                    <SectionHeading eyebrow={t('admin.inventory_health')} title={t('admin.product_mix')} description={t('admin.product_mix_help')} />
                    {variantValues.length
                        ? <ReactApexChart options={donutOptions} series={variantValues} type="donut" height={315} />
                        : <div className="mt-5 flex h-[295px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full border-[7px] border-slate-200 border-t-[#E1A339]" aria-hidden="true" /><p className="mt-4 text-sm font-bold text-[#0B132B]">{t('admin.no_inventory_data')}</p></div>}
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm"><InventoryDetail label={t('admin.disabled')} value={metrics.disabled} /><InventoryDetail label={t('admin.claim_rate')} value={`${metrics.claimRate}%`} /></div>
                </section>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.75fr]">
                <section className="surface-card overflow-hidden rounded-2xl bg-white">
                    <div className="flex items-start justify-between gap-4 p-5 sm:p-6"><SectionHeading eyebrow={t('admin.inventory')} title={t('admin.batch_activity')} description={t('admin.batch_activity_help')} /><Link className="shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-[#B8773C] hover:bg-amber-50 hover:text-[#0B132B]" href={route('admin.products.index')}>{t('admin.view_inventory')}</Link></div>
                    <p className="px-5 pb-3 text-sm font-medium text-slate-500 sm:hidden">{t('common.table_scroll_hint')}</p>
                    <div className="table-scroll overflow-x-auto" tabIndex="0" aria-label={t('admin.batch_activity')}><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-y border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-3">{t('common.batch')}</th><th className="px-4 py-3">{t('admin.claimed')}</th><th className="px-4 py-3">{t('admin.available')}</th><th className="px-4 py-3">{t('admin.scans30d')}</th><th className="px-6 py-3">{t('admin.claim_rate')}</th></tr></thead><tbody>{batchActivity.map((batch) => {
                        const rate = batch.products_count ? Math.round((batch.claimed_count / batch.products_count) * 100) : 0;
                        return <tr className="border-b border-slate-100 last:border-0" key={batch.id}><td className="px-6 py-4"><p className="font-bold text-[#0B132B]">{batch.code}</p><p className="mt-1 text-xs text-slate-500">{t('admin.units_value', { count: batch.products_count })}</p></td><td className="px-4 py-4 font-semibold">{batch.claimed_count.toLocaleString(locale)}</td><td className="px-4 py-4">{batch.available_count.toLocaleString(locale)}</td><td className="px-4 py-4"><span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-800">{batch.scans_30d.toLocaleString(locale)}</span></td><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#E1A339]" style={{ width: `${rate}%` }} /></div><span className="text-xs font-bold text-slate-600">{rate}%</span></div></td></tr>;
                    })}{!batchActivity.length && <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-500">{t('admin.no_batch_activity')}</td></tr>}</tbody></table></div>
                </section>
                <section className="surface-card rounded-2xl bg-white p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4"><SectionHeading eyebrow={t('admin.customers')} title={t('admin.recent_customers')} /><Link className="shrink-0 rounded-lg px-2 py-1 text-sm font-bold text-[#B8773C] hover:bg-amber-50 hover:text-[#0B132B]" href={route('admin.customers.index')}>{t('admin.view_all')}</Link></div>
                    <div className="mt-5 space-y-1">{recentCustomers.map((customer) => <div key={customer.id} className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-slate-50"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B132B] text-sm font-extrabold text-[#F1C156]">{customer.business_name.charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#0B132B]">{customer.business_name}</p><p className="mt-0.5 text-xs text-slate-500">{t('admin.customer_activity', { products: customer.products_count, users: customer.users_count })}</p></div><StatusBadge status={customer.status} t={t} /></div>)}{!recentCustomers.length && <p className="py-8 text-center text-sm text-slate-500">{t('admin.no_customers')}</p>}</div>
                </section>
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3"><MiniList title={t('admin.device_distribution')} rows={deviceDistribution} label="label" locale={locale}/><MiniList title={t('admin.country_distribution')} rows={countryDistribution} label="label" locale={locale}/><MiniList title={t('admin.top_products')} rows={topProducts} label="code_id" locale={locale}/><MiniList title={t('admin.top_customers')} rows={topCustomers} label="business_name" locale={locale}/><section className="surface-card rounded-2xl bg-white p-5 lg:col-span-2"><SectionHeading eyebrow={t('admin.activity_log')} title={t('admin.recent_actions')}/><div className="mt-3 divide-y divide-slate-100">{recentActions.map(action => <div className="flex justify-between gap-3 py-3 text-sm" key={action.id}><div><p className="font-bold">{action.action}</p><p className="text-slate-500">{action.actor?.name || t('admin.system_actor')}</p></div><time className="text-xs text-slate-500">{new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(action.created_at))}</time></div>)}{!recentActions.length && <p className="py-6 text-sm text-slate-500">{t('admin.no_recent_actions')}</p>}</div></section></div>
        </div>
    </AuthenticatedLayout>;
}

function HeroMetric({ label, value, locale }) { return <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"><p className="text-sm font-semibold text-slate-300">{label}</p><p className="mt-2 text-2xl font-extrabold text-[#F1C156]">{Number(value).toLocaleString(locale)}</p></div>; }
function MetricCard({ label, value, detail, tone, locale }) { const tones = { navy: 'bg-[#0B132B] text-white', gold: 'bg-gradient-to-br from-[#F1C156] to-[#E1A339] text-[#0B132B]', green: 'bg-emerald-50 text-emerald-950', blue: 'bg-blue-50 text-blue-950' }; return <article className={`relative overflow-hidden rounded-2xl p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${tones[tone]}`}><p className="text-xs font-bold uppercase tracking-[.13em] opacity-65">{label}</p><p className="mt-3 text-3xl font-extrabold tracking-tight">{Number(value).toLocaleString(locale)}</p><p className="mt-2 text-sm font-semibold opacity-65">{detail}</p><span className="absolute -bottom-8 -right-6 h-24 w-24 rounded-full border border-current opacity-10" /></article>; }
function SectionHeading({ eyebrow, title, description }) { return <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#B8773C]">{eyebrow}</p><h2 className="mt-1 text-xl font-extrabold text-[#0B132B]">{title}</h2>{description && <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>}</div>; }
function InventoryDetail({ label, value }) { return <div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-1 text-lg font-extrabold text-[#0B132B]">{value}</p></div>; }
function StatusBadge({ status, t }) { return <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{t(`common.status_${status}`)}</span>; }
function MiniList({ title, rows, label, locale }) { return <section className="surface-card rounded-2xl bg-white p-5"><h2 className="text-lg font-extrabold">{title}</h2><div className="mt-3 divide-y divide-slate-100">{rows.map((row, index) => <div className="flex justify-between py-3 text-sm" key={`${row[label]}-${index}`}><span className="font-semibold">{row[label]}</span><span className="font-black">{Number(row.total).toLocaleString(locale)}</span></div>)}{!rows.length && <p className="py-6 text-sm text-slate-500">—</p>}</div></section>; }

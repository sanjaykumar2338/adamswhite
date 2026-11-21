import ScanActivityChart from '@/Components/ScanActivityChart';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head, router } from '@inertiajs/react';
import ReactApexChart from 'react-apexcharts';

export default function Statistics({ days, timezone, total, series, variants, devices, countries, topCustomers, topProducts }) {
    const { locale, t } = useTranslation();
    const customerGrowth = series.reduce((sum, item) => sum + Number(item.customers), 0);
    const activeDays = series.filter((item) => Number(item.total) > 0).length;
    const dateLabel = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' });
    const categories = series.map((item) => dateLabel.format(new Date(`${item.day}T00:00:00Z`)));
    const sharedChart = { chart: { toolbar: { show: false }, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', foreColor: '#64748b' }, dataLabels: { enabled: false }, grid: { borderColor: '#e2e8f0', strokeDashArray: 4 }, legend: { position: 'bottom', fontWeight: 600 }, noData: { text: t('statistics.empty') } };
    const dailyOptions = { ...sharedChart, colors: ['#F4B942'], plotOptions: { bar: { borderRadius: 5, columnWidth: days === 90 ? '72%' : '55%' } }, xaxis: { categories, tickAmount: days === 7 ? 6 : 7, axisBorder: { show: false }, axisTicks: { show: false }, labels: { rotate: 0, hideOverlappingLabels: true } }, yaxis: { min: 0, forceNiceScale: true, decimalsInFloat: 0, labels: { formatter: (value) => String(Math.round(value)) } }, tooltip: { y: { formatter: (value) => t('dashboard.scan_count', { count: value }) } }, responsive: [{ breakpoint: 640, options: { chart: { height: 260 }, xaxis: { tickAmount: 4 } } }] };
    const productOptions = { ...sharedChart, labels: variants.map((item) => item.variant === 'unknown' ? t('common.unavailable') : item.variant), colors: ['#F4B942', '#0B132B', '#6883BA', '#CBD5E1'], stroke: { colors: ['#fff'], width: 4 }, plotOptions: { pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: t('dashboard.total_scans'), formatter: () => Number(total).toLocaleString(locale) } } } } }, tooltip: { y: { formatter: (value) => t('dashboard.scan_count', { count: value }) } } };
    const deviceOptions = { ...sharedChart, labels: devices.map((item) => item.label === 'unknown' ? t('common.unavailable') : item.label), colors: ['#0B132B', '#F4B942', '#6883BA', '#CBD5E1'], stroke: { colors: ['#fff'], width: 4 }, plotOptions: { pie: { donut: { size: '68%' } } }, tooltip: { y: { formatter: (value) => t('dashboard.scan_count', { count: value }) } } };

    return <AuthenticatedLayout>
        <Head title={t('admin.advanced_statistics')} />
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
            <section className="premium-hero rounded-3xl p-7 text-white shadow-xl shadow-[#0B132B]/10 sm:p-9">
                <p className="text-xs font-black uppercase tracking-[.2em] text-[#FFDC7A]" translate="no">SHIFTRIX TRACK</p>
                <div className="mt-2 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="text-3xl font-black sm:text-4xl">{t('admin.advanced_statistics')}</h1><p className="mt-2 max-w-2xl leading-7 text-slate-300">{t('admin.statistics_help')}</p><p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t('statistics.timezone')}: <span className="text-[#FFDC7A]">{timezone}</span></p></div><div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/[.06] p-1.5">{[7, 30, 90].map((value) => <button key={value} type="button" aria-pressed={days === value} onClick={() => router.get(route('admin.statistics.index'), { days: value }, { preserveState: true, preserveScroll: true })} className={`rounded-xl px-3 py-2.5 text-sm font-black sm:px-5 ${days === value ? 'metallic-gold text-[#0B132B] shadow-lg' : 'text-white hover:bg-white/10'}`}>{t('statistics.days', { count: value })}</button>)}</div></div>
            </section>

            <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4"><Metric label={t('dashboard.total_eligible')} value={total} detail={t('statistics.bots_excluded')} locale={locale}/><Metric label={t('admin.customer_growth')} value={customerGrowth} detail={t('admin.selected_period')} locale={locale}/><Metric label={t('admin.active_days')} value={activeDays} detail={t('admin.selected_period')} locale={locale}/><Metric label={t('admin.reporting_window')} value={days} detail={t('statistics.days', { count: days })} locale={locale}/></div>

            <section className="premium-panel mt-5 rounded-3xl p-5 sm:p-7"><SectionTitle eyebrow={t('statistics.trend')} title={t('admin.eligible_trend')} description={t('admin.real_data_note')}/><ScanActivityChart series={series} locale={locale} t={t} defaultRange={days} showRangeSelector={false}/></section>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
                <ChartCard title={t('statistics.daily_scans')} description={t('admin.daily_chart_help')} empty={total === 0} t={t}><ReactApexChart type="bar" height={320} options={dailyOptions} series={[{ name: t('dashboard.scans'), data: series.map((item) => Number(item.total)) }]}/></ChartCard>
                <ChartCard title={t('admin.product_mix')} description={t('admin.period_product_mix')} empty={total === 0 || variants.length === 0} t={t}><ReactApexChart type="donut" height={320} options={productOptions} series={variants.map((item) => Number(item.total))}/></ChartCard>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <ChartCard title={t('admin.device_distribution')} description={t('statistics.metadata_note')} empty={total === 0 || devices.length === 0} t={t}><ReactApexChart type="donut" height={325} options={deviceOptions} series={devices.map((item) => Number(item.total))}/></ChartCard>
                <Distribution title={t('admin.country_distribution')} rows={countries} total={total} t={t} locale={locale}/>
                <Ranking title={t('admin.top_customers')} rows={topCustomers} label="name" locale={locale} t={t}/>
                <Ranking title={t('admin.top_products')} rows={topProducts} label="code" locale={locale} t={t}/>
            </div>
            <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">{t('admin.source_unavailable')}</p>
        </div>
    </AuthenticatedLayout>;
}

function Metric({ label, value, detail, locale }) { return <article className="premium-panel relative min-w-0 overflow-hidden rounded-2xl p-5"><span className="absolute inset-x-0 top-0 h-1 metallic-gold"/><p className="min-h-10 break-words text-[11px] font-bold uppercase leading-5 tracking-[.08em] text-slate-500 sm:text-xs">{label}</p><p className="mt-2 text-3xl font-black text-[#0B132B]">{Number(value).toLocaleString(locale)}</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-400">{detail}</p></article>; }
function SectionTitle({ eyebrow, title, description }) { return <div><p className="section-eyebrow">{eyebrow}</p><h2 className="mt-1 text-xl font-black text-[#0B132B] sm:text-2xl">{title}</h2>{description && <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>}</div>; }
function ChartCard({ title, description, empty, t, children }) { return <section className="premium-panel rounded-3xl p-5 sm:p-7"><h2 className="text-xl font-black text-[#0B132B]">{title}</h2>{description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{description}</p>}{empty ? <Empty t={t}/> : <div className="mt-3 min-w-0">{children}</div>}</section>; }
function Distribution({ title, rows, total, t, locale }) { return <section className="premium-panel rounded-3xl p-5 sm:p-7"><h2 className="text-xl font-black text-[#0B132B]">{title}</h2><div className="mt-5 space-y-4">{rows.map((row) => <div key={row.label}><div className="flex justify-between gap-4 text-sm font-bold"><span>{row.label === 'unknown' ? t('statistics.country_unknown') : row.label}</span><span>{Number(row.total).toLocaleString(locale)}</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full metallic-gold" style={{ width: `${total ? (row.total / total) * 100 : 0}%` }}/></div></div>)}{!rows.length && <Empty t={t}/>}</div></section>; }
function Ranking({ title, rows, label, locale, t }) { return <section className="premium-panel rounded-3xl p-5 sm:p-7"><h2 className="text-xl font-black text-[#0B132B]">{title}</h2>{rows.length ? <ol className="mt-4 divide-y divide-slate-100">{rows.map((row, index) => <li className="flex items-center gap-3 py-3" key={`${row.id}-${index}`}><span className="metallic-gold flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black text-[#0B132B]">{index + 1}</span><span className="min-w-0 flex-1 truncate font-bold">{row[label]}</span><span className="font-black">{Number(row.total).toLocaleString(locale)}</span></li>)}</ol> : <Empty t={t}/>}</section>; }
function Empty({ t }) { return <div className="mt-5 flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center"><span className="flex h-12 w-12 items-end justify-center gap-1 rounded-2xl bg-white shadow-sm" aria-hidden="true"><i className="mb-3 h-2 w-1.5 rounded-full bg-[#F4B942]/40"/><i className="mb-3 h-4 w-1.5 rounded-full bg-[#F4B942]/65"/><i className="mb-3 h-6 w-1.5 rounded-full bg-[#F4B942]"/></span><p className="mt-4 text-sm font-bold text-[#0B132B]">{t('statistics.empty')}</p></div>; }

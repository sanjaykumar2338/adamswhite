import ReactApexChart from 'react-apexcharts';
import { useMemo, useState } from 'react';

export default function ScanActivityChart({ series, locale, t, defaultRange = 30, showRangeSelector = true }) {
    const [range, setRange] = useState(defaultRange);
    const points = useMemo(() => series.slice(-range), [range, series]);
    const total = points.reduce((sum, point) => sum + Number(point.total), 0);
    const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    }), [locale]);
    const chartSeries = [{
        name: t('dashboard.scans'),
        data: points.map((point) => [new Date(`${point.day}T00:00:00Z`).getTime(), Number(point.total)]),
    }];
    const options = {
        chart: {
            id: 'scan-activity',
            type: 'area',
            toolbar: { show: false },
            zoom: { enabled: false },
            parentHeightOffset: 0,
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
            foreColor: '#64748b',
            animations: { enabled: true, speed: 450 },
            dropShadow: { enabled: true, top: 5, left: 0, blur: 7, color: '#E1A339', opacity: 0.14 },
        },
        colors: ['#E1A339'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3, lineCap: 'round' },
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.03, stops: [0, 90, 100] },
        },
        markers: {
            size: range === 7 ? 4 : 0,
            strokeWidth: 3,
            strokeColors: '#ffffff',
            hover: { sizeOffset: 2 },
        },
        grid: { borderColor: '#e2e8f0', strokeDashArray: 4, padding: { left: 8, right: 12 } },
        xaxis: {
            type: 'datetime',
            tickAmount: range === 7 ? 6 : 5,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                datetimeUTC: true,
                hideOverlappingLabels: true,
                formatter: (value, timestamp) => dateFormatter.format(new Date(timestamp ?? value)),
                style: { fontSize: '12px', fontWeight: 500 },
            },
        },
        yaxis: {
            min: 0,
            forceNiceScale: true,
            decimalsInFloat: 0,
            labels: { formatter: (value) => String(Math.round(value)), style: { fontSize: '12px', fontWeight: 500 } },
        },
        tooltip: {
            theme: 'light',
            marker: { show: true },
            x: { formatter: (value) => dateFormatter.format(new Date(value)) },
            y: { formatter: (value) => t('dashboard.scan_count', { count: Math.round(value) }) },
        },
        noData: { text: t('dashboard.chart_empty') },
        responsive: [{
            breakpoint: 640,
            options: {
                chart: { height: 250 },
                grid: { padding: { left: 0, right: 4 } },
                xaxis: { tickAmount: range === 7 ? 3 : 3 },
                yaxis: { labels: { minWidth: 24 } },
            },
        }],
    };

    return <section className="mt-3" aria-label={t('dashboard.chart_accessible')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div><span className="text-3xl font-extrabold text-[#0B132B]">{total.toLocaleString(locale)}</span><span className="ml-2 text-sm font-medium text-slate-500">{t('dashboard.total_scans')}</span></div>
            {showRangeSelector && <div className="inline-flex rounded-xl bg-slate-100 p-1" role="group" aria-label={t('dashboard.chart_range')}>
                {[7, 30].map((days) => <button key={days} type="button" aria-pressed={range === days} onClick={() => setRange(days)} className={`rounded-lg px-3.5 py-2 text-sm font-bold transition ${range === days ? 'bg-[#0B132B] text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-[#0B132B]'}`}>{t(`dashboard.range_${days}`)}</button>)}
            </div>}
        </div>
        {total > 0
            ? <ReactApexChart options={options} series={chartSeries} type="area" height={290} />
            : <div className="mt-4 flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center sm:h-[290px]">
                <div className="flex h-12 w-12 items-end justify-center gap-1 rounded-2xl bg-white shadow-sm" aria-hidden="true"><span className="mb-3 h-2 w-1.5 rounded-full bg-[#E1A339]/40" /><span className="mb-3 h-4 w-1.5 rounded-full bg-[#E1A339]/65" /><span className="mb-3 h-6 w-1.5 rounded-full bg-[#E1A339]" /></div>
                <p className="mt-4 text-sm font-bold text-[#0B132B]">{t('dashboard.chart_empty')}</p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{t('dashboard.chart_empty_help')}</p>
            </div>}
    </section>;
}

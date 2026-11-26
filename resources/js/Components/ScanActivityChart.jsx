import ReactApexChart from 'react-apexcharts';
import { useMemo, useState } from 'react';
import { chartDateFormatter } from '@/lib/localizedDates';

export default function ScanActivityChart({ series, locale, t, defaultRange = 30, showRangeSelector = true }) {
    const [range, setRange] = useState(defaultRange);
    const points = useMemo(() => series.slice(-range), [range, series]);
    const total = points.reduce((sum, point) => sum + Number(point.total), 0);
    const peakIndex = points.reduce((best, point, index) => Number(point.total) > Number(points[best]?.total ?? -1) ? index : best, 0);
    const formatDate = useMemo(() => chartDateFormatter(locale), [locale]);
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
            animations: { enabled: true, speed: 600, dynamicAnimation: { enabled: true, speed: 350 } },
            dropShadow: { enabled: true, top: 5, left: 0, blur: 7, color: '#E6C87A', opacity: 0.12 },
        },
        colors: ['#E6C87A'],
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3, lineCap: 'round' },
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 0, opacityFrom: 0.18, opacityTo: 0, stops: [0, 100] },
        },
        markers: {
            size: range === 7 ? 4 : 0,
            strokeWidth: 3,
            strokeColors: '#ffffff',
            hover: { sizeOffset: 2 },
            discrete: total > 0 ? [{ seriesIndex: 0, dataPointIndex: peakIndex, fillColor: '#FFFFFF', strokeColor: '#8F6D1E', size: 6, shape: 'circle' }] : [],
        },
        grid: { borderColor: '#e2e8f0', strokeDashArray: 4, padding: { left: 16, right: 12, bottom: 4 } },
        xaxis: {
            type: 'datetime',
            tickAmount: range === 7 ? 6 : 5,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                datetimeUTC: true,
                hideOverlappingLabels: true,
                formatter: (value, timestamp) => formatDate(timestamp ?? value),
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
            x: { formatter: (value) => formatDate(value) },
            y: { formatter: (value) => t('dashboard.scan_count', { count: Math.round(value) }) },
        },
        noData: { text: t('dashboard.chart_empty') },
        responsive: [{
            breakpoint: 640,
            options: {
                chart: { height: 250 },
                grid: { padding: { left: 10, right: 4 } },
                xaxis: { tickAmount: range === 7 ? 3 : 3 },
                yaxis: { labels: { minWidth: 24 } },
            },
        }],
    };

    return <section className="mt-3" aria-label={t('dashboard.chart_accessible')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
            <div><span className="text-3xl font-extrabold text-[#0B1120]">{total.toLocaleString(locale)}</span><span className="ml-2 text-sm font-medium text-slate-500">{t('dashboard.total_scans')}</span></div>
            {showRangeSelector && <div className="inline-flex rounded-[10px] bg-slate-100 p-1" role="group" aria-label={t('dashboard.chart_range')}>
                {[7, 30].map((days) => <button key={days} type="button" aria-pressed={range === days} onClick={() => setRange(days)} className={`rounded-lg px-3.5 py-2 text-sm font-bold transition ${range === days ? 'bg-[#0B1120] text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-[#0B1120]'}`}>{t(`dashboard.range_${days}`)}</button>)}
            </div>}
        </div>
        <ReactApexChart options={options} series={chartSeries} type="area" height={290} />
        {total === 0 && <p className="-mt-3 text-center text-xs font-semibold text-slate-500">{t('dashboard.chart_empty_help')}</p>}
    </section>;
}

import ScanActivityChart from "@/Components/ScanActivityChart";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { countryName } from "@/countryNames";
import { useTranslation } from "@/i18n";
import { Head, Link } from "@inertiajs/react";
import ReactApexChart from "react-apexcharts";

export default function StatisticsIndex({
    days,
    timezone,
    total,
    series,
    weekday,
    hourly,
    devices,
    countries,
    topProducts,
    topStaff,
    topLocations,
    mostActive,
    locations,
    selectedLocation,
}) {
    const { t, locale } = useTranslation();
    const weekdayLabels = Array.from({ length: 7 }, (_, day) =>
        new Intl.DateTimeFormat(locale, {
            weekday: "short",
            timeZone: "UTC",
        }).format(new Date(Date.UTC(2026, 10, 15 + day))),
    );
    const deviceLabels = devices.map((item) =>
        t(`statistics.device_${item.category}`),
    );
    const baseBar = (categories) => ({
        chart: {
            toolbar: { show: false },
            fontFamily: "Inter, sans-serif",
            foreColor: "#64748b",
        },
        colors: ["#F4B942"],
        plotOptions: { bar: { borderRadius: 5, columnWidth: "55%" } },
        dataLabels: { enabled: false },
        grid: { borderColor: "#e2e8f0", strokeDashArray: 4 },
        xaxis: {
            categories,
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: { min: 0, forceNiceScale: true, decimalsInFloat: 0 },
        tooltip: {
            y: {
                formatter: (value) =>
                    t("dashboard.scan_count", { count: value }),
            },
        },
    });
    const deviceOptions = {
        chart: { toolbar: { show: false }, fontFamily: "Inter, sans-serif" },
        labels: deviceLabels,
        colors: ["#F4B942", "#0B132B", "#6883BA", "#CBD5E1"],
        legend: { position: "bottom" },
        dataLabels: { enabled: total > 0 },
        stroke: { colors: ["#fff"], width: 3 },
        noData: { text: t("statistics.empty") },
    };

    return (
        <AuthenticatedLayout
            header={
                <>
                    <p
                        className="text-xs font-bold uppercase tracking-[.2em] text-[#B7791F]"
                        translate="no"
                    >
                        SHIFTRIX TRACK
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-500">
                        {t("statistics.workspace")}
                    </p>
                </>
            }
        >
            <Head title={t("statistics.title")} />
            <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8 xl:px-10">
                <section className="premium-hero rounded-3xl px-6 py-7 text-white shadow-xl shadow-[#0B132B]/10 sm:px-8 lg:flex lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[.22em] text-[#FFDC7A]">
                            {t("statistics.eyebrow")}
                        </p>
                        <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                            {t("statistics.title")}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                            {t("statistics.intro")}
                        </p>
                    </div>
                    <a
                        href={route("statistics.export", { days, location: selectedLocation || undefined })}
                        className="mt-5 inline-flex rounded-xl bg-[#F4B942] px-5 py-3 text-sm font-black text-[#0B132B] hover:bg-[#FFDC7A] lg:mt-0"
                    >
                        {t("statistics.export")}
                    </a>
                </section>

                <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                    <div className="inline-flex rounded-xl bg-slate-100 p-1">
                        {[7, 30, 90].map((value) => (
                            <Link
                                key={value}
                                href={route("statistics.index", {
                                    days: value,
                                    location: selectedLocation || undefined,
                                })}
                                preserveScroll
                                className={`rounded-lg px-4 py-2 text-sm font-black ${days === value ? "bg-[#0B132B] text-white shadow-sm" : "text-slate-600"}`}
                            >
                                {t("statistics.days", { count: value })}
                            </Link>
                        ))}
                    </div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        {t("locations.filter")}
                        <select value={selectedLocation || ""} onChange={(event) => window.location.assign(route("statistics.index", { days, location: event.target.value || undefined }))} className="rounded-xl border-slate-200 py-2 text-sm text-[#0B132B] focus:border-[#F4B942] focus:ring-[#F4B942]">
                            <option value="">{t("locations.all")}</option>
                            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                        </select>
                    </label>
                    <p className="text-sm font-semibold text-slate-500">
                        {t("statistics.timezone")}:{" "}
                        <span className="text-[#0B132B]">{timezone}</span>
                    </p>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <Stat
                        value={total.toLocaleString(locale)}
                        label={t("statistics.real_total")}
                        detail={t("statistics.bots_excluded")}
                    />
                    <Stat
                        value={
                            mostActive.day
                                ? new Intl.DateTimeFormat(locale, {
                                      dateStyle: "medium",
                                      timeZone: "UTC",
                                  }).format(
                                      new Date(
                                          `${mostActive.day.day}T00:00:00Z`,
                                      ),
                                  )
                                : "—"
                        }
                        label={t("statistics.active_day")}
                        detail={
                            mostActive.day
                                ? t("dashboard.scan_count", {
                                      count: mostActive.day.total,
                                  })
                                : t("statistics.unavailable")
                        }
                    />
                    <Stat
                        value={
                            mostActive.hour
                                ? `${String(mostActive.hour.hour).padStart(2, "0")}:00`
                                : "—"
                        }
                        label={t("statistics.active_hour")}
                        detail={
                            mostActive.hour
                                ? t("dashboard.scan_count", {
                                      count: mostActive.hour.total,
                                  })
                                : t("statistics.unavailable")
                        }
                    />
                </div>

                <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#B7791F]">
                            {t("statistics.trend")}
                        </p>
                        <h2 className="mt-1 text-xl font-black text-[#0B132B]">
                            {t("statistics.daily_scans")}
                        </h2>
                    </div>
                    <ScanActivityChart
                        series={series}
                        locale={locale}
                        t={t}
                        defaultRange={days}
                        showRangeSelector={false}
                    />
                </section>

                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                    <ChartCard
                        title={t("statistics.weekday")}
                        empty={false}
                        t={t}
                    >
                        <ReactApexChart
                            type="bar"
                            height={300}
                            options={baseBar(weekdayLabels)}
                            series={[
                                {
                                    name: t("dashboard.scans"),
                                    data: weekday.map((item) => item.total),
                                },
                            ]}
                        />
                    </ChartCard>
                    <ChartCard
                        title={t("statistics.hour")}
                        empty={false}
                        t={t}
                    >
                        <ReactApexChart
                            type="bar"
                            height={300}
                            options={baseBar(
                                hourly.map(
                                    (item) =>
                                        `${String(item.hour).padStart(2, "0")}h`,
                                ),
                            )}
                            series={[
                                {
                                    name: t("dashboard.scans"),
                                    data: hourly.map((item) => item.total),
                                },
                            ]}
                        />
                    </ChartCard>
                </div>
                <div className="mt-5 grid gap-5 xl:grid-cols-3">
                    <ChartCard
                        title={t("statistics.devices")}
                        empty={total === 0}
                        t={t}
                    >
                        <ReactApexChart
                            type="donut"
                            height={310}
                            options={deviceOptions}
                            series={devices.map((item) => item.total)}
                        />
                    </ChartCard>
                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                        <h2 className="text-lg font-black text-[#0B132B]">
                            {t("statistics.countries")}
                        </h2>
                        {countries.length ? (
                            <div className="mt-5 space-y-3">
                                {countries.map((item) => (
                                    <div
                                        key={item.country}
                                        className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                                    >
                                        <span className="text-sm font-bold text-slate-700">
                                            {countryName(
                                                item.country,
                                                locale,
                                                t("statistics.country_unknown"),
                                            )}
                                        </span>
                                        <span className="rounded-lg bg-[#FFF4D6] px-3 py-1 text-sm font-black text-[#9A6417]">
                                            {item.total}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty t={t} />
                        )}
                    </section>
                </div>
                <div className="mt-5 grid gap-5 xl:grid-cols-2">
                    <Ranking
                        title={t("statistics.top_products")}
                        rows={topProducts}
                        locale={locale}
                        empty={t("statistics.empty")}
                        label={(row) => row.display_name || row.code_id}
                    />
                    <Ranking
                        title={t("statistics.top_staff")}
                        rows={topStaff}
                        locale={locale}
                        empty={t("statistics.no_named_products")}
                        label={(row) => row.display_name}
                    />
                    <Ranking
                        title={t("statistics.top_locations")}
                        rows={topLocations}
                        locale={locale}
                        empty={t("statistics.no_locations")}
                        label={(row) => row.name}
                    />
                </div>
                <p className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-xs leading-5 text-blue-800">
                    {t("statistics.metadata_note")}{" "}
                    <a
                        href="https://ipinfo.io"
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline decoration-blue-300 underline-offset-2 hover:text-blue-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4B942]"
                    >
                        {t("statistics.ipinfo_attribution")}
                    </a>
                </p>
            </div>
        </AuthenticatedLayout>
    );
}

function Stat({ value, label, detail }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-2xl font-black text-[#0B132B]">{value}</p>
            <p className="mt-1 text-sm font-bold text-slate-700">{label}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
    );
}
function ChartCard({ title, empty, t, children }) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-black text-[#0B132B]">{title}</h2>
            {empty ? <Empty t={t} /> : <div className="mt-3">{children}</div>}
        </section>
    );
}
function Empty({ t }) {
    return (
        <div className="mt-5 flex h-52 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm font-semibold text-slate-500">
            {t("statistics.empty")}
        </div>
    );
}
function Ranking({ title, rows, locale, empty, label }) {
    const maximum = Math.max(...rows.map((row) => Number(row.total)), 1);
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-lg font-black text-[#0B132B]">{title}</h2>
            {rows.length ? (
                <div className="mt-5 space-y-4">
                    {rows.map((row, index) => (
                        <div key={row.id}>
                            <div className="flex items-center justify-between gap-4 text-sm">
                                <span className="min-w-0 truncate font-bold text-slate-700">
                                    <span className="mr-2 text-slate-400">
                                        {index + 1}.
                                    </span>
                                    {label(row)}
                                </span>
                                <span className="shrink-0 font-black text-[#0B132B]">
                                    {Number(row.total).toLocaleString(locale)}
                                </span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="ranking-bar h-full rounded-full bg-gradient-to-r from-[#0B132B] to-[#F4B942]"
                                    style={{
                                        width: `${Math.max((Number(row.total) / maximum) * 100, 4)}%`,
                                        animationDelay: `${index * 55}ms`,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm font-semibold text-slate-500">
                    {empty}
                </p>
            )}
        </section>
    );
}

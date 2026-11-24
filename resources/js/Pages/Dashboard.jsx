import ScanActivityChart from "@/Components/ScanActivityChart";
import AnimatedNumber from "@/Components/AnimatedNumber";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useTranslation } from "@/i18n";
import { dashboardWelcomeKey } from "@/lib/customerExperience";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";

export default function Dashboard({
    customer,
    products,
    summary,
    series,
    onboarding,
    timezone,
    locations,
    selectedLocation,
    scanMilestone,
}) {
    const { locale, t } = useTranslation();
    const page = usePage();
    const flash = page.props.flash;
    const supportEmail = page.props.support.email;
    const supportUrl = page.props.support.whatsappUrl || `mailto:${supportEmail}`;
    const firstName = page.props.auth.user.name.trim().split(/\s+/)[0];
    const milestoneForm = useForm({});
    const metrics = [
        {
            label: t("dashboard.total_eligible"),
            value: summary.totalScans,
            detail: t("dashboard.all_time"),
            icon: "pulse",
        },
        {
            label: t("dashboard.scans_today"),
            value: summary.scansToday,
            detail: t("dashboard.today_detail"),
            icon: "today",
        },
        {
            label: t("dashboard.scans_7d"),
            value: summary.scans7d,
            detail: t("dashboard.change_vs_previous", {
                change: formatChange(summary.scans7dChange, locale),
            }),
            icon: "trend",
            featured: true,
        },
        {
            label: t("dashboard.scans_30d"),
            value: summary.scans30d,
            detail: t("dashboard.rolling_period"),
            icon: "calendar",
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={t("dashboard.title")} />
            <div className="mx-auto max-w-[100rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
                {flash.success && (
                    <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-800">
                        {flash.success}
                    </div>
                )}

                {scanMilestone && <aside role="status" className="mb-5 flex flex-col gap-4 rounded-2xl border border-[#F4B942]/35 bg-amber-50/70 p-4 text-[#0B132B] shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B132B] font-black text-[#FFDC7A]">{scanMilestone.threshold}</span><div><p className="font-black">{t('dashboard.milestone_title', { count: scanMilestone.threshold })}</p><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{t('dashboard.milestone_body')}</p></div></div>
                    <button type="button" disabled={milestoneForm.processing} onClick={() => milestoneForm.patch(route('scan-milestone.dismiss'), { preserveScroll: true })} className="shrink-0 rounded-xl border border-[#0B132B]/15 bg-white px-4 py-2.5 text-sm font-black text-[#0B132B] hover:border-[#F4B942] disabled:opacity-50">{t('dashboard.milestone_dismiss')}</button>
                </aside>}

                <section className="relative overflow-hidden rounded-[1.75rem] bg-[#0B132B] px-6 py-7 text-white shadow-xl shadow-[#0B132B]/15 sm:px-8 lg:flex lg:items-end lg:justify-between lg:px-10 lg:py-9">
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#FFDC7A]">
                            {t("dashboard.overview_label")}
                        </p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                            {t(dashboardWelcomeKey(customer.account_type), { name: firstName })}
                        </h1>
                        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                            {customer.business_name} ·{" "}
                            {t("dashboard.overview_help")}
                        </p>
                    </div>
                    <div className="relative z-10 mt-6 flex flex-wrap gap-3 lg:mt-0 lg:justify-end">
                        <Link
                            className="gold-button rounded-xl px-5 py-3 text-sm font-bold shadow-lg shadow-black/10"
                            href={route("home")}
                        >
                            {t("nav.activate")}
                        </Link>
                        <a
                            className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur hover:bg-white/15"
                            href={route("statistics.export", { location: selectedLocation || undefined })}
                        >
                            {t("dashboard.export")}
                        </a>
                    </div>
                    <span className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-[#F4B942]/20" />
                    <span className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full bg-[#F4B942]/10 blur-2xl" />
                </section>

                <LocationFilter locations={locations} selectedLocation={selectedLocation} routeName="dashboard" t={t} />

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((metric) => (
                        <MetricCard
                            key={metric.label}
                            {...metric}
                            locale={locale}
                        />
                    ))}
                </div>

                <section
                    id="statistics"
                    className="surface-card mt-5 scroll-mt-24 rounded-2xl bg-white p-5 sm:p-6 lg:p-7"
                >
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="section-eyebrow">
                                {t("dashboard.engagement")}
                            </p>
                            <h2 className="mt-1 text-xl font-extrabold text-[#0B132B]">
                                {t("dashboard.chart_title_30")}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {t("dashboard.timezone_note", { timezone })}
                            </p>
                        </div>
                        <p className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                            {t("dashboard.humans")}
                        </p>
                    </div>
                    <ScanActivityChart
                        series={series}
                        locale={locale}
                        t={t}
                        defaultRange={30}
                    />
                </section>

                <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(19rem,.75fr)]">
                    <QuickProductCard products={products} t={t} />
                    <OnboardingCard onboarding={onboarding} t={t} />
                </div>

                <section id="products" className="mt-9 scroll-mt-24">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="section-eyebrow">
                                {t("common.products")}
                            </p>
                            <h2 className="mt-1 text-2xl font-extrabold">
                                {t("dashboard.your_products")}
                            </h2>
                        </div>
                        <Link
                            href={route("home")}
                            className="text-sm font-bold text-[#B7791F] hover:text-[#0B132B]"
                        >
                            {t("nav.activate")} →
                        </Link>
                    </div>
                    <div
                        className={`mt-4 grid gap-5 ${products.length === 1 ? "grid-cols-1" : "md:grid-cols-2 2xl:grid-cols-3"}`}
                    >
                        {products.map((product) => (
                            <ProductSummary
                                key={product.id}
                                product={product}
                                t={t}
                                featured={products.length === 1}
                            />
                        ))}
                        {!products.length && <EmptyProducts t={t} />}
                    </div>
                </section>

                <section
                    id="help"
                    className="mt-8 scroll-mt-24 rounded-2xl border border-[#F4B942]/25 bg-amber-50/70 p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6"
                >
                    <div>
                        <p className="font-bold text-[#0B132B]">
                            {t("dashboard.need_review_help")}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                            {t("dashboard.review_help_text")}
                        </p>
                    </div>
                    <a
                        href={supportUrl}
                        target={page.props.support.whatsappUrl ? "_blank" : undefined}
                        rel={page.props.support.whatsappUrl ? "noreferrer" : undefined}
                        className="mt-4 inline-flex shrink-0 rounded-xl border border-[#F4B942]/40 bg-white px-4 py-2.5 text-sm font-bold text-[#0B132B] shadow-sm transition hover:border-[#F4B942] hover:bg-[#fffaf0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F4B942] focus-visible:ring-offset-2 sm:mt-0"
                    >
                        {t("nav.contact_support")}
                    </a>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function LocationFilter({ locations, selectedLocation, routeName, t }) {
    if (!locations.length) return null;
    return <nav className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" aria-label={t("locations.filter")}>
        <span className="px-2 text-sm font-bold text-slate-500">{t("locations.filter")}:</span>
        <Link href={route(routeName)} preserveScroll className={`rounded-lg px-3 py-2 text-sm font-bold ${!selectedLocation ? "bg-[#0B132B] text-white" : "text-slate-600 hover:bg-slate-100"}`}>{t("locations.all")}</Link>
        {locations.map((location) => <Link key={location.id} href={route(routeName, { location: location.id })} preserveScroll className={`rounded-lg px-3 py-2 text-sm font-bold ${selectedLocation === location.id ? "bg-[#0B132B] text-white" : "text-slate-600 hover:bg-slate-100"}`}>{location.name}</Link>)}
    </nav>;
}

function QuickProductCard({ products, t }) {
    const [selectedId, setSelectedId] = useState(products[0]?.id || null);
    const [copied, setCopied] = useState(false);
    const product =
        products.find((item) => item.id === Number(selectedId)) || products[0];
    const form = useForm({
        google_review_url: product?.google_review_url || "",
    });

    useEffect(() => {
        form.setData("google_review_url", product?.google_review_url || "");
    }, [product?.id]);
    if (!product) return <EmptyProducts t={t} compact />;

    const copyCode = async () => {
        await navigator.clipboard.writeText(product.code_id);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    return (
        <section className="surface-card rounded-2xl bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="section-eyebrow">
                        {t("dashboard.quick_management")}
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold">
                        {t("dashboard.manage_destination")}
                    </h2>
                </div>
                {products.length > 1 && (
                    <select
                        value={selectedId}
                        onChange={(event) => setSelectedId(event.target.value)}
                        className="rounded-xl border-slate-200 bg-slate-50 py-2 pl-3 pr-9 text-sm font-semibold focus:border-[#F4B942] focus:ring-[#F4B942]"
                    >
                        <option value="" disabled>
                            {t("dashboard.select_product")}
                        </option>
                        {products.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.code_id}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-[11rem_minmax(0,1fr)]">
                <div className="relative h-44 overflow-hidden rounded-2xl bg-slate-200">
                    <img
                        src={product.image_url}
                        alt={product.variant}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B]/85 to-transparent" />
                    <span className="absolute bottom-3 left-3 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                        {product.variant}
                    </span>
                </div>
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.patch(route("products.update", product.id), {
                            preserveScroll: true,
                        });
                    }}
                >
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">
                            {t("dashboard.product_id")}
                        </p>
                        <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                            <code
                                className="min-w-0 flex-1 truncate font-bold text-[#0B132B]"
                                translate="no"
                            >
                                {product.code_id}
                            </code>
                            <button
                                type="button"
                                onClick={copyCode}
                                className="rounded-lg px-2 py-1 text-xs font-bold text-[#B7791F] hover:bg-amber-50"
                            >
                                {copied
                                    ? t("dashboard.copied")
                                    : t("dashboard.copy")}
                            </button>
                        </div>
                    </div>
                    <label className="block text-sm font-semibold text-slate-700">
                        {t("dashboard.review_url")}
                        <input
                            type="url"
                            className="mt-2 w-full rounded-xl border-slate-300 text-sm focus:border-[#F4B942] focus:ring-[#F4B942]"
                            value={form.data.google_review_url}
                            onChange={(event) =>
                                form.setData(
                                    "google_review_url",
                                    event.target.value,
                                )
                            }
                            placeholder="https://g.page/r/.../review"
                        />
                    </label>
                    {!form.data.google_review_url && (
                        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium leading-5 text-amber-800">
                            {t("dashboard.review_warning")}
                        </p>
                    )}
                    {form.errors.google_review_url && (
                        <p className="text-xs font-semibold text-red-600">
                            {form.errors.google_review_url}
                        </p>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                            disabled={form.processing}
                            className="gold-button flex-1 rounded-xl px-4 py-3 font-bold disabled:opacity-50"
                        >
                            {t("dashboard.save_destination")}
                        </button>
                        {form.data.google_review_url && (
                            <a
                                href={form.data.google_review_url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-[#0B132B] hover:border-[#F4B942]"
                            >
                                {t("dashboard.test_url")}
                            </a>
                        )}
                    </div>
                </form>
            </div>
        </section>
    );
}

function OnboardingCard({ onboarding, t }) {
    const items = [
        [t("dashboard.check_email"), onboarding.emailVerified],
        [t("dashboard.check_product"), onboarding.productActivated],
        [t("dashboard.check_review"), onboarding.reviewConfigured],
        [t("dashboard.check_scan"), onboarding.firstScanReceived],
    ];
    const complete = items.filter(([, done]) => done).length;
    return (
        <section className="surface-card rounded-2xl bg-white p-5 sm:p-6">
            <p className="section-eyebrow">{t("dashboard.get_started")}</p>
            <div className="mt-1 flex items-end justify-between gap-4">
                <h2 className="text-xl font-extrabold">
                    {t("dashboard.onboarding")}
                </h2>
                <span className="text-sm font-bold text-[#B7791F]">
                    {complete}/4
                </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <span
                    className="block h-full rounded-full bg-gradient-to-r from-[#F4B942] to-[#FFDC7A]"
                    style={{ width: `${complete * 25}%` }}
                />
            </div>
            <ul className="mt-5 space-y-3">
                {items.map(([label, done]) => (
                    <li
                        key={label}
                        className="flex items-center gap-3 text-sm font-semibold text-slate-700"
                    >
                        <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full ${done ? "bg-emerald-100 text-emerald-700" : "border border-slate-200 bg-slate-50 text-slate-400"}`}
                        >
                            {done ? "✓" : "○"}
                        </span>
                        {label}
                    </li>
                ))}
            </ul>
        </section>
    );
}

function ProductSummary({ product, t, featured }) {
    return (
        <article
            className={`surface-card overflow-hidden rounded-2xl bg-white ${featured ? "lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]" : ""}`}
        >
            <div
                className={`relative overflow-hidden bg-slate-200 ${featured ? "h-56 lg:h-full lg:min-h-64" : "h-48"}`}
            >
                <img
                    src={product.image_url}
                    alt={product.variant}
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B132B]/95 via-transparent to-transparent" />
                <div
                    className="absolute inset-x-4 bottom-4 text-white"
                    translate="no"
                >
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold backdrop-blur">
                        {product.variant}
                    </span>
                    <h3 className="mt-3 text-xl font-extrabold">
                        {product.code_id}
                    </h3>
                    <p className="text-sm text-white/70">
                        {t("common.batch")} {product.batch?.code}
                    </p>
                </div>
            </div>
            <div className="flex flex-col justify-center p-5">
                <div className="grid grid-cols-2 divide-x divide-slate-200 rounded-xl bg-slate-50 py-3 text-sm">
                    <span className="px-3">
                        <b className="text-lg">{product.scans_7d}</b>
                        <span className="ml-1 text-slate-500">
                            {t("dashboard.scans_short_7")}
                        </span>
                    </span>
                    <span className="px-3">
                        <b className="text-lg">{product.scans_30d}</b>
                        <span className="ml-1 text-slate-500">
                            {t("dashboard.scans_short_30")}
                        </span>
                    </span>
                </div>
                <p className="mt-4 truncate text-sm font-medium text-slate-600">
                    {product.google_review_url ||
                        t("dashboard.review_not_configured")}
                </p>
            </div>
        </article>
    );
}

function MetricCard({ label, value, detail, icon, featured, locale }) {
    return (
        <article
            className={`surface-card interactive-card relative overflow-hidden rounded-2xl bg-white p-5 ${featured ? "border-[#F4B942]/45" : ""}`}
        >
            {featured && (
                <span className="metallic-gold absolute inset-x-0 top-0 h-1" />
            )}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-slate-500">
                        {label}
                    </p>
                    <p className="mt-2 text-3xl font-black tracking-tight">
                        <AnimatedNumber value={value} locale={locale} />
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                        {detail}
                    </p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B132B] text-[#FFDC7A]">
                    <MetricIcon type={icon} />
                </span>
            </div>
        </article>
    );
}
function MetricIcon({ type }) {
    const paths = {
        pulse: "M3 12h4l2-6 4 12 2-6h6",
        today: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z",
        trend: "m4 15 5-5 4 4 7-8m-5 0h5v5",
        calendar:
            "M8 2v3m8-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z",
    };
    return (
        <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d={paths[type]}
            />
        </svg>
    );
}
function EmptyProducts({ t, compact = false }) {
    return (
        <div
            className={`col-span-full rounded-2xl border border-dashed border-slate-300 bg-white text-center ${compact ? "p-8" : "p-10"}`}
        >
            <p className="font-bold">{t("dashboard.no_products")}</p>
            <p className="mt-2 text-sm text-slate-500">
                {t("dashboard.no_products_help")}
            </p>
            <Link
                className="gold-button mt-5 inline-flex rounded-xl px-5 py-3 text-sm font-bold"
                href={route("home")}
            >
                {t("nav.activate")}
            </Link>
        </div>
    );
}
function formatChange(value, locale) {
    const number = Number(value);
    return `${number > 0 ? "+" : ""}${number.toLocaleString(locale, { maximumFractionDigits: 1 })}%`;
}

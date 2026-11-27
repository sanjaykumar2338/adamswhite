import ScanActivityChart from "@/Components/ScanActivityChart";
import AnimatedNumber from "@/Components/AnimatedNumber";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useTranslation } from "@/i18n";
import { dashboardWelcomeKey } from "@/lib/customerExperience";
import { validateGoogleReviewUrl } from "@/lib/reviewUrl";
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
                    <div className="mb-5 rounded-[10px] border border-emerald-200 bg-emerald-50 p-4 font-medium text-emerald-800">
                        {flash.success}
                    </div>
                )}

                {scanMilestone && <aside role="status" className="mb-5 flex flex-col gap-4 rounded-2xl border border-[#E6C87A]/35 bg-[#FBF7EC] p-4 text-[#0B1120] shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#0B1120] font-black text-[#E6C87A]">{scanMilestone.threshold}</span><div><p className="font-black">{t('dashboard.milestone_title', { count: scanMilestone.threshold })}</p><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{t('dashboard.milestone_body', { count: scanMilestone.threshold })}</p></div></div>
                    <button type="button" disabled={milestoneForm.processing} onClick={() => milestoneForm.patch(route('scan-milestone.dismiss'), { preserveScroll: true })} className="shrink-0 rounded-[10px] border border-[#0B1120]/15 bg-white px-4 py-2.5 text-sm font-black text-[#0B1120] hover:border-[#E6C87A] disabled:opacity-50">{t('dashboard.milestone_dismiss')}</button>
                </aside>}

                <section className="relative overflow-hidden rounded-2xl bg-[#0B1120] px-5 py-6 text-white shadow-xl shadow-[#0B1120]/15 sm:px-8 sm:py-8 lg:flex lg:items-end lg:justify-between lg:px-10">
                    <div className="relative z-10">
                        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#E6C87A]">
                            {t("dashboard.overview_label")}
                        </p>
                        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                            {t(dashboardWelcomeKey(customer.account_type), { name: firstName })}
                        </h1>
                        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                            <span className="capitalize">{customer.business_name}</span> ·{" "}
                            {t("dashboard.overview_help")}
                        </p>
                    </div>
                    <div className="relative z-10 mt-6 grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2 lg:mt-0">
                        <Link
                            className="gold-button flex min-h-[46px] min-w-44 items-center justify-center rounded-[10px] px-5 py-3 text-center text-sm font-semibold shadow-lg shadow-black/10"
                            href={route("home")}
                        >
                            {t("nav.activate")}
                        </Link>
                        <a
                            className="flex min-h-[46px] min-w-44 items-center justify-center rounded-[10px] border border-white/35 bg-transparent px-5 py-3 text-center text-sm font-semibold text-white hover:border-[#E6C87A] hover:text-[#E6C87A]"
                            href={route("statistics.export", { location: selectedLocation || undefined })}
                        >
                            {t("dashboard.export")}
                        </a>
                    </div>
                    <span className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-[#E6C87A]/20" />
                    <span className="pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full bg-[#E6C87A]/10 blur-2xl" />
                </section>

                <LocationFilter locations={locations} selectedLocation={selectedLocation} routeName="dashboard" t={t} />

                <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
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
                            <h2 className="mt-1 text-xl font-extrabold text-[#0B1120]">
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
                            className="text-sm font-bold text-[#8F6D1E] hover:text-[#0B1120]"
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
                            locale={locale}
                                featured={products.length === 1}
                            />
                        ))}
                        {!products.length && <EmptyProducts t={t} />}
                    </div>
                </section>

                <section
                    id="help"
                    className="mt-8 scroll-mt-24 rounded-2xl border border-[#E6C87A]/25 bg-[#FBF7EC] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6"
                >
                    <div>
                        <p className="font-bold text-[#0B1120]">
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
                        className="mt-4 inline-flex shrink-0 rounded-[10px] border border-[#E6C87A]/40 bg-white px-4 py-2.5 text-sm font-bold text-[#0B1120] shadow-sm transition hover:border-[#E6C87A] hover:bg-[#FBF7EC] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E6C87A] focus-visible:ring-offset-2 sm:mt-0"
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
        <Link href={route(routeName)} preserveScroll className={`rounded-lg px-3 py-2 text-sm font-bold ${!selectedLocation ? "bg-[#0B1120] text-white" : "text-slate-600 hover:bg-slate-100"}`}>{t("locations.all")}</Link>
        {locations.map((location) => <Link key={location.id} href={route(routeName, { location: location.id })} preserveScroll className={`rounded-lg px-3 py-2 text-sm font-bold ${selectedLocation === location.id ? "bg-[#0B1120] text-white" : "text-slate-600 hover:bg-slate-100"}`}>{location.name}</Link>)}
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
                        className="rounded-[10px] border-slate-200 bg-slate-50 py-2 pl-3 pr-9 text-sm font-semibold focus:border-[#E6C87A] focus:ring-[#E6C87A]"
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
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/85 to-transparent" />
                    <span className="absolute bottom-3 left-3 rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
                        {product.variant}
                    </span>
                </div>
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!validateGoogleReviewUrl(form, t("validation.google_review_url"))) return;
                        form.patch(route("products.update", product.id), {
                            preserveScroll: true,
                        });
                    }}
                >
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">
                            {t("dashboard.product_id")}
                        </p>
                        <div className="mt-2 flex items-center gap-2 rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                            <code
                                className="notranslate product-code min-w-0 flex-1 truncate font-bold text-[#0B1120]"
                                translate="no"
                            >
                                {product.code_id}
                            </code>
                            <button
                                type="button"
                                onClick={copyCode}
                                className="rounded-lg px-2 py-1 text-xs font-bold text-[#8F6D1E] hover:bg-[#FBF7EC]"
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
                            className="mt-2 w-full rounded-[10px] border-slate-300 text-sm focus:border-[#E6C87A] focus:ring-[#E6C87A]"
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
                        <p className="rounded-[10px] bg-[#FBF7EC] px-3 py-2 text-xs font-medium leading-5 text-[#8F6D1E]">
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
                            className="gold-button flex-1 rounded-[10px] px-4 py-3 font-bold disabled:opacity-50"
                        >
                            {t("dashboard.save_destination")}
                        </button>
                        {form.data.google_review_url && (
                            <a
                                href={form.data.google_review_url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-[10px] border border-slate-200 px-4 py-3 text-center text-sm font-bold text-[#0B1120] hover:border-[#E6C87A]"
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
    if (complete === 4) return <details className="surface-card group rounded-2xl bg-white p-5 sm:p-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-4"><span className="flex items-center gap-3 font-semibold text-[#0B1120]"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>{t('dashboard.setup_complete')}</span><span className="text-sm text-[#8F6D1E] group-open:rotate-180" aria-hidden="true">⌄</span></summary><ul className="mt-5 space-y-3 border-t border-slate-100 pt-4">{items.map(([label]) => <li key={label} className="flex items-center gap-3 text-sm font-medium text-slate-600"><span className="text-emerald-600">✓</span>{label}</li>)}</ul></details>;

    return (
        <section className="surface-card rounded-2xl bg-white p-5 sm:p-6">
            <p className="section-eyebrow">{t("dashboard.get_started")}</p>
            <div className="mt-1 flex items-end justify-between gap-4">
                <h2 className="text-xl font-extrabold">
                    {t("dashboard.onboarding")}
                </h2>
                <span className="text-sm font-bold text-[#8F6D1E]">
                    {complete}/4
                </span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <span
                    className="block h-full rounded-full bg-gradient-to-r from-[#E6C87A] to-[#E6C87A]"
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

function ProductSummary({ product, t, locale, featured }) {
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120]/95 via-transparent to-transparent" />
                <div
                    className="notranslate absolute inset-x-4 bottom-4 text-white"
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
                <div className="grid grid-cols-2 divide-x divide-slate-200 rounded-[10px] bg-slate-50 py-3 text-sm">
                    <span className="px-3">
                        <b className="tabular-nums text-lg">{Number(product.scans_7d).toLocaleString(locale)}</b>
                        <span className="ml-1 text-slate-500">{t(Number(product.scans_7d) === 1 ? "dashboard.scan_short_7_one" : "dashboard.scan_short_7_other")}</span>
                    </span>
                    <span className="px-3">
                        <b className="tabular-nums text-lg">{Number(product.scans_30d).toLocaleString(locale)}</b>
                        <span className="ml-1 text-slate-500">{t(Number(product.scans_30d) === 1 ? "dashboard.scan_short_30_one" : "dashboard.scan_short_30_other")}</span>
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

function MetricCard({ label, value, detail, icon, locale }) {
    return (
        <article
            className="interactive-card relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-4 sm:p-5"
        >
            <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-4">
                <div>
                    <p className="text-xs font-medium text-slate-500 sm:text-sm">
                        {label}
                    </p>
                    <p className="tabular-nums mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                        <AnimatedNumber value={value} locale={locale} />
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                        {detail}
                    </p>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#0B1120] text-[#E6C87A] sm:h-11 sm:w-11">
                    <MetricIcon type={icon} />
                </span>
            </div>
        </article>
    );
}
function MetricIcon({ type }) {
    const paths = {
        pulse: "M3 12h4l2-6 4 12 2-6h6",
        today: "M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
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
                className="gold-button mt-5 inline-flex rounded-[10px] px-5 py-3 text-sm font-bold"
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

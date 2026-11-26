import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { useTranslation } from "@/i18n";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { createProductQrDownload } from "@/lib/productQr";
import { useState } from "react";

export default function ProductsIndex({ products, filters, counts, locations }) {
    const { t } = useTranslation();
    const [search, setSearch] = useState(filters.search);

    const filter = (variant = filters.variant, location = filters.location) =>
        router.get(
            route("products.index"),
            { search, variant, location },
            { preserveState: true, replace: true },
        );

    return (
        <AuthenticatedLayout
            header={
                <>
                    <p
                        className="notranslate text-xs font-bold tracking-[.12em] text-[#8F6D1E]"
                        translate="no"
                    >
                        SHIFTRIX TRACK
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-500">
                        {t("products.workspace")}
                    </p>
                </>
            }
        >
            <Head title={t("products.title")} />
            <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 lg:px-8 xl:px-10">
                <section className="overflow-hidden rounded-2xl premium-hero px-6 py-7 text-white shadow-xl shadow-[#0B1120]/10 sm:px-8 lg:flex lg:items-end lg:justify-between lg:gap-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[.22em] text-[#E6C87A]">
                            {t("products.eyebrow")}
                        </p>
                        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                            {t("products.title")}
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                            {t("products.intro")}
                        </p>
                    </div>
                    <div className="mt-5 rounded-2xl border border-white/10 bg-white/[.07] px-5 py-4 lg:mt-0">
                        <span className="text-3xl font-black text-[#E6C87A]">
                            {counts.all}
                        </span>
                        <span className="ml-2 text-sm font-semibold text-slate-200">
                            {t("products.owned")}
                        </span>
                    </div>
                </section>

                <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            filter();
                        }}
                        className="flex flex-col gap-3 md:flex-row"
                    >
                        <label className="relative flex-1">
                            <span className="sr-only">
                                {t("products.search")}
                            </span>
                            <SearchIcon />
                            <input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="w-full rounded-[10px] border-slate-200 py-3 pl-11 pr-4 text-sm focus:border-[#E6C87A] focus:ring-[#E6C87A]"
                                placeholder={t("products.search_placeholder")}
                            />
                        </label>
                        <button className="rounded-[10px] bg-[#0B1120] px-5 py-3 text-sm font-bold text-white hover:bg-[#142044]">
                            {t("products.search")}
                        </button>
                        <label className="min-w-56">
                            <span className="sr-only">{t("locations.filter")}</span>
                            <select
                                value={filters.location || ""}
                                onChange={(event) => filter(filters.variant, event.target.value)}
                                className="w-full rounded-[10px] border-slate-200 py-3 text-sm font-bold focus:border-[#E6C87A] focus:ring-[#E6C87A]"
                            >
                                <option value="">{t("locations.all")}</option>
                                {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                            </select>
                        </label>
                        {(filters.search || filters.variant || filters.location) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    router.get(route("products.index"));
                                }}
                                className="rounded-[10px] border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600"
                            >
                                {t("common.clear")}
                            </button>
                        )}
                    </form>
                    <div className="scrollbar-hidden mt-4 flex gap-2 overflow-x-auto pb-1">
                        {[
                            ["", "all"],
                            ["CARD", "CARD"],
                            ["PLATE", "PLATE"],
                            ["STAND", "STAND"],
                        ].map(([value, label]) => (
                            <button
                                key={label}
                                type="button"
                                onClick={() => filter(value)}
                                className={`whitespace-nowrap rounded-[10px] px-4 py-2 text-sm font-bold ${filters.variant === value ? "bg-[#E6C87A] text-[#0B1120]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                                {label === "all" ? t("products.all") : t(`products.variant_${label.toLowerCase()}`)}{" "}
                                <span className="ml-1 opacity-70">
                                    {counts[label]}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                <LocationManager locations={locations} t={t} />

                {products.data.length ? (
                    <div className="mt-6 grid gap-5 xl:grid-cols-2">
                        {products.data.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                locations={locations}
                                t={t}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState t={t} />
                )}
                <Pagination links={products.links} />
            </div>
        </AuthenticatedLayout>
    );
}

function ProductCard({ product, locations, t }) {
    const form = useForm({
        display_name: product.display_name || "",
        location_id: product.location_id || "",
        google_review_url: product.google_review_url || "",
    });
    const [copied, setCopied] = useState("");
    const [qrBusy, setQrBusy] = useState(false);
    const hasValidatedReviewLink = Boolean(product.google_review_url) && form.data.google_review_url === product.google_review_url;
    const copy = async (value, field) => {
        await navigator.clipboard.writeText(value);
        setCopied(field);
        window.setTimeout(() => setCopied(""), 1800);
    };
    const downloadQr = async () => {
        setQrBusy(true);
        try {
            const download = await createProductQrDownload(
                product.code_id,
                product.nfc_url,
            );
            const link = document.createElement("a");
            link.href = download.dataUrl;
            link.download = download.filename;
            link.click();
        } finally {
            setQrBusy(false);
        }
    };

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-4 border-b border-slate-100 bg-gradient-to-r from-[#0B1120] to-[#152346] p-5 text-white sm:p-6">
                <img
                    src={product.image_url}
                    alt=""
                    className="h-16 w-16 rounded-2xl bg-white object-cover ring-1 ring-white/15"
                />
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className="notranslate inline-flex rounded-full bg-[#E6C87A] px-2.5 py-1 text-[.68rem] font-bold tracking-wider text-[#0B1120]"
                            translate="no"
                        >
                            {product.variant}
                        </span>
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[.68rem] font-bold ${product.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}
                        >
                            <span
                                className={`h-1.5 w-1.5 rounded-full bg-current ${product.status === "active" ? "active-pulse" : ""}`}
                            />
                            {t(`common.status_${product.status}`)}
                        </span>
                    </div>
                    <h2 className="mt-2 truncate text-xl font-black">
                        {product.display_name || product.code_id}
                    </h2>
                    <p
                        className="notranslate product-code mt-0.5 text-xs text-slate-300"
                        translate="no"
                    >
                        {t("products.product_id")}: {product.code_id}
                    </p>
                </div>
            </div>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.patch(route("products.update", product.id), {
                        preserveScroll: true,
                    });
                }}
                className="space-y-5 p-5 sm:p-6"
            >
                <Field
                    label={t("locations.location")}
                    hint={t("locations.assignment_hint")}
                    error={form.errors.location_id}
                >
                    <select
                        value={form.data.location_id}
                        onChange={(event) => form.setData("location_id", event.target.value)}
                        className="mt-2 w-full rounded-[10px] border-slate-200 focus:border-[#E6C87A] focus:ring-[#E6C87A]"
                    >
                        <option value="">{t("locations.unassigned")}</option>
                        {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                    </select>
                </Field>
                <Field
                    label={t("products.name_label")}
                    hint={t("products.name_hint")}
                    error={form.errors.display_name}
                >
                    <input
                        value={form.data.display_name}
                        onChange={(event) =>
                            form.setData("display_name", event.target.value)
                        }
                        maxLength="120"
                        className="mt-2 w-full rounded-[10px] border-slate-200 focus:border-[#E6C87A] focus:ring-[#E6C87A]"
                        placeholder={t("products.name_placeholder")}
                    />
                </Field>
                <Field
                    label={t("products.review_url")}
                    hint={t("products.review_hint")}
                    error={form.errors.google_review_url}
                >
                    <input
                        type="url"
                        required
                        value={form.data.google_review_url}
                        onChange={(event) =>
                            form.setData(
                                "google_review_url",
                                event.target.value,
                            )
                        }
                        className="mt-2 w-full rounded-[10px] border-slate-200 focus:border-[#E6C87A] focus:ring-[#E6C87A]"
                        placeholder="https://g.page/r/.../review"
                    />
                    {hasValidatedReviewLink && <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">✓ {t("products.valid_link")}</span>}
                </Field>
                <div>
                    <p className="text-sm font-bold text-[#0B1120]">
                        {t("products.nfc_url")}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                        {t("products.nfc_hint")}
                    </p>
                    <div className="mt-2 flex min-w-0 gap-2">
                        <div className="min-w-0 flex-1 truncate rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600" title={product.nfc_url}>{product.nfc_url}</div>
                        <button
                            type="button"
                            onClick={() => copy(product.nfc_url, "nfc")}
                            className="rounded-[10px] border border-[#EAD9A8] bg-[#FBF7EC] px-4 text-sm font-semibold text-[#8F6D1E]"
                        >
                            {copied === "nfc"
                                ? t("products.copied")
                                : t("products.copy")}
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <button
                        type="button"
                        disabled={qrBusy}
                        onClick={downloadQr}
                        className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-slate-200 px-4 py-3 text-sm font-bold text-[#0B1120] hover:bg-slate-50 disabled:opacity-60"
                    >
                        <QrIcon />
                        {qrBusy
                            ? t("products.generating")
                            : t("products.download_qr")}
                    </button>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={() =>
                                router.patch(
                                    route("products.status", product.id),
                                    {
                                        status:
                                            product.status === "active"
                                                ? "paused"
                                                : "active",
                                    },
                                    { preserveScroll: true },
                                )
                            }
                            className={`rounded-[10px] border px-5 py-3 text-sm font-semibold ${product.status === "active" ? "border-[#CBD5E1] bg-[#334155] text-white hover:bg-slate-700" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"}`}
                        >
                            {product.status === "active"
                                ? t("products.pause")
                                : t("products.reactivate")}
                        </button>
                        <button
                            disabled={form.processing}
                            className="rounded-[10px] bg-[#0B1120] px-6 py-3 text-sm font-bold text-white hover:bg-[#142044] disabled:opacity-60"
                        >
                            {form.processing
                                ? t("products.saving")
                                : t("products.save")}
                        </button>
                    </div>
                </div>
                {form.recentlySuccessful && (
                    <p
                        role="status"
                        className="text-right text-sm font-bold text-emerald-600"
                    >
                        {t("products.saved")}
                    </p>
                )}
            </form>
        </article>
    );
}

function LocationManager({ locations, t }) {
    const create = useForm({ name: "" });
    return <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <h2 className="text-lg font-black text-[#0B1120]">{t("locations.manage")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t("locations.manage_help")}</p>
            </div>
            <form className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row" onSubmit={(event) => {
                event.preventDefault();
                create.post(route("locations.store"), { preserveScroll: true, onSuccess: () => create.reset() });
            }}>
                <input required maxLength="120" value={create.data.name} onChange={(event) => create.setData("name", event.target.value)} placeholder={t("locations.name_placeholder")} className="min-h-[46px] w-full min-w-0 rounded-[10px] border-slate-200 text-sm focus:border-[#E6C87A] focus:ring-[#E6C87A] sm:w-auto" />
                <button disabled={create.processing} className="gold-button min-h-[46px] w-full whitespace-nowrap rounded-[10px] px-4 py-2.5 text-sm font-semibold sm:w-auto">{t("locations.add")}</button>
            </form>
        </div>
        {create.errors.name && <p className="mt-2 text-sm font-semibold text-red-600">{create.errors.name}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
            {locations.map((location) => <span key={location.id} className="inline-flex items-center gap-2 rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                {location.name} <span className="text-xs text-slate-400">{location.products_count}</span>
                <button type="button" onClick={() => router.delete(route("locations.destroy", location.id), { preserveScroll: true })} className="text-slate-400 hover:text-red-600" aria-label={`${t("locations.remove")} ${location.name}`}>×</button>
            </span>)}
            {!locations.length && <p className="text-sm text-slate-500">{t("locations.none")}</p>}
        </div>
    </section>;
}

function Pagination({ links }) {
    if (!links || links.length <= 3) return null;
    return <nav className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Pagination">
        {links.map((link, index) => link.url ? <Link key={index} href={link.url} preserveScroll preserveState className={`rounded-lg border px-3 py-2 text-sm font-bold ${link.active ? "border-[#E6C87A] bg-[#FBF7EC] text-[#8F6D1E]" : "border-slate-200 bg-white text-slate-600"}`} dangerouslySetInnerHTML={{ __html: link.label }} /> : <span key={index} className="rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-300" dangerouslySetInnerHTML={{ __html: link.label }} />)}
    </nav>;
}

function Field({ label, hint, error, children }) {
    return (
        <label className="block">
            <span className="text-sm font-bold text-[#0B1120]">{label}</span>
            {children}
            <span className="mt-1.5 block text-xs leading-5 text-slate-400">{hint}</span>
            {error && (
                <span className="mt-1 block text-xs font-semibold text-red-600">
                    {error}
                </span>
            )}
        </label>
    );
}
function EmptyState({ t }) {
    return (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-black text-[#0B1120]">
                {t("products.empty")}
            </p>
            <p className="mt-2 text-sm text-slate-500">
                {t("products.empty_help")}
            </p>
        </div>
    );
}
function SearchIcon() {
    return (
        <svg
            className="absolute left-4 top-3.5 h-5 w-5 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
        </svg>
    );
}
function QrIcon() {
    return (
        <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path
                strokeWidth="1.7"
                d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v6h-6v-2"
            />
        </svg>
    );
}

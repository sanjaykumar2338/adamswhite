import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Products({ products, filters, batches, totalProducts, inventorySummary }) {
    const { locale, t } = useTranslation();
    const [values, setValues] = useState({
        search: filters.search || '',
        variant: filters.variant || '',
        batch: filters.batch || '',
        status: filters.status || '',
        unit_type: filters.unit_type || '',
    });

    const applyFilters = (nextValues) => {
        router.get(route('admin.products.index'), nextValues, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (values.search !== (filters.search || '')) applyFilters(values);
        }, 350);

        return () => clearTimeout(timer);
    }, [values.search]);

    const updateFilter = (key, value) => {
        const nextValues = { ...values, [key]: value };
        setValues(nextValues);
        if (key !== 'search') applyFilters(nextValues);
    };

    const clearFilters = () => {
        const empty = { search: '', variant: '', batch: '', status: '', unit_type: '' };
        setValues(empty);
        applyFilters(empty);
    };

    const summaryCards = [
        [t('admin.total_inventory'), inventorySummary.total, 'bg-[#0B132B] text-white'],
        [t('admin.claimed'), inventorySummary.claimed, 'surface-card bg-white text-[#0B132B]'],
        [t('admin.available'), inventorySummary.available, 'surface-card bg-white text-[#0B132B]'],
        [t('admin.backup'), inventorySummary.backup, 'surface-card bg-white text-[#0B132B]'],
        [t('admin.disabled'), inventorySummary.disabled, 'surface-card bg-white text-[#0B132B]'],
    ];

    return <AuthenticatedLayout header={<div><p className="text-sm font-bold uppercase tracking-[.16em] text-[#B8773C]">{t('admin.management')}</p><h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0B132B]">{t('admin.inventory')}</h1></div>}>
        <Head title={t('admin.inventory')} />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{summaryCards.map(([label, value, classes], index) => <div key={label} className={`rounded-2xl p-4 transition hover:-translate-y-0.5 sm:p-5 ${classes}`}><p className="text-xs font-bold uppercase tracking-wider opacity-60">{label}</p><p className={`mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl ${index === 0 ? 'text-[#F1C156]' : ''}`}>{Number(value).toLocaleString(locale)}</p></div>)}</div>

            <div className="surface-card mb-5 mt-5 rounded-2xl bg-white p-5 sm:p-6">
                <div className="mb-4"><h2 className="text-lg font-extrabold text-[#0B132B]">{t('admin.inventory_filters')}</h2><p className="mt-1 text-sm text-slate-500">{t('admin.inventory_filters_help')}</p></div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <label className="lg:col-span-2"><span className="mb-1.5 block text-sm font-semibold text-slate-600">{t('admin.search_code')}</span>
                        <input className="w-full rounded-xl border-slate-300 text-sm focus:border-[#E1A339] focus:ring-[#E1A339]" type="search" placeholder={t('admin.search_code')} value={values.search} onChange={(event) => setValues({ ...values, search: event.target.value })} />
                    </label>
                    <FilterSelect label={t('common.variant')} value={values.variant} onChange={(value) => updateFilter('variant', value)}>
                        <option value="">{t('admin.all_variants')}</option>
                        {['CARD', 'PLATE', 'STAND'].map((variant) => <option key={variant} value={variant}>{variant}</option>)}
                    </FilterSelect>
                    <FilterSelect label={t('common.batch')} value={values.batch} onChange={(value) => updateFilter('batch', value)}>
                        <option value="">{t('admin.all_batches')}</option>
                        {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.code}</option>)}
                    </FilterSelect>
                    <FilterSelect label={t('common.status')} value={values.status} onChange={(value) => updateFilter('status', value)}>
                        <option value="">{t('admin.all_statuses')}</option>
                        {['unclaimed', 'active', 'disabled'].map((status) => <option key={status} value={status}>{t(`common.status_${status}`)}</option>)}
                    </FilterSelect>
                    <FilterSelect label={t('admin.inventory_type')} value={values.unit_type} onChange={(value) => updateFilter('unit_type', value)}>
                        <option value="">{t('admin.all_inventory')}</option>
                        <option value="commercial">{t('admin.commercial')}</option>
                        <option value="backup">{t('admin.backup')}</option>
                    </FilterSelect>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <p className="text-sm font-medium text-slate-600">{t('admin.product_counts', { filtered: products.total.toLocaleString(locale), total: totalProducts.toLocaleString(locale) })}</p>
                    <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:border-[#E1A339] hover:bg-amber-50" type="button" onClick={clearFilters}>{t('admin.clear_filters')}</button>
                </div>
            </div>

            <p className="mb-2 text-sm font-medium text-slate-500 sm:hidden">{t('common.table_scroll_hint')}</p>
            <div className="table-scroll surface-card overflow-x-auto rounded-2xl bg-white" tabIndex="0" aria-label={t('admin.inventory')}>
                <table className="min-w-[900px] w-full text-left text-sm">
                    <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500"><tr>{[t('common.code'), t('common.variant'), t('common.batch'), t('admin.inventory_type'), t('common.status'), t('common.customer'), t('common.action')].map((label) => <th className="px-5 py-3.5" key={label}>{label}</th>)}</tr></thead>
                    <tbody>
                        {products.data.map((product) => <tr className="border-t border-slate-100 hover:bg-slate-50/60" key={product.id}>
                            <td className="px-5 py-4"><span className="rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs font-bold text-[#0B132B]">{product.code_id}</span></td><td className="px-5 py-4"><VariantBadge variant={product.variant} /></td><td className="px-5 py-4 font-semibold text-slate-700">{product.batch?.code}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${product.unit_type === 'backup' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>{t(`admin.${product.unit_type}`)}</span></td><td className="px-5 py-4"><StatusBadge status={product.status} t={t} /></td><td className="px-5 py-4"><span className={product.customer ? 'font-semibold text-[#0B132B]' : 'text-slate-400'}>{product.customer?.business_name || t('admin.unassigned')}</span></td><td className="px-5 py-4">{product.customer_id ? <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50" onClick={() => window.confirm(t('admin.reset_confirm')) && router.post(route('admin.products.reset', product.id), {}, { preserveScroll: true })}>{t('common.reset')}</button> : <span className="text-slate-300">—</span>}</td>
                        </tr>)}
                        {products.data.length === 0 && <tr><td className="p-8 text-center text-slate-500" colSpan="7">{t('admin.no_products')}</td></tr>}
                    </tbody>
                </table>
            </div>

            {products.last_page > 1 && <nav className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label={t('admin.pagination')}>
                <PaginationLink href={products.prev_page_url} label={t('admin.previous')} disabled={!products.prev_page_url} />
                {products.links.slice(1, -1).map((link) => <PaginationLink key={link.label} href={link.url} label={link.label} active={link.active} disabled={!link.url} />)}
                <PaginationLink href={products.next_page_url} label={t('admin.next')} disabled={!products.next_page_url} />
            </nav>}
        </div>
    </AuthenticatedLayout>;
}

function FilterSelect({ label, value, onChange, children }) {
    return <label><span className="mb-1.5 block text-sm font-semibold text-slate-600">{label}</span><select className="w-full rounded-xl border-slate-300 text-sm focus:border-[#E1A339] focus:ring-[#E1A339]" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>;
}

function PaginationLink({ href, label, active = false, disabled = false }) {
    const classes = `min-w-10 rounded-lg border px-3 py-2 text-center text-sm font-semibold ${active ? 'border-[#0B132B] bg-[#0B132B] text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'} ${disabled ? 'pointer-events-none opacity-40' : ''}`;
    return href ? <Link className={classes} href={href} preserveScroll>{label}</Link> : <span className={classes}>{label}</span>;
}

function VariantBadge({ variant }) { const classes = { CARD: 'bg-amber-50 text-amber-800', PLATE: 'bg-slate-100 text-slate-700', STAND: 'bg-[#0B132B] text-white' }; return <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${classes[variant] || 'bg-slate-100 text-slate-700'}`}>{variant}</span>; }
function StatusBadge({ status, t }) { const classes = { active: 'bg-emerald-50 text-emerald-700', unclaimed: 'bg-amber-50 text-amber-800', disabled: 'bg-red-50 text-red-700' }; return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${classes[status]}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />{t(`common.status_${status}`)}</span>; }

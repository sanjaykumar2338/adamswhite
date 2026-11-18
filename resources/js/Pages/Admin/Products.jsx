import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Products({ products, filters, batches, totalProducts }) {
    const { t } = useTranslation();
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

    return <AuthenticatedLayout header={<h1 className="text-xl font-bold">{t('admin.inventory')}</h1>}>
        <Head title={t('admin.inventory')} />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <div className="surface-card mb-5 rounded-xl bg-white p-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <label className="lg:col-span-2">
                        <span className="sr-only">{t('admin.search_code')}</span>
                        <input className="w-full rounded-lg border-slate-300 text-sm focus:border-[#0B132B] focus:ring-[#0B132B]" type="search" placeholder={t('admin.search_code')} value={values.search} onChange={(event) => setValues({ ...values, search: event.target.value })} />
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
                    <p className="text-sm text-slate-600">{t('admin.product_counts', { filtered: products.total, total: totalProducts })}</p>
                    <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" type="button" onClick={clearFilters}>{t('admin.clear_filters')}</button>
                </div>
            </div>

            <div className="surface-card overflow-x-auto rounded-xl bg-white">
                <table className="min-w-[900px] w-full text-left text-sm">
                    <thead className="bg-slate-50"><tr>{[t('common.code'), t('common.variant'), t('common.batch'), t('admin.inventory_type'), t('common.status'), t('common.customer'), t('common.action')].map((label) => <th className="p-4" key={label}>{label}</th>)}</tr></thead>
                    <tbody>
                        {products.data.map((product) => <tr className="border-t" key={product.id}>
                            <td className="p-4 font-mono">{product.code_id}</td><td className="p-4">{product.variant}</td><td className="p-4">{product.batch?.code}</td><td className="p-4">{t(`admin.${product.unit_type}`)}</td><td className="p-4">{t(`common.status_${product.status}`)}</td><td className="p-4">{product.customer?.business_name || '—'}</td><td className="p-4">{product.customer_id && <button className="text-red-700 underline" onClick={() => confirm(t('admin.reset_confirm')) && router.post(route('admin.products.reset', product.id))}>{t('common.reset')}</button>}</td>
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
    return <label><span className="sr-only">{label}</span><select className="w-full rounded-lg border-slate-300 text-sm focus:border-[#0B132B] focus:ring-[#0B132B]" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>;
}

function PaginationLink({ href, label, active = false, disabled = false }) {
    const classes = `min-w-10 rounded-lg border px-3 py-2 text-center text-sm font-semibold ${active ? 'border-[#0B132B] bg-[#0B132B] text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'} ${disabled ? 'pointer-events-none opacity-40' : ''}`;
    return href ? <Link className={classes} href={href} preserveScroll>{label}</Link> : <span className={classes}>{label}</span>;
}

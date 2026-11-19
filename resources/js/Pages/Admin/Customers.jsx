import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Customers({ customers, filters, summary }) {
    const { locale, t } = useTranslation();
    const flash = usePage().props.flash;
    const [search, setSearch] = useState(filters.search || '');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) router.get(route('admin.customers.index'), { search }, { preserveState: true, preserveScroll: true, replace: true });
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    const summaryCards = [
        [t('admin.total_customers'), summary.total],
        [t('admin.active_customers'), summary.active],
        [t('admin.blocked_customers'), summary.blocked],
        [t('admin.products_assigned'), summary.products],
    ];

    return <AuthenticatedLayout header={<div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#B8773C]">{t('admin.management')}</p><h1 className="mt-1 text-2xl font-extrabold text-[#0B132B]">{t('admin.customers')}</h1></div>}>
        <Head title={t('admin.customers')} />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {flash.success && <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">{flash.success}</div>}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{summaryCards.map(([label, value], index) => <div key={label} className={`rounded-2xl p-5 ${index === 0 ? 'bg-[#0B132B] text-white' : 'surface-card bg-white text-[#0B132B]'}`}><p className="text-xs font-bold uppercase tracking-wider opacity-60">{label}</p><p className={`mt-2 text-3xl font-extrabold ${index === 0 ? 'text-[#F1C156]' : ''}`}>{Number(value).toLocaleString(locale)}</p></div>)}</div>

            <section className="surface-card mt-5 overflow-hidden rounded-2xl bg-white">
                <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div><h2 className="text-lg font-extrabold text-[#0B132B]">{t('admin.customer_directory')}</h2><p className="mt-1 text-sm text-slate-500">{t('admin.customer_counts', { filtered: customers.total, total: summary.total })}</p></div>
                    <div className="flex w-full gap-2 sm:max-w-md"><label className="relative flex-1"><span className="sr-only">{t('admin.customer_search')}</span><svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth="2" d="m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" /></svg><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-xl border-slate-300 py-2.5 pl-10 text-sm focus:border-[#E1A339] focus:ring-[#E1A339]" placeholder={t('admin.customer_search')} /></label>{search && <button type="button" onClick={() => setSearch('')} className="rounded-xl border border-slate-300 px-3 text-sm font-semibold text-slate-600">{t('common.clear')}</button>}</div>
                </div>
                <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-6 py-3.5">{t('admin.business')}</th><th className="px-4 py-3.5">{t('common.status')}</th><th className="px-4 py-3.5">{t('admin.members')}</th><th className="px-4 py-3.5">{t('admin.product_usage')}</th><th className="px-4 py-3.5">{t('admin.limit')}</th><th className="px-6 py-3.5 text-right">{t('common.action')}</th></tr></thead><tbody>{customers.data.map((customer) => <CustomerRow customer={customer} key={customer.id} t={t} />)}{customers.data.length === 0 && <tr><td colSpan="6" className="px-6 py-14 text-center text-slate-500">{t('admin.no_customers')}</td></tr>}</tbody></table></div>
                <Pagination paginator={customers} t={t} />
            </section>
        </div>
    </AuthenticatedLayout>;
}

function CustomerRow({ customer, t }) {
    const [limit, setLimit] = useState(customer.max_products);
    const usage = customer.max_products ? Math.min(100, Math.round((customer.products_count / customer.max_products) * 100)) : 0;
    const toggleStatus = () => {
        const nextStatus = customer.status === 'active' ? 'blocked' : 'active';
        if (window.confirm(t(`admin.confirm_${nextStatus}`))) router.patch(route('admin.customers.update', customer.id), { status: nextStatus, max_products: customer.max_products }, { preserveScroll: true });
    };
    const saveLimit = () => router.patch(route('admin.customers.update', customer.id), { status: customer.status, max_products: limit }, { preserveScroll: true });

    return <tr className="border-t border-slate-100 hover:bg-slate-50/60"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B132B] font-extrabold text-[#F1C156]">{customer.business_name.charAt(0).toUpperCase()}</div><div><p className="font-bold text-[#0B132B]">{customer.business_name}</p><p className="mt-0.5 text-xs text-slate-500">#{customer.id}</p></div></div></td><td className="px-4 py-4"><StatusBadge status={customer.status} t={t} /></td><td className="px-4 py-4"><span className="font-bold text-[#0B132B]">{customer.users_count}</span></td><td className="px-4 py-4"><div className="flex items-center gap-3"><div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#E1A339]" style={{ width: `${usage}%` }} /></div><span className="text-xs font-semibold text-slate-600">{customer.products_count}/{customer.max_products}</span></div></td><td className="px-4 py-4"><div className="flex items-center gap-2"><input aria-label={t('admin.limit')} type="number" min="1" max="10000" className="w-24 rounded-lg border-slate-300 py-1.5 text-sm focus:border-[#E1A339] focus:ring-[#E1A339]" value={limit} onChange={(event) => setLimit(event.target.value)} /><button disabled={Number(limit) === Number(customer.max_products)} type="button" onClick={saveLimit} className="rounded-lg bg-[#0B132B] px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-30">{t('common.save')}</button></div></td><td className="px-6 py-4 text-right"><button type="button" onClick={toggleStatus} className={`rounded-lg px-3 py-2 text-xs font-bold ${customer.status === 'active' ? 'border border-red-200 text-red-700 hover:bg-red-50' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>{customer.status === 'active' ? t('admin.block') : t('admin.unblock')}</button></td></tr>;
}

function StatusBadge({ status, t }) { return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}><span className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />{t(`common.status_${status}`)}</span>; }
function Pagination({ paginator, t }) { if (paginator.last_page <= 1) return null; return <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4" aria-label={t('admin.pagination')}><p className="text-xs text-slate-500">{paginator.from}–{paginator.to} / {paginator.total}</p><div className="flex flex-wrap gap-1.5">{paginator.links.map((link, index) => { const label = index === 0 ? t('admin.previous') : index === paginator.links.length - 1 ? t('admin.next') : link.label.replace('&laquo;', '').replace('&raquo;', ''); const classes = `min-w-9 rounded-lg border px-2.5 py-1.5 text-center text-xs font-bold ${link.active ? 'border-[#0B132B] bg-[#0B132B] text-white' : 'border-slate-200 bg-white text-slate-600'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`; return link.url ? <Link key={`${link.label}-${index}`} className={classes} href={link.url} preserveScroll>{label}</Link> : <span key={`${link.label}-${index}`} className={classes}>{label}</span>; })}</div></nav>; }

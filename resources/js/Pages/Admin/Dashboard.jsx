import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from '@/i18n';
import { Head, Link } from '@inertiajs/react';

export default function AdminDashboard({ metrics }) {
    const { t } = useTranslation();
    const labels = {
        customers: t('admin.customers'),
        users: t('admin.users'),
        claimed: t('admin.claimed'),
        available: t('admin.available'),
        scans30d: t('admin.scans30d'),
    };

    return <AuthenticatedLayout header={<h1 className="text-xl font-bold text-[#0B132B]">{t('admin.title')}</h1>}>
        <Head title={t('admin.page_title')} />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {Object.entries(metrics).map(([key, value]) => <div className="surface-card relative overflow-hidden rounded-2xl bg-white p-5" key={key}>
                    <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#F1C156] via-[#E1A339] to-[#B8773C]" />
                    <p className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{labels[key]}</p>
                    <p className="mt-3 text-3xl font-extrabold text-[#0B132B]">{value}</p>
                </div>)}
            </div>
            <div className="surface-card mt-8 flex flex-wrap gap-3 rounded-2xl bg-white p-5">
                <Link className="rounded-lg bg-[#0B132B] px-5 py-3 font-semibold text-white hover:bg-[#17284f]" href={route('admin.customers.index')}>{t('admin.customers')}</Link>
                <Link className="rounded-lg bg-[#0B132B] px-5 py-3 font-semibold text-white hover:bg-[#17284f]" href={route('admin.products.index')}>{t('admin.inventory')}</Link>
                <Link className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-[#0B132B] hover:bg-slate-50" href={route('admin.settings.edit')}>{t('common.settings')}</Link>
            </div>
        </div>
    </AuthenticatedLayout>;
}

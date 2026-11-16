import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function Dashboard({ customer, products, summary, series }) {
    const flash = usePage().props.flash;
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    {customer.business_name}
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-10">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {flash.success && <div className="mb-5 rounded-xl bg-emerald-50 p-4 text-emerald-800">{flash.success}</div>}
                    <div className="grid gap-4 md:grid-cols-3">
                        {[['Active products', summary.products], ['Scans · 7 days', summary.scans7d], ['Scans · 30 days', summary.scans30d]].map(([label, value]) => <div key={label} className="rounded-2xl bg-white p-6 shadow-sm"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-[#0b2854]">{value}</p></div>)}
                    </div>
                    <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm"><div className="flex items-end justify-between"><div><p className="text-sm text-slate-500">Engagement</p><h3 className="text-lg font-bold">30-day scans</h3></div><p className="text-sm text-slate-500">Human redirects only</p></div><ScanChart series={series}/></div>
                    <div className="mt-7 flex items-center justify-between"><h3 className="text-xl font-bold">Your SHIFTRIX products</h3><a className="rounded-lg border px-4 py-2 text-sm" href={route('statistics.export')}>Export CSV</a></div>
                    <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {products.map(product => <ProductCard key={product.id} product={product} />)}
                        {!products.length && <div className="col-span-full rounded-2xl border border-dashed bg-white p-10 text-center"><p className="font-semibold">No products activated yet.</p><p className="mt-2 text-sm text-slate-500">Scan a SHIFTRIX product and sign in to claim it.</p></div>}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function ScanChart({series}) {
    const max=Math.max(1,...series.map(point=>Number(point.total)));
    return <div className="mt-5 flex h-36 items-end gap-1" aria-label="30-day scan chart">{series.length?series.map(point=><div key={point.day} title={`${point.day}: ${point.total}`} className="min-w-2 grow rounded-t bg-[#c49a49]" style={{height:`${Math.max(6,Number(point.total)/max*100)}%`}}/>):<p className="self-center text-sm text-slate-400">Scan activity will appear here.</p>}</div>;
}

function ProductCard({ product }) {
    const form = useForm({ google_review_url: product.google_review_url || '' });
    return <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="brand-gradient relative overflow-hidden p-6 text-white"><img src={product.image_url} alt={`${product.variant} product`} className="absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-35"/><div className="relative"><span className="rounded-full bg-white/15 px-3 py-1 text-xs">{product.variant}</span><h4 className="mt-8 text-xl font-bold">{product.code_id}</h4><p className="text-sm text-white/70">Batch {product.batch?.code}</p></div></div>
        <form className="space-y-3 p-5" onSubmit={e => { e.preventDefault(); form.patch(route('products.update', product.id)); }}>
            <div className="flex gap-6 text-sm"><span><b>{product.scans_7d}</b> scans / 7d</span><span><b>{product.scans_30d}</b> scans / 30d</span></div>
            <input className="w-full rounded-lg border-slate-300 text-sm" value={form.data.google_review_url} onChange={e => form.setData('google_review_url', e.target.value)} placeholder="Google Reviews URL" />
            {form.errors.google_review_url && <p className="text-xs text-red-600">{form.errors.google_review_url}</p>}
            <button disabled={form.processing} className="gold-button w-full rounded-lg px-4 py-2 font-semibold">Save destination</button>
        </form>
    </div>;
}

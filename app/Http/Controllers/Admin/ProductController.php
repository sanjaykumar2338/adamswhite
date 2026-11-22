<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Activation;
use App\Models\Batch;
use App\Models\Customer;
use App\Models\InventoryImport;
use App\Models\Product;
use App\Services\AdminAudit;
use App\Support\AdminOverviewCache;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:32'],
            'variant' => ['nullable', 'in:'.implode(',', Product::VARIANTS)],
            'batch' => ['nullable', 'integer', 'exists:batches,id'],
            'status' => ['nullable', 'in:unclaimed,active,paused,disabled'],
            'unit_type' => ['nullable', 'in:commercial,backup'],
            'customer' => ['nullable', 'integer', 'exists:customers,id'],
        ]);

        $search = trim($filters['search'] ?? '');
        $query = Product::query()
            ->with(['batch:id,code,lot_number', 'customer:id,business_name'])
            ->when($search !== '', fn ($q) => $q->where('code_id', 'like', "%{$search}%"))
            ->when($filters['variant'] ?? null, fn ($q, $variant) => $q->where('variant', $variant))
            ->when($filters['batch'] ?? null, fn ($q, $batchId) => $q->where('batch_id', $batchId))
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['unit_type'] ?? null, fn ($q, $unitType) => $q->where('unit_type', $unitType))
            ->when($filters['customer'] ?? null, fn ($q, $customer) => $q->where('customer_id', $customer))
            ->orderBy('id');

        $products = $query->paginate(50)->withQueryString();

        return Inertia::render('Admin/Products', [
            'products' => $products,
            'filters' => [...$filters, 'search' => $search],
            'batches' => Batch::query()->orderBy('lot_number')->get(['id', 'code', 'lot_number']),
            'totalProducts' => Product::count(),
            'customers' => Customer::orderBy('business_name')->get(['id', 'business_name']),
            'inventorySummary' => [
                'total' => Product::count(),
                'claimed' => Product::whereNotNull('customer_id')->count(),
                'available' => Product::whereNull('customer_id')->where('status', 'unclaimed')->count(),
                'disabled' => Product::where('status', 'disabled')->count(),
                'backup' => Product::where('unit_type', 'backup')->count(),
            ],
        ]);
    }

    public function reset(Request $request, Product $product): RedirectResponse
    {
        DB::transaction(function () use ($request, $product): void {
            Activation::create(['product_id' => $product->id, 'previous_customer_id' => $product->customer_id, 'actor_user_id' => $request->user()->id, 'action' => 'reset', 'activated_at' => now()]);
            $product->update(['customer_id' => null, 'status' => 'unclaimed', 'google_review_url' => null, 'claimed_at' => null, 'disabled_at' => null]);
            app(AdminAudit::class)->record($request, 'product.reset', $product, ['code_id' => $product->code_id]);
        });
        AdminOverviewCache::forget();

        return back()->with('success', __('ui.flash.product_reset'));
    }

    public function assignRange(Request $request): RedirectResponse
    {
        $data = $request->validate(['customer_id' => ['required', 'exists:customers,id'], 'start_code' => ['required', 'regex:/^(CARD|PLATE|STAND)-\d{5}$/'], 'end_code' => ['required', 'regex:/^(CARD|PLATE|STAND)-\d{5}$/']]);
        [$startVariant, $startNumber] = explode('-', $data['start_code']);
        [$endVariant, $endNumber] = explode('-', $data['end_code']);
        abort_unless($startVariant === $endVariant && (int) $endNumber >= (int) $startNumber, 422);
        $expected = (int) $endNumber - (int) $startNumber + 1;
        abort_if($expected > 1000, 422);
        $customer = Customer::findOrFail($data['customer_id']);

        DB::transaction(function () use ($request, $customer, $data, $expected): void {
            $products = Product::query()->whereBetween('code_id', [$data['start_code'], $data['end_code']])->lockForUpdate()->orderBy('code_id')->get();
            abort_unless($products->count() === $expected && $products->every(fn (Product $product): bool => $product->status === 'unclaimed' && $product->customer_id === null), 422);
            abort_if($customer->products()->count() + $expected > $customer->max_products, 422);
            Product::whereKey($products->modelKeys())->update(['customer_id' => $customer->id, 'status' => 'active', 'claimed_at' => now()]);
            app(AdminAudit::class)->record($request, 'products.range_assigned', $customer, ['start_code' => $data['start_code'], 'end_code' => $data['end_code'], 'count' => $expected]);
        });
        AdminOverviewCache::forget();

        return back()->with('success', __('ui.flash.products_assigned'));
    }

    public function export(Request $request): StreamedResponse
    {
        app(AdminAudit::class)->record($request, 'inventory.exported', null, ['format' => 'factory_csv']);

        return response()->streamDownload(function (): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['product_id', 'type', 'nfc_url', 'batch', 'unit_type', 'status', 'customer_id']);
            Product::with('batch:id,code')->orderBy('id')->chunk(1000, function ($products) use ($out): void {
                foreach ($products as $product) {
                    fputcsv($out, [$product->code_id, $product->variant, $product->nfc_url, $product->batch?->code, $product->unit_type, $product->status, $product->customer_id]);
                }
            });
            fclose($out);
        }, 'shiftrix-factory-inventory-'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv']);
    }

    public function createFutureRange(Request $request): RedirectResponse
    {
        $data = $request->validate(['variant' => ['required', 'in:CARD,PLATE,STAND'], 'start_sequence' => ['required', 'integer', 'min:1', 'max:99999'], 'count' => ['required', 'integer', 'min:1', 'max:1000'], 'confirmation' => ['required', 'in:CREATE FUTURE INVENTORY']]);
        $end = $data['start_sequence'] + $data['count'] - 1;
        abort_if($end > 99999, 422);
        DB::transaction(function () use ($request, $data, $end): void {
            $codes = collect(range($data['start_sequence'], $end))->map(fn ($n) => $data['variant'].'-'.str_pad((string) $n, 5, '0', STR_PAD_LEFT));
            abort_if(Product::whereIn('code_id', $codes)->exists(), 422);
            $import = InventoryImport::create(['original_filename' => 'admin-future-range-'.now()->format('YmdHis'), 'file_sha256' => hash('sha256', $codes->join('|')), 'total_rows' => $codes->count(), 'commercial_rows' => $codes->count(), 'backup_rows' => 0, 'status' => 'imported', 'imported_by' => $request->user()->id, 'imported_at' => now()]);
            $lot = (int) (Batch::query()->orderByDesc('lot_number')->lockForUpdate()->value('lot_number') ?? 0) + 1;
            $batch = Batch::create(['lot_number' => $lot, 'code' => 'FUT-'.str_pad((string) $lot, 3, '0', STR_PAD_LEFT), 'commercial_count' => $codes->count(), 'backup_count' => 0, 'total_count' => $codes->count(), 'inventory_import_id' => $import->id, 'is_future_inventory' => true]);
            $firstSourceLine = (int) (Product::query()->orderByDesc('source_line')->lockForUpdate()->value('source_line') ?? 0) + 1;
            foreach ($codes as $index => $code) {
                Product::create(['batch_id' => $batch->id, 'inventory_import_id' => $import->id, 'code_id' => $code, 'variant' => $data['variant'], 'code_sequence' => $data['start_sequence'] + $index, 'unit_type' => 'commercial', 'position_in_batch' => $index + 1, 'source_line' => $firstSourceLine + $index, 'status' => 'unclaimed']);
            }
            app(AdminAudit::class)->record($request, 'inventory.future_range_created', $batch, ['variant' => $data['variant'], 'start_sequence' => $data['start_sequence'], 'count' => $codes->count()]);
        });
        AdminOverviewCache::forget();

        return back()->with('success', __('ui.flash.future_inventory_created'));
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\ScanEvent;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PrivacyExportController extends Controller
{
    public function __invoke(Request $request): StreamedResponse
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer && $request->user()->roleFor($customer) === 'owner', 403);

        $products = $customer->products()->orderBy('code_id')->get()->map(fn ($product): array => [
            'product_id' => $product->code_id,
            'type' => $product->variant,
            'display_name' => $product->display_name,
            'status' => $product->status,
            'google_review_url' => $product->google_review_url,
            'nfc_url' => $product->nfc_url,
            'activated_at' => $product->claimed_at?->toIso8601String(),
        ]);
        $scanSummary = ScanEvent::query()->where('customer_id', $customer->id)
            ->selectRaw('result, is_probable_bot, COUNT(*) total')
            ->groupBy('result', 'is_probable_bot')->get()->map(fn ($row): array => [
                'result' => $row->result,
                'probable_bot' => (bool) $row->is_probable_bot,
                'total' => (int) $row->total,
            ]);
        $payload = [
            'exported_at' => now()->toIso8601String(),
            'account' => $request->user()->only(['name', 'first_name', 'last_name', 'email', 'preferred_locale', 'created_at']),
            'organization' => ['name' => $customer->business_name, 'status' => $customer->status, 'role' => 'owner'],
            'team' => $customer->users()->get()->map(fn ($user): array => ['name' => $user->name, 'email' => $user->email, 'role' => $user->pivot->role, 'status' => $user->pivot->status]),
            'products' => $products,
            'scan_summary' => $scanSummary,
            'retention_note' => __('ui.privacy.export_retention'),
        ];

        return response()->streamDownload(function () use ($payload): void {
            echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }, 'shiftrix-customer-data-'.now()->format('Y-m-d').'.json', ['Content-Type' => 'application/json']);
    }
}

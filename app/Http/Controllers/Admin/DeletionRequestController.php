<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AccountDeletionRequest;
use App\Services\AdminAudit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeletionRequestController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/DeletionRequests', [
            'requests' => AccountDeletionRequest::query()->with(['user:id,name,email', 'customer:id,business_name', 'reviewer:id,name'])->latest('requested_at')->get(),
        ]);
    }

    public function update(Request $request, AccountDeletionRequest $deletionRequest): RedirectResponse
    {
        abort_unless($deletionRequest->status === 'pending', 422);
        $validated = $request->validate(['status' => ['required', 'in:approved,rejected'], 'admin_notes' => ['nullable', 'string', 'max:2000']]);
        $deletionRequest->update([...$validated, 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]);
        app(AdminAudit::class)->record($request, 'deletion_request.reviewed', $deletionRequest, ['status' => $validated['status']]);

        return back()->with('success', __('ui.flash.deletion_reviewed'));
    }
}

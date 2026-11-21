<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TeamInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ManagerController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate(['search' => ['nullable', 'string', 'max:120'], 'status' => ['nullable', 'in:active,revoked,pending']]);
        $search = trim((string) ($filters['search'] ?? ''));
        $status = $filters['status'] ?? null;
        $members = DB::table('customer_memberships')->join('users', 'users.id', '=', 'customer_memberships.user_id')->join('customers', 'customers.id', '=', 'customer_memberships.customer_id')->where('customer_memberships.role', 'manager')
            ->when(in_array($status, ['active', 'revoked'], true), fn ($q) => $q->where('customer_memberships.status', $status))->when($search, fn ($q) => $q->where(fn ($n) => $n->where('users.name', 'like', "%{$search}%")->orWhere('users.email', 'like', "%{$search}%")->orWhere('customers.business_name', 'like', "%{$search}%")))
            ->select('users.id', 'users.name', 'users.email', 'customers.business_name', 'customer_memberships.status', 'customer_memberships.created_at')->orderBy('users.name')->get();
        $invitations = TeamInvitation::with('customer:id,business_name')->whereNull('accepted_at')->whereNull('revoked_at')->where('expires_at', '>', now())->when($search, fn ($q) => $q->where('email', 'like', "%{$search}%"))->latest()->get();

        return Inertia::render('Admin/Managers', ['members' => $status === 'pending' ? [] : $members, 'invitations' => in_array($status, ['active', 'revoked'], true) ? [] : $invitations, 'filters' => compact('search', 'status'), 'summary' => ['active' => DB::table('customer_memberships')->where('role', 'manager')->where('status', 'active')->count(), 'revoked' => DB::table('customer_memberships')->where('role', 'manager')->where('status', 'revoked')->count(), 'pending' => TeamInvitation::whereNull('accepted_at')->whereNull('revoked_at')->where('expires_at', '>', now())->count()]]);
    }
}

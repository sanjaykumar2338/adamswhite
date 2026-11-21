<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate(['search' => ['nullable', 'string', 'max:120']]);
        $search = trim((string) ($filters['search'] ?? ''));
        $logs = AuditLog::with('actor:id,name,email')->when($search, fn ($q) => $q->where(fn ($n) => $n->where('action', 'like', "%{$search}%")->orWhereHas('actor', fn ($u) => $u->where('name', 'like', "%{$search}%"))))->latest()->paginate(50)->withQueryString();

        return Inertia::render('Admin/Activity', ['logs' => $logs, 'filters' => ['search' => $search]]);
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\AdminAudit;
use App\Support\SupportContact;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(): Response
    {
        $settings = SystemSetting::pluck('value', 'key');
        $settings->put('support_email', $settings->get('support_email', SupportContact::email()));

        return Inertia::render('Admin/Settings', ['settings' => $settings]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate(['support_email' => ['required', 'email'], 'default_product_limit' => ['required', 'integer', 'min:1', 'max:10000']]);
        foreach ($data as $key => $value) {
            SystemSetting::updateOrCreate(['key' => $key], ['value' => (string) $value]);
        }
        app(AdminAudit::class)->record($request, 'settings.updated', null, ['keys' => array_keys($data)]);

        return back()->with('success', __('ui.flash.settings_saved'));
    }
}

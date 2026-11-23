<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LocationController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer, 403);
        $request->merge(['name' => trim((string) $request->input('name'))]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('locations')->where('customer_id', $customer->id)],
        ]);

        $customer->locations()->create(['name' => trim($data['name'])]);

        return back()->with('success', __('ui.flash.location_created'));
    }

    public function update(Request $request, Location $location): RedirectResponse
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer && $location->customer_id === $customer->id, 403);
        $request->merge(['name' => trim((string) $request->input('name'))]);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('locations')->where('customer_id', $customer->id)->ignore($location->id)],
        ]);
        $location->update(['name' => trim($data['name'])]);

        return back()->with('success', __('ui.flash.location_updated'));
    }

    public function destroy(Request $request, Location $location): RedirectResponse
    {
        $customer = $request->user()->currentCustomer();
        abort_unless($customer && $location->customer_id === $customer->id, 403);

        $location->delete();

        return redirect()->route('products.index')->with('success', __('ui.flash.location_deleted'));
    }
}

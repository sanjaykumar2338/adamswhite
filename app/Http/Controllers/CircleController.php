<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CircleController extends Controller
{
    public function __invoke(Request $request): Response
    {
        abort_if($request->user()->is_admin, 403);
        abort_unless($request->user()->currentCustomer(), 403);

        $configuredUrl = (string) config('services.shiftrix.circle_url');
        $circleUrl = filter_var($configuredUrl, FILTER_VALIDATE_URL)
            && parse_url($configuredUrl, PHP_URL_SCHEME) === 'https'
                ? $configuredUrl
                : 'https://af.uppromote.com/ik9dny-b4/register';

        return Inertia::render('Circle/Index', ['circleUrl' => $circleUrl]);
    }
}

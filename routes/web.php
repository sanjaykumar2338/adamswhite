<?php

use App\Http\Controllers\ActivationController;
use App\Http\Controllers\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\ConfigurationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StatisticsExportController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TrackController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/configuration', ConfigurationController::class)->name('configuration');
Route::get('/configuration/invalid', fn () => Inertia::render('Configuration/Invalid', ['code' => request()->query('id')]))->name('configuration.invalid');
Route::get('/configuration/unavailable', fn () => Inertia::render('Configuration/Unavailable', ['code' => request()->query('id')]))->name('configuration.unavailable');
Route::get('/', TrackController::class)->name('home');
Route::post('/locale/{locale}', LocaleController::class)->name('locale.update');
Route::get('/legal-notice', fn () => Inertia::render('Legal', ['titleKey' => 'legal.notice_title', 'kind' => 'legal']))->name('legal');
Route::get('/privacy', fn () => Inertia::render('Legal', ['titleKey' => 'legal.privacy_title', 'kind' => 'privacy']))->name('privacy');
Route::get('/cookies', fn () => Inertia::render('Legal', ['titleKey' => 'legal.cookies_title', 'kind' => 'cookies']))->name('cookies');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::post('/activations', [ActivationController::class, 'store'])->middleware('throttle:20,1')->name('activations.store');
    Route::patch('/products/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::get('/statistics/export', StatisticsExportController::class)->name('statistics.export');
    Route::get('/team', [TeamController::class, 'index'])->name('team.index');
    Route::post('/team', [TeamController::class, 'store'])->name('team.store');
    Route::delete('/team/{user}', [TeamController::class, 'destroy'])->name('team.destroy');
    Route::get('/invitations/{token}', [InvitationController::class, 'accept'])->name('invitations.accept');

    Route::prefix('admin')->middleware('admin')->name('admin.')->group(function () {
        Route::get('/', AdminDashboardController::class)->name('dashboard');
        Route::get('/customers', [AdminCustomerController::class, 'index'])->name('customers.index');
        Route::patch('/customers/{customer}', [AdminCustomerController::class, 'update'])->name('customers.update');
        Route::get('/products', [AdminProductController::class, 'index'])->name('products.index');
        Route::post('/products/{product}/reset', [AdminProductController::class, 'reset'])->name('products.reset');
        Route::get('/settings', [AdminSettingsController::class, 'edit'])->name('settings.edit');
        Route::patch('/settings', [AdminSettingsController::class, 'update'])->name('settings.update');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

Route::get('/saas/{path?}', function (?string $path = null) {
    return redirect('/'.ltrim((string) $path, '/'), 301);
})->where('path', '.*');

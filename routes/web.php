<?php

use App\Http\Controllers\ActivationController;
use App\Http\Controllers\Admin\ActivityController as AdminActivityController;
use App\Http\Controllers\Admin\BatchController as AdminBatchController;
use App\Http\Controllers\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\DeletionRequestController as AdminDeletionRequestController;
use App\Http\Controllers\Admin\ManagerController as AdminManagerController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Admin\StatisticsController as AdminStatisticsController;
use App\Http\Controllers\ConfigurationController;
use App\Http\Controllers\CustomerStatisticsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HelpController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\LocaleController;
use App\Http\Controllers\PrivacyExportController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\StatisticsExportController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TrackController;
use App\Http\Controllers\WorkspaceController;
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
    Route::get('/dashboard', DashboardController::class)->middleware('customer.access')->name('dashboard');
    Route::get('/products', [ProductController::class, 'index'])->middleware('customer.access')->name('products.index');
    Route::post('/activations', [ActivationController::class, 'store'])->middleware(['customer.access', 'throttle:20,1'])->name('activations.store');
    Route::patch('/products/{product}', [ProductController::class, 'update'])->middleware('customer.access')->name('products.update');
    Route::get('/statistics', CustomerStatisticsController::class)->middleware('customer.access')->name('statistics.index');
    Route::get('/statistics/export', StatisticsExportController::class)->middleware('customer.access')->name('statistics.export');
    Route::get('/team', [TeamController::class, 'index'])->middleware('customer.access')->name('team.index');
    Route::post('/team', [TeamController::class, 'store'])->middleware('customer.access')->name('team.store');
    Route::delete('/team/{user}', [TeamController::class, 'destroy'])->middleware('customer.access')->name('team.destroy');
    Route::patch('/team/invitations/{invitation}/revoke', [TeamController::class, 'revokeInvitation'])->middleware('customer.access')->name('team.invitations.revoke');
    Route::get('/invitations/{token}', [InvitationController::class, 'accept'])->name('invitations.accept');
    Route::post('/settings/sessions/revoke-others', [SessionController::class, 'destroyOthers'])->name('sessions.destroy-others');
    Route::get('/privacy/export', PrivacyExportController::class)->middleware(['customer.access', 'password.confirm'])->name('privacy.export');
    Route::post('/privacy/deletion-request', [ProfileController::class, 'requestDeletion'])->middleware('customer.access')->name('privacy.deletion-request');
    Route::post('/workspaces/{customer}/select', [WorkspaceController::class, 'update'])->name('workspaces.update');
    Route::get('/help', HelpController::class)->middleware('customer.access')->name('help');

    Route::prefix('admin')->middleware('admin')->name('admin.')->group(function () {
        Route::get('/', AdminDashboardController::class)->name('dashboard');
        Route::get('/customers', [AdminCustomerController::class, 'index'])->name('customers.index');
        Route::get('/customers/{customer}', [AdminCustomerController::class, 'show'])->name('customers.show');
        Route::patch('/customers/{customer}', [AdminCustomerController::class, 'update'])->name('customers.update');
        Route::post('/customers/{customer}/password-reset', [AdminCustomerController::class, 'sendPasswordReset'])->name('customers.password-reset');
        Route::get('/products', [AdminProductController::class, 'index'])->name('products.index');
        Route::post('/products/{product}/reset', [AdminProductController::class, 'reset'])->name('products.reset');
        Route::post('/products/assign-range', [AdminProductController::class, 'assignRange'])->name('products.assign-range');
        Route::get('/inventory/export', [AdminProductController::class, 'export'])->name('inventory.export');
        Route::post('/inventory/future-range', [AdminProductController::class, 'createFutureRange'])->name('inventory.future-range');
        Route::get('/managers', [AdminManagerController::class, 'index'])->name('managers.index');
        Route::get('/batches', [AdminBatchController::class, 'index'])->name('batches.index');
        Route::get('/statistics', AdminStatisticsController::class)->name('statistics.index');
        Route::get('/activity', [AdminActivityController::class, 'index'])->name('activity.index');
        Route::get('/settings', [AdminSettingsController::class, 'edit'])->name('settings.edit');
        Route::patch('/settings', [AdminSettingsController::class, 'update'])->name('settings.update');
        Route::get('/deletion-requests', [AdminDeletionRequestController::class, 'index'])->name('deletion-requests.index');
        Route::patch('/deletion-requests/{deletionRequest}', [AdminDeletionRequestController::class, 'update'])->name('deletion-requests.update');
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->middleware('customer.access')->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->middleware('customer.access')->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

Route::get('/saas/{path?}', function (?string $path = null) {
    return redirect('/'.ltrim((string) $path, '/'), 301);
})->where('path', '.*');

<?php

use App\Http\Controllers\ActivationController;
use App\Http\Controllers\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\ConfigurationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StatisticsExportController;
use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Welcome'))->name('home');
Route::get('/configuration', ConfigurationController::class)->name('configuration');
Route::get('/legal-notice', fn () => Inertia::render('Legal', ['title' => 'Legal Notice', 'kind' => 'legal']))->name('legal');
Route::get('/privacy', fn () => Inertia::render('Legal', ['title' => 'Privacy Policy', 'kind' => 'privacy']))->name('privacy');
Route::get('/cookies', fn () => Inertia::render('Legal', ['title' => 'Cookie Policy', 'kind' => 'cookies']))->name('cookies');

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

<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Route::get('/dashboard', function () {
//     return Inertia::render('Dashboard');
// })->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'fetch'])->name('dashboard');
    
    Route::get('/orders', [OrderController::class, 'fetch'])->name('orders');
    Route::get('/orders/{order}', [OrderController::class, 'orderDetails'])->name('order.details');
    Route::post('/orders/status', [OrderController::class, 'upateOrderStatus'])->name('order.status');
    Route::post('/orders/payment', [OrderController::class, 'reconcilePayment'])->name('order.payment');

    Route::get('/books', [ProfileController::class, 'edit'])->name('books');
    
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

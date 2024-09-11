<?php

use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::controller(OrderController::class)->group(function() {
    Route::post('checkout', 'createOrder');   
    Route::get('order/{id}', 'getOrderStatus');    
});

Route::controller(PaymentController::class)->group(function() {
    Route::post('payments/trigger', 'triggerSTKPayment');
    Route::get('payments/status/{id}', 'validatePayment');
    Route::post('callbacks/confirmation', 'handleMPESACallback');
    Route::post('callbacks/stk', 'handleSTKCallback');
    Route::post('callbacks/complete', 'createOrder');
    Route::post('callbacks/result', 'createOrder');
});
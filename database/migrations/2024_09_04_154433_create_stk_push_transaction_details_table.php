<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('stk_push_transaction_details', function (Blueprint $table) {
            $table->id();
            $table->integer('amount');
            $table->string('phone_number');
            $table->string('business_code');
            $table->string('receiptNumber')->nullable();
            $table->string('responseCode')->nullable();
            $table->string('MerchantRequestID')->nullable();
            $table->string('CheckoutRequestID')->nullable();
            $table->string('ResponseDescription')->nullable();
            $table->string('errorMessage')->nullable();
            $table->integer('status')->default(0);  //0 -pending 1- successful  2- failed
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stk_push_transaction_details');
    }
};

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
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->string('title')->unique();
            $table->string('subtitle');
            $table->text('shortDescription');
            $table->text('description');
            $table->string('imageUrl')->default('https://placehold.co/600x400');
            $table->string('author')->default('Dodzweit Achero');
            $table->integer('price')->default(1000);
            $table->string('stockStatus')->default('in-stock');
            $table->string('ISBN')->nullable();
            $table->string('publisher')->nullable();
            $table->timestamp('publicationDate')->nullable();
            $table->string('amazonLink')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};

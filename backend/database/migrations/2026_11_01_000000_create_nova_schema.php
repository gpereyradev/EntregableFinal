<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $t) {
            $t->id();
            $t->string('name', 100);
            $t->string('email')->unique();
            $t->string('password');
            $t->string('role', 20)->default('seller');
            $t->boolean('active')->default(true);
            $t->rememberToken();
            $t->timestamps();
        });
        Schema::create('sessions', function (Blueprint $t) {
            $t->string('id')->primary();
            $t->foreignId('user_id')->nullable()->index();
            $t->string('ip_address', 45)->nullable();
            $t->text('user_agent')->nullable();
            $t->longText('payload');
            $t->integer('last_activity')->index();
        });
        Schema::create('categories', function (Blueprint $t) {
            $t->id();
            $t->string('name', 80)->unique();
        });
        Schema::create('products', function (Blueprint $t) {
            $t->id();
            $t->string('code', 40)->unique();
            $t->string('name', 160)->index();
            $t->foreignId('category_id')->constrained()->restrictOnDelete();
            $t->string('presentation', 100);
            $t->text('description')->nullable();
            $t->unsignedInteger('price_cents');
            $t->unsignedInteger('min_stock')->default(10);
            $t->boolean('active')->default(true);
            $t->timestamps();
        });
        Schema::create('batches', function (Blueprint $t) {
            $t->id();
            $t->foreignId('product_id')->constrained()->restrictOnDelete();
            $t->string('code', 60);
            $t->date('expires_at')->index();
            $t->unsignedInteger('quantity')->default(0);
            $t->timestamps();
            $t->unique(['product_id', 'code']);
        });
        Schema::create('sales', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->restrictOnDelete();
            $t->string('payment_method', 20);
            $t->unsignedInteger('total_cents');
            $t->string('status', 20)->default('completed');
            $t->boolean('demo')->default(false);
            $t->timestamp('cancelled_at')->nullable();
            $t->foreignId('cancelled_by')->nullable()->constrained('users')->restrictOnDelete();
            $t->string('cancel_reason', 255)->nullable();
            $t->timestamps();
            $t->index(['created_at', 'status']);
        });
        Schema::create('sale_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('sale_id')->constrained()->restrictOnDelete();
            $t->foreignId('product_id')->constrained()->restrictOnDelete();
            $t->string('product_name');
            $t->string('product_code');
            $t->unsignedInteger('quantity');
            $t->unsignedInteger('unit_price_cents');
            $t->unsignedInteger('subtotal_cents');
        });
        Schema::create('allocations', function (Blueprint $t) {
            $t->id();
            $t->foreignId('sale_item_id')->constrained()->restrictOnDelete();
            $t->foreignId('batch_id')->constrained()->restrictOnDelete();
            $t->unsignedInteger('quantity');
        });
        Schema::create('movements', function (Blueprint $t) {
            $t->id();
            $t->foreignId('batch_id')->constrained()->restrictOnDelete();
            $t->foreignId('user_id')->constrained()->restrictOnDelete();
            $t->foreignId('sale_id')->nullable()->constrained()->restrictOnDelete();
            $t->string('type', 20);
            $t->integer('quantity');
            $t->unsignedInteger('stock_after');
            $t->string('reason', 255);
            $t->timestamp('created_at')->useCurrent()->index();
        });
        Schema::create('request_receipts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->restrictOnDelete();
            $t->uuid('key');
            $t->string('hash', 64);
            $t->json('response');
            $t->timestamps();
            $t->unique(['user_id', 'key']);
        });
        Schema::create('audits', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->nullable()->constrained()->restrictOnDelete();
            $t->string('action');
            $t->string('subject');
            $t->json('metadata')->nullable();
            $t->timestamp('created_at')->useCurrent()->index();
        });
        if (DB::getDriverName() === 'pgsql') {
            foreach (['products' => 'price_cents >= 0 AND min_stock >= 0', 'batches' => 'quantity >= 0', 'sales' => "total_cents >= 0 AND status IN ('completed','cancelled') AND payment_method IN ('cash','card','transfer')", 'sale_items' => 'quantity > 0 AND unit_price_cents >= 0 AND subtotal_cents = quantity * unit_price_cents', 'allocations' => 'quantity > 0', 'users' => "role IN ('admin','seller')"] as $table => $check) {
                DB::statement("ALTER TABLE $table ADD CONSTRAINT {$table}_valid CHECK ($check)");
            }
        }
    }

    public function down(): void
    {
        foreach (['audits', 'request_receipts', 'movements', 'allocations', 'sale_items', 'sales', 'batches', 'products', 'categories', 'sessions', 'users'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};

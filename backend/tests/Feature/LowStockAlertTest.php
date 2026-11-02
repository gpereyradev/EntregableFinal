<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class LowStockAlertTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $seller;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.key' => str_repeat('t', 32)]);
        config(['services.telegram.bot_token' => 'TEST_TOKEN', 'services.telegram.chat_id' => '-100123']);
        $this->admin = User::create(['name' => 'Admin Test', 'email' => 'admin@test.invalid', 'password' => 'TestPassword123', 'role' => 'admin']);
        $this->seller = User::create(['name' => 'Seller Test', 'email' => 'seller@test.invalid', 'password' => 'TestPassword123', 'role' => 'seller']);
        $c = Category::create(['name' => 'Categoría de prueba']);
        $this->product = Product::create(['code' => 'ALERT-1', 'name' => 'Producto de alerta', 'category_id' => $c->id, 'presentation' => 'Unidad', 'price_cents' => 105, 'min_stock' => 5]);
    }

    private function fakeTelegramOk(): void
    {
        Http::fake(['api.telegram.org/*' => Http::response(['ok' => true])]);
    }

    private function batch(int $quantity): Batch
    {
        return Batch::create(['product_id' => $this->product->id, 'code' => 'ALERT-LOTE', 'expires_at' => today()->addDays(90)->toDateString(), 'quantity' => $quantity]);
    }

    private function sell(int $qty): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($this->seller)->postJson('/api/sales', ['payment_method' => 'cash', 'items' => [['product_id' => $this->product->id, 'quantity' => $qty]]], ['Idempotency-Key' => (string) Str::uuid()]);
    }

    public function test_alert_is_sent_once_when_stock_reaches_minimum(): void
    {
        $this->fakeTelegramOk();
        $this->batch(8);
        $this->sell(3)->assertCreated(); // disponible 5 = mínimo → alerta
        $this->sell(1)->assertCreated(); // disponible 4 → sigue bajo, sin reenvío

        Http::assertSentCount(1);
        Http::assertSent(fn ($request) => str_contains($request->url(), '/sendMessage')
            && $request['chat_id'] === '-100123'
            && str_contains($request['text'], 'ALERT-1')
            && str_contains($request['text'], 'Disponible: 5'));
    }

    public function test_no_alert_while_stock_is_above_minimum(): void
    {
        $this->fakeTelegramOk();
        $this->batch(20);
        $this->sell(2)->assertCreated();

        Http::assertNothingSent();
        $this->assertNull($this->product->fresh()->low_stock_notified_at);
    }

    public function test_restock_rearms_the_alert(): void
    {
        $this->fakeTelegramOk();
        $batch = $this->batch(8);
        $this->sell(4)->assertCreated(); // 4 ≤ 5 → alerta 1
        $this->actingAs($this->admin)->postJson('/api/stock', ['product_id' => $this->product->id, 'batch_id' => $batch->id, 'type' => 'adjustment', 'quantity' => 20, 'reason' => 'Reposición de prueba'], ['Idempotency-Key' => (string) Str::uuid()])->assertCreated(); // 24 → se rearma
        $this->assertNull($this->product->fresh()->low_stock_notified_at);
        $this->sell(20)->assertCreated(); // 4 → alerta 2

        Http::assertSentCount(2);
    }

    public function test_telegram_failure_never_blocks_the_sale_and_retries_next_time(): void
    {
        Http::fake(['api.telegram.org/*' => Http::sequence()->pushStatus(500)->push(['ok' => true])]);
        $this->batch(6);

        $this->sell(2)->assertCreated(); // 4 ≤ 5, Telegram responde 500: la venta se confirma igual
        $this->assertEquals(4, Batch::sum('quantity'));
        $this->assertNull($this->product->fresh()->low_stock_notified_at);

        $this->sell(1)->assertCreated(); // reintento en la siguiente operación
        Http::assertSentCount(2);
        $this->assertNotNull($this->product->fresh()->low_stock_notified_at);
    }

    public function test_nothing_is_sent_when_telegram_is_not_configured(): void
    {
        Http::fake();
        config(['services.telegram.bot_token' => null, 'services.telegram.chat_id' => null]);
        $this->batch(8);

        $this->sell(4)->assertCreated();

        Http::assertNothingSent();
        $this->assertNull($this->product->fresh()->low_stock_notified_at);
    }
}

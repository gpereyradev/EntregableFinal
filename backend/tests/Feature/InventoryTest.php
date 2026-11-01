<?php

namespace Tests\Feature;

use App\Models\Batch;
use App\Models\Category;
use App\Models\Movement;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class InventoryTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $seller;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.key' => str_repeat('t', 32)]);
        $this->admin = User::create(['name' => 'Admin Test', 'email' => 'admin@test.invalid', 'password' => 'TestPassword123', 'role' => 'admin']);
        $this->seller = User::create(['name' => 'Seller Test', 'email' => 'seller@test.invalid', 'password' => 'TestPassword123', 'role' => 'seller']);
        $c = Category::create(['name' => 'Categoría de prueba']);
        $this->product = Product::create(['code' => 'TEST-1', 'name' => 'Producto de prueba', 'category_id' => $c->id, 'presentation' => 'Unidad', 'price_cents' => 105, 'min_stock' => 5]);
    }

    private function batch(int $quantity, int $days = 90, string $code = 'TEST-LOTE'): Batch
    {
        return Batch::create(['product_id' => $this->product->id, 'code' => $code, 'expires_at' => today()->addDays($days)->toDateString(), 'quantity' => $quantity]);
    }

    private function sell(int $qty = 1, ?string $key = null)
    {
        return $this->actingAs($this->seller)->postJson('/api/sales', ['payment_method' => 'cash', 'items' => [['product_id' => $this->product->id, 'quantity' => $qty]]], ['Idempotency-Key' => $key ?? (string) Str::uuid()]);
    }

    public function test_guest_and_inactive_users_are_rejected(): void
    {
        $this->getJson('/api/products')->assertUnauthorized();
        $this->seller->update(['active' => false]);
        $this->actingAs($this->seller)->getJson('/api/products')->assertUnauthorized();
    }

    public function test_login_and_logout(): void
    {
        $this->postJson('/api/login', ['email' => $this->admin->email, 'password' => 'wrong'])->assertStatus(422);
        $this->postJson('/api/login', ['email' => $this->admin->email, 'password' => 'TestPassword123'])->assertOk()->assertJsonPath('user.role', 'admin');
        $this->postJson('/api/logout')->assertOk();
        $this->getJson('/api/products')->assertUnauthorized();
    }

    public function test_seller_cannot_modify_inventory_or_view_admin_data(): void
    {
        foreach (['/api/stock', '/api/products', '/api/users'] as $path) {
            $this->actingAs($this->seller)->postJson($path, [])->assertForbidden();
        }foreach (['/api/reports', '/api/alerts', '/api/movements', '/api/users', '/api/audits'] as $path) {
            $this->getJson($path)->assertForbidden();
        }
    }

    public function test_product_creation_validation_and_unique_code(): void
    {
        $d = ['code' => 'NEW-001', 'name' => 'Nuevo producto', 'category_id' => $this->product->category_id, 'presentation' => 'Caja', 'price_cents' => 250, 'min_stock' => 3];
        $this->actingAs($this->admin)->postJson('/api/products', $d)->assertCreated();
        $this->postJson('/api/products', $d)->assertUnprocessable()->assertJsonValidationErrors('code');
        $d['code'] = 'NEW-002';
        $d['price_cents'] = 1.5;
        $this->postJson('/api/products', $d)->assertUnprocessable();
    }

    public function test_stock_entry_and_duplicate_retry(): void
    {
        $d = ['product_id' => $this->product->id, 'type' => 'entry', 'code' => 'NUEVO', 'expires_at' => today()->addMonth()->toDateString(), 'quantity' => 10, 'reason' => 'Recepción de proveedor'];
        $key = (string) Str::uuid();
        $this->actingAs($this->admin)->postJson('/api/stock', $d, ['Idempotency-Key' => $key])->assertCreated();
        $this->postJson('/api/stock', $d, ['Idempotency-Key' => $key])->assertCreated();
        $this->assertEquals(10, Batch::sum('quantity'));
        $this->assertEquals(1, Movement::count());
        $d['quantity'] = 20;
        $this->postJson('/api/stock', $d, ['Idempotency-Key' => $key])->assertConflict();
    }

    public function test_adjustment_cannot_make_stock_negative(): void
    {
        $b = $this->batch(4);
        $d = ['product_id' => $this->product->id, 'batch_id' => $b->id, 'type' => 'adjustment', 'quantity' => -5, 'reason' => 'Conteo físico de prueba'];
        $this->actingAs($this->admin)->postJson('/api/stock', $d, ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
        $this->assertEquals(4, $b->fresh()->quantity);
        $d['quantity'] = -2;
        $this->postJson('/api/stock', $d, ['Idempotency-Key' => (string) Str::uuid()])->assertCreated();
        $this->assertEquals(2, $b->fresh()->quantity);
    }

    public function test_sale_uses_integer_cents_and_historical_price(): void
    {
        $b = $this->batch(10);
        $r = $this->sell(3)->assertCreated()->assertJsonPath('sale.total_cents', 315)->assertJsonPath('sale.status', 'completed');
        $this->assertEquals(7, $b->fresh()->quantity);
        $this->product->update(['price_cents' => 990]);
        $this->assertEquals(105, SaleItem::first()->unit_price_cents);
        $this->assertEquals(315, Sale::first()->total_cents);
    }

    public function test_out_of_stock_sale_rolls_back_everything(): void
    {
        $b = $this->batch(2);
        $this->sell(3)->assertUnprocessable();
        $this->assertEquals(2, $b->fresh()->quantity);
        $this->assertEquals(0, Sale::count());
        $this->assertEquals(0, Movement::count());
    }

    public function test_expired_batches_are_never_sold(): void
    {
        $b = $this->batch(99, -1);
        $this->sell()->assertUnprocessable();
        $this->assertEquals(99, $b->fresh()->quantity);
    }

    public function test_fefo_spans_valid_batches_and_ignores_expired(): void
    {
        $expired = $this->batch(100, -1, 'OLD');
        $late = $this->batch(6, 80, 'LATE');
        $early = $this->batch(2, 10, 'EARLY');
        $this->sell(4)->assertCreated();
        $this->assertEquals(100, $expired->fresh()->quantity);
        $this->assertEquals(0, $early->fresh()->quantity);
        $this->assertEquals(4, $late->fresh()->quantity);
        $this->assertEquals(2, Movement::count());
    }

    public function test_same_day_expiry_is_still_valid(): void
    {
        $b = $this->batch(1, 0);
        $this->sell()->assertCreated();
        $this->assertEquals(0, $b->fresh()->quantity);
    }

    public function test_inactive_product_cannot_be_sold(): void
    {
        $this->batch(10);
        $this->product->update(['active' => false]);
        $this->sell()->assertUnprocessable();
    }

    public function test_duplicate_sale_request_is_replayed_once(): void
    {
        $b = $this->batch(5);
        $key = (string) Str::uuid();
        $a = $this->sell(2, $key)->assertCreated();
        $z = $this->sell(2, $key)->assertCreated();
        $this->assertEquals($a->json('sale.id'), $z->json('sale.id'));
        $this->assertEquals(3, $b->fresh()->quantity);
        $this->assertEquals(1, Sale::count());
        $this->sell(1, $key)->assertConflict();
    }

    public function test_cancellation_restores_once_and_keeps_reason(): void
    {
        $b = $this->batch(4);
        $id = $this->sell(2)->json('sale.id');
        $key = (string) Str::uuid();
        $this->actingAs($this->admin)->postJson('/api/sales/'.$id.'/cancel', ['reason' => 'Cliente desistió de compra'], ['Idempotency-Key' => $key])->assertOk();
        $this->postJson('/api/sales/'.$id.'/cancel', ['reason' => 'Cliente desistió de compra'], ['Idempotency-Key' => $key])->assertOk();
        $this->postJson('/api/sales/'.$id.'/cancel', ['reason' => 'Otro intento de devolución'], ['Idempotency-Key' => (string) Str::uuid()])->assertConflict();
        $this->assertEquals(4, $b->fresh()->quantity);
        $this->assertEquals(1, Movement::where('type', 'void')->count());
        $this->assertNotNull(Sale::first()->cancelled_at);
    }

    public function test_sellers_cannot_read_other_sellers_sales(): void
    {
        $this->batch(3);
        $id = $this->sell()->json('sale.id');
        $other = User::create(['name' => 'Otro', 'email' => 'otro@test.invalid', 'password' => 'TestPassword123', 'role' => 'seller']);
        $this->actingAs($other)->getJson('/api/sales/'.$id)->assertForbidden();
        $this->getJson('/api/sales')->assertJsonPath('total', 0);
    }

    public function test_alerts_derive_available_stock_excluding_expired(): void
    {
        $this->batch(100, -1, 'OLD');
        $this->batch(2, 10, 'SOON');
        $r = $this->actingAs($this->admin)->getJson('/api/alerts')->assertOk();
        $this->assertCount(1, $r->json('low_stock'));
        $this->assertEquals(2, $r->json('low_stock.0.available_stock'));
        $this->assertCount(1, $r->json('expired'));
        $this->assertCount(1, $r->json('expiring'));
    }

    public function test_reports_exclude_cancellations_and_csv_works(): void
    {
        $this->batch(10);
        $id = $this->sell(2)->json('sale.id');
        $this->sell(3);
        $this->actingAs($this->admin)->postJson('/api/sales/'.$id.'/cancel', ['reason' => 'Anulación de prueba'], ['Idempotency-Key' => (string) Str::uuid()])->assertOk();
        $this->getJson('/api/reports')->assertOk()->assertJsonPath('today_cents', 315)->assertJsonPath('period_count', 1);
        $this->get('/api/reports/export')->assertOk()->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }

    public function test_server_requires_idempotency_key_and_unique_lines(): void
    {
        $this->batch(10);
        $this->actingAs($this->seller)->postJson('/api/sales', ['payment_method' => 'cash', 'items' => [['product_id' => $this->product->id, 'quantity' => 1]]])->assertUnprocessable();
        $this->postJson('/api/sales', ['payment_method' => 'cash', 'items' => [['product_id' => $this->product->id, 'quantity' => 1], ['product_id' => $this->product->id, 'quantity' => 1]]], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
    }

    public function test_user_management_and_self_protection(): void
    {
        $this->actingAs($this->admin)->postJson('/api/users', ['name' => 'Nuevo', 'email' => 'nuevo@test.invalid', 'password' => 'SecureTestPass123', 'role' => 'seller', 'active' => true])->assertCreated();
        $this->putJson('/api/users/'.$this->admin->id, ['name' => $this->admin->name, 'email' => $this->admin->email, 'role' => 'seller', 'active' => true])->assertUnprocessable();
        $this->assertTrue(password_verify('TestPassword123', $this->admin->password));
    }

    public function test_second_line_failure_rolls_back_first_line(): void
    {
        $b = $this->batch(10);
        $p = Product::create(['code' => 'EMPTY', 'name' => 'Sin stock', 'category_id' => $this->product->category_id, 'presentation' => 'Unidad', 'price_cents' => 100, 'min_stock' => 1]);
        $this->actingAs($this->seller)->postJson('/api/sales', ['payment_method' => 'cash', 'items' => [['product_id' => $this->product->id, 'quantity' => 2], ['product_id' => $p->id, 'quantity' => 1]]], ['Idempotency-Key' => (string) Str::uuid()])->assertUnprocessable();
        $this->assertEquals(10, $b->fresh()->quantity);
        $this->assertEquals(0, Sale::count());
        $this->assertEquals(0, Movement::count());
    }
}

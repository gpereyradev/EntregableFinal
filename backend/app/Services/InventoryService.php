<?php

namespace App\Services;

use App\Models\Allocation;
use App\Models\Audit;
use App\Models\Batch;
use App\Models\Movement;
use App\Models\Product;
use App\Models\RequestReceipt;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    public static function fail(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }

    public function once(User $actor, string $key, array $payload, callable $work): array
    {
        return DB::transaction(function () use ($actor, $key, $payload, $work) {
            $locked = User::whereKey($actor->id)->lockForUpdate()->firstOrFail();
            abort_unless($locked->active, 403, 'Usuario inactivo.');
            $hash = hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR));
            $previous = RequestReceipt::where('user_id', $actor->id)->where('key', $key)->first();
            if ($previous) {
                abort_unless(hash_equals($previous->hash, $hash), 409, 'Esta clave ya se usó con otros datos.');

                return $previous->response;
            }
            $result = $work();
            RequestReceipt::create(['user_id' => $actor->id, 'key' => $key, 'hash' => $hash, 'response' => $result]);

            return $result;
        }, 3);
    }

    public function move(User $actor, array $d): array
    {
        $product = Product::whereKey($d['product_id'])->lockForUpdate()->firstOrFail();
        if (! $product->active) {
            self::fail('product_id', 'El producto está inactivo.');
        }
        if ($d['type'] === 'entry') {
            if ($d['quantity'] < 1) {
                self::fail('quantity', 'Una entrada debe ser positiva.');
            }
            $batch = Batch::firstOrCreate(['product_id' => $product->id, 'code' => $d['code']], ['expires_at' => $d['expires_at'], 'quantity' => 0]);
            if ($batch->expires_at !== $d['expires_at']) {
                self::fail('expires_at', 'El lote ya existe con otra fecha de vencimiento.');
            }
        } else {
            $batch = Batch::where('product_id', $product->id)->whereKey($d['batch_id'])->lockForUpdate()->firstOrFail();
        }
        if ($batch->quantity + $d['quantity'] < 0) {
            self::fail('quantity', 'El ajuste dejaría existencias negativas.');
        }
        $batch->increment('quantity', $d['quantity']);
        $batch->refresh();
        Movement::create(['batch_id' => $batch->id, 'user_id' => $actor->id, 'type' => $d['type'], 'quantity' => $d['quantity'], 'stock_after' => $batch->quantity, 'reason' => $d['reason']]);
        Audit::create(['user_id' => $actor->id, 'action' => 'stock.'.$d['type'], 'subject' => 'batch:'.$batch->id, 'metadata' => ['quantity' => $d['quantity'], 'reason' => $d['reason']]]);

        return ['message' => 'Inventario actualizado.', 'batch' => $batch->toArray()];
    }

    public function sell(User $actor, array $d): array
    {
        $items = collect($d['items'])->sortBy('product_id');
        $products = Product::whereIn('id', $items->pluck('product_id'))->orderBy('id')->lockForUpdate()->get()->keyBy('id');
        $sale = Sale::create(['user_id' => $actor->id, 'payment_method' => $d['payment_method'], 'total_cents' => 0]);
        $total = 0;
        foreach ($items as $i) {
            $p = $products[$i['product_id']];
            if (! $p->active) {
                self::fail('items', "{$p->name}: producto inactivo.");
            }
            $batches = Batch::where('product_id', $p->id)->where('quantity', '>', 0)->where('expires_at', '>=', today()->toDateString())->orderBy('expires_at')->orderBy('id')->lockForUpdate()->get();
            if ($batches->sum('quantity') < $i['quantity']) {
                self::fail('items', "{$p->name}: stock disponible insuficiente. Los lotes vencidos no se venden.");
            }
            $subtotal = $p->price_cents * $i['quantity'];
            $total += $subtotal;
            if ($total > 2000000000) {
                self::fail('items', 'El total supera el límite permitido.');
            }
            $line = SaleItem::create(['sale_id' => $sale->id, 'product_id' => $p->id, 'product_name' => $p->name, 'product_code' => $p->code, 'quantity' => $i['quantity'], 'unit_price_cents' => $p->price_cents, 'subtotal_cents' => $subtotal]);
            $left = $i['quantity'];
            foreach ($batches as $batch) {
                if (! $left) {
                    break;
                }$take = min($left, $batch->quantity);
                $batch->decrement('quantity', $take);
                $left -= $take;
                Allocation::create(['sale_item_id' => $line->id, 'batch_id' => $batch->id, 'quantity' => $take]);
                Movement::create(['batch_id' => $batch->id, 'user_id' => $actor->id, 'sale_id' => $sale->id, 'type' => 'sale', 'quantity' => -$take, 'stock_after' => $batch->quantity, 'reason' => 'Venta interna NS-'.str_pad((string) $sale->id, 6, '0', STR_PAD_LEFT)]);
            }
        }
        $sale->update(['total_cents' => $total]);
        Audit::create(['user_id' => $actor->id, 'action' => 'sale.created', 'subject' => 'sale:'.$sale->id, 'metadata' => ['total_cents' => $total]]);

        return ['message' => 'Venta registrada.', 'sale' => $sale->fresh()->load('items.allocations.batch', 'user:id,name')->toArray()];
    }

    public function cancel(User $actor, int $id, string $reason): array
    {
        $sale = Sale::whereKey($id)->lockForUpdate()->firstOrFail();
        abort_unless($sale->status === 'completed', 409, 'La venta ya está anulada. El stock no se devuelve otra vez.');
        $lines = $sale->items()->with('allocations')->orderBy('product_id')->get();
        Product::whereIn('id', $lines->pluck('product_id'))->orderBy('id')->lockForUpdate()->get();
        foreach ($lines as $line) {
            foreach ($line->allocations as $a) {
                $batch = Batch::whereKey($a->batch_id)->lockForUpdate()->firstOrFail();
                $batch->increment('quantity', $a->quantity);
                Movement::create(['batch_id' => $batch->id, 'user_id' => $actor->id, 'sale_id' => $sale->id, 'type' => 'void', 'quantity' => $a->quantity, 'stock_after' => $batch->quantity, 'reason' => $reason]);
            }
        }
        $sale->update(['status' => 'cancelled', 'cancelled_by' => $actor->id, 'cancelled_at' => now(), 'cancel_reason' => $reason]);
        Audit::create(['user_id' => $actor->id, 'action' => 'sale.cancelled', 'subject' => 'sale:'.$sale->id, 'metadata' => ['reason' => $reason]]);

        return ['message' => 'Venta anulada. Existencias repuestas una sola vez.', 'sale' => $sale->fresh()->load('items.allocations.batch', 'user:id,name', 'canceller:id,name')->toArray()];
    }
}

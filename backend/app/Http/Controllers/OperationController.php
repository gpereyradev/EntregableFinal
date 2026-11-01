<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaleRequest;
use App\Http\Requests\StockRequest;
use App\Models\Movement;
use App\Models\Sale;
use App\Services\InventoryService;
use Illuminate\Http\Request;

class OperationController extends Controller
{
    private function once(Request $r, InventoryService $s, callable $callback)
    {
        $key = $r->header('Idempotency-Key');
        validator(['key' => $key], ['key' => 'required|uuid'])->validate();

        return $s->once($r->user(), $key, ['path' => $r->path(), 'body' => $r->validated()], $callback);
    }

    public function stock(StockRequest $r, InventoryService $s)
    {
        return response()->json($this->once($r, $s, fn () => $s->move($r->user(), $r->validated())), 201);
    }

    public function sell(SaleRequest $r, InventoryService $s)
    {
        return response()->json($this->once($r, $s, fn () => $s->sell($r->user(), $r->validated())), 201);
    }

    public function cancel(Request $r, Sale $sale, InventoryService $s)
    {
        $d = $r->validate(['reason' => 'required|string|min:5|max:255']);
        $key = $r->header('Idempotency-Key');
        validator(['key' => $key], ['key' => 'required|uuid'])->validate();

        return $s->once($r->user(), $key, ['path' => $r->path(), 'body' => $d], fn () => $s->cancel($r->user(), $sale->id, $d['reason']));
    }

    public function sales(Request $r)
    {
        $d = $r->validate(['from' => 'nullable|date_format:Y-m-d', 'to' => 'nullable|date_format:Y-m-d|after_or_equal:from', 'page' => 'nullable|integer|min:1', 'status' => 'nullable|in:completed,cancelled']);
        $q = Sale::with('user:id,name')->withCount('items');
        if ($r->user()->role !== 'admin') {
            $q->where('user_id', $r->user()->id);
        }if ($f = $d['from'] ?? null) {
            $q->whereDate('created_at', '>=', $f);
        }if ($t = $d['to'] ?? null) {
            $q->whereDate('created_at', '<=', $t);
        }if ($s = $d['status'] ?? null) {
            $q->where('status', $s);
        }

        return $q->orderByDesc('id')->paginate(20);
    }

    public function show(Request $r, Sale $sale)
    {
        abort_unless($r->user()->role === 'admin' || $sale->user_id === $r->user()->id, 403);

        return $sale->load('items.allocations.batch', 'user:id,name', 'canceller:id,name');
    }

    public function movements(Request $r)
    {
        $d = $r->validate(['page' => 'nullable|integer|min:1', 'type' => 'nullable|in:entry,adjustment,sale,void', 'product_id' => 'nullable|integer|exists:products,id']);
        $q = Movement::with('batch.product:id,name,code', 'user:id,name');
        if ($p = $d['product_id'] ?? null) {
            $q->whereHas('batch', fn ($q) => $q->where('product_id', $p));
        }if ($t = $d['type'] ?? null) {
            $q->where('type', $t);
        }

        return $q->orderByDesc('id')->paginate(20);
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Models\Audit;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public static function query()
    {
        return Product::with('category')->withSum('batches as total_stock', 'quantity')->withSum(['batches as available_stock' => fn ($q) => $q->where('expires_at', '>=', today()->toDateString())], 'quantity');
    }

    public function index(Request $r)
    {
        $d = $r->validate(['search' => 'nullable|string|max:160', 'category_id' => 'nullable|integer|exists:categories,id', 'status' => 'nullable|in:all,low,out,inactive', 'page' => 'nullable|integer|min:1', 'per_page' => 'nullable|integer|min:1|max:100']);
        $q = self::query();
        if ($s = $d['search'] ?? null) {
            $q->where(fn ($q) => $q->whereRaw('LOWER(name) LIKE ?', ['%'.mb_strtolower($s).'%'])->orWhereRaw('LOWER(code) LIKE ?', ['%'.mb_strtolower($s).'%']));
        }if ($c = $d['category_id'] ?? null) {
            $q->where('category_id', $c);
        }
        $status = $d['status'] ?? 'all';
        if ($r->user()->role === 'seller' || $status !== 'inactive') {
            $q->where('active', true);
        } else {
            $q->where('active', false);
        }
        if (in_array($status, ['low', 'out'])) {
            $q->whereRaw('(SELECT COALESCE(SUM(quantity),0) FROM batches WHERE batches.product_id=products.id AND expires_at >= ?) '.($status === 'low' ? '<= products.min_stock' : '= 0'), [today()->toDateString()]);
        }

        return $q->orderBy('name')->paginate($d['per_page'] ?? 20);
    }

    public function show(Product $product)
    {
        return self::query()->with('batches')->findOrFail($product->id);
    }

    public function store(ProductRequest $r)
    {
        return DB::transaction(function () use ($r) {
            $p = Product::create($r->validated());
            Audit::create(['user_id' => $r->user()->id, 'action' => 'product.created', 'subject' => 'product:'.$p->id]);

            return response()->json($p->load('category'), 201);
        });
    }

    public function update(ProductRequest $r, Product $product)
    {
        return DB::transaction(function () use ($r, $product) {
            $p = Product::whereKey($product->id)->lockForUpdate()->firstOrFail();
            $p->update($r->validated());
            Audit::create(['user_id' => $r->user()->id, 'action' => 'product.updated', 'subject' => 'product:'.$p->id, 'metadata' => ['fields' => array_keys($r->validated())]]);

            return $p->load('category');
        });
    }

    public function categories()
    {
        return Category::orderBy('name')->get();
    }

    public function category(Request $r)
    {
        $d = $r->validate(['name' => 'required|string|max:80|unique:categories']);

        return response()->json(Category::create($d), 201);
    }
}

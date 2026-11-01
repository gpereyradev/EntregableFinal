<?php

namespace App\Http\Controllers;

use App\Models\Batch;
use App\Models\Product;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function alerts()
    {
        $products = ProductController::query()->where('active', true)->get();
        $low = $products->filter(fn ($p) => ($p->available_stock ?? 0) <= $p->min_stock)->values();
        $batches = Batch::with('product.category')->whereHas('product', fn ($q) => $q->where('active', true))->where('quantity', '>', 0)->where('expires_at', '<=', today()->addDays(30)->toDateString())->orderBy('expires_at')->get();

        return ['low_stock' => $low, 'expiring' => $batches->filter(fn ($b) => $b->expires_at >= today()->toDateString())->values(), 'expired' => $batches->filter(fn ($b) => $b->expires_at < today()->toDateString())->values(), 'as_of' => now()->toIso8601String()];
    }

    public function data(Request $r): array
    {
        $d = $r->validate(['from' => 'nullable|date_format:Y-m-d', 'to' => 'nullable|date_format:Y-m-d|after_or_equal:from']);
        $from = Carbon::parse($d['from'] ?? today()->subDays(6))->startOfDay();
        $to = Carbon::parse($d['to'] ?? today())->endOfDay();
        abort_if($from->diffInDays($to) > 366, 422, 'El período máximo es de 366 días.');
        $base = Sale::where('status', 'completed')->whereBetween('created_at', [$from, $to]);
        $today = Sale::where('status', 'completed')->whereDate('created_at', today());
        $days = (clone $base)->selectRaw('DATE(created_at) AS day, SUM(total_cents) AS total_cents, COUNT(*) AS count')->groupByRaw('DATE(created_at)')->orderBy('day')->get()->keyBy('day');
        $series = [];
        for ($date = $from->copy(); $date <= $to; $date->addDay()) {
            $day = $date->toDateString();
            $series[] = ['day' => $day, 'total_cents' => (int) ($days[$day]->total_cents ?? 0), 'count' => (int) ($days[$day]->count ?? 0)];
        }
        $top = DB::table('sale_items')->join('sales', 'sales.id', '=', 'sale_items.sale_id')->where('sales.status', 'completed')->whereBetween('sales.created_at', [$from, $to])->selectRaw('product_id, MAX(product_name) AS name, SUM(quantity) AS quantity, SUM(subtotal_cents) AS total_cents')->groupBy('product_id')->orderByDesc('quantity')->limit(5)->get();
        $alerts = $this->alerts();

        return ['from' => $from->toDateString(), 'to' => $to->toDateString(), 'today_cents' => (int) (clone $today)->sum('total_cents'), 'today_count' => (clone $today)->count(), 'period_cents' => (int) (clone $base)->sum('total_cents'), 'period_count' => (clone $base)->count(), 'product_count' => Product::where('active', true)->count(), 'low_count' => $alerts['low_stock']->count(), 'out_count' => $alerts['low_stock']->filter(fn ($p) => ! $p->available_stock)->count(), 'expiring_count' => $alerts['expiring']->count(), 'expired_count' => $alerts['expired']->count(), 'series' => $series, 'top_products' => $top, 'recent_sales' => Sale::with('user:id,name')->orderByDesc('id')->limit(5)->get(), 'as_of' => now()->toIso8601String()];
    }

    public function index(Request $r)
    {
        return $this->data($r);
    }

    public function csv(Request $r)
    {
        $d = $this->data($r);

        return response()->streamDownload(function () use ($d) {
            $f = fopen('php://output', 'w');
            fwrite($f, "\xEF\xBB\xBF");
            fputcsv($f, ['Fecha', 'Ventas confirmadas', 'Importe (PEN)'], ',', '"', '');
            foreach ($d['series'] as $row) {
                fputcsv($f, [$row['day'], $row['count'], number_format($row['total_cents'] / 100, 2, '.', '')], ',', '"', '');
            }fclose($f);
        }, 'nova-salud-reporte.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}

<?php

namespace App\Services;

use App\Models\Batch;
use App\Models\Product;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Envía una alerta a Telegram cuando el disponible de un producto llega a su mínimo.
 * Se ejecuta después de confirmar la transacción de inventario y nunca bloquea la operación.
 */
class LowStockNotifier
{
    /** @param array<int|string> $productIds */
    public function check(array $productIds): void
    {
        $ids = array_values(array_unique(array_map('intval', $productIds)));
        if ($ids === []) {
            return;
        }

        foreach (Product::whereIn('id', $ids)->get() as $product) {
            if (! $product->active) {
                continue;
            }

            $available = (int) Batch::where('product_id', $product->id)
                ->where('expires_at', '>=', today()->toDateString())
                ->sum('quantity');

            // Igual regla que el panel de alertas: disponible ≤ mínimo, incluidos los agotados.
            if ($available > $product->min_stock) {
                // Reposición: se rearma la alerta para el próximo cruce.
                Product::whereKey($product->id)->update(['low_stock_notified_at' => null]);

                continue;
            }

            // Reclamo atómico: solo una operación concurrente envía el aviso.
            $claimed = Product::whereKey($product->id)
                ->whereNull('low_stock_notified_at')
                ->update(['low_stock_notified_at' => now()]);

            if ($claimed && ! $this->send($product, $available)) {
                // Se libera para reintentar en la siguiente operación del producto.
                Product::whereKey($product->id)->update(['low_stock_notified_at' => null]);
            }
        }
    }

    private function send(Product $product, int $available): bool
    {
        $token = config('services.telegram.bot_token');
        $chatId = config('services.telegram.chat_id');

        if (! $token || ! $chatId) {
            Log::info('Alerta de stock omitida: Telegram no está configurado.', ['product_id' => $product->id]);

            return false;
        }

        try {
            Http::acceptJson()
                ->connectTimeout(3)
                ->timeout(5)
                ->post('https://api.telegram.org/bot'.$token.'/sendMessage', [
                    'chat_id' => $chatId,
                    'parse_mode' => 'HTML',
                    'text' => $this->message($product, $available),
                ])
                ->throw();

            return true;
        } catch (\Throwable $e) {
            // Solo se registra la clase de error: el mensaje puede contener la URL con el token.
            Log::warning('Alerta de stock no enviada.', ['product_id' => $product->id, 'error' => $e::class]);

            return false;
        }
    }

    /** Mensaje para personal de la botica: estado, unidades, mínimo, acción y hora local. */
    public function message(Product $product, int $available): string
    {
        $out = $available <= 0;
        $title = $out ? '🔴 Sin stock' : '🟠 Stock bajo';
        $action = $out ? 'Reponer hoy para no perder ventas.' : 'Conviene reponer pronto.';
        $units = $available === 1 ? 'unidad' : 'unidades';
        $time = now()->setTimezone('America/Lima')->format('d/m/Y H:i');

        return implode("\n", [
            "<b>{$title}</b> · Nova Salud",
            '',
            '<b>'.e($product->name).'</b>',
            'Código: '.e($product->code),
            "Quedan: <b>{$available} {$units}</b> (mínimo: {$product->min_stock})",
            '',
            $action,
            "🕒 {$time} (Lima)",
        ]);
    }
}

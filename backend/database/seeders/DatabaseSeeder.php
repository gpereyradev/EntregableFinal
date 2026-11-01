<?php

namespace Database\Seeders;

use App\Models\Batch;
use App\Models\Category;
use App\Models\Movement;
use App\Models\Product;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! config('app.demo')) {
            return;
        }
        $adminPassword = env('DEMO_ADMIN_PASSWORD');
        $sellerPassword = env('DEMO_SELLER_PASSWORD');
        if (! $adminPassword || ! $sellerPassword) {
            throw new \RuntimeException('Configura las dos contraseñas de demostración.');
        }
        DB::transaction(function () use ($adminPassword, $sellerPassword) {
            // Prevent concurrent boot seeders; never reset user changes on restart.
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('SELECT pg_advisory_xact_lock(5272026)');
            }
            if (User::exists()) {
                return;
            }
            $admin = User::create(['name' => 'Administrador Demo', 'email' => 'admin@novasalud.demo', 'password' => $adminPassword, 'role' => 'admin']);
            $seller = User::create(['name' => 'Vendedor Demo', 'email' => 'vendedor@novasalud.demo', 'password' => $sellerPassword, 'role' => 'seller']);
            $cats = [];
            foreach (['Analgésicos', 'Cuidado personal', 'Vitaminas', 'Digestivos', 'Primeros auxilios', 'Respiratorios'] as $name) {
                $cats[] = Category::create(['name' => $name]);
            }
            $rows = [['PAR-500', 'Paracetamol 500 mg', 0, 'Blíster · 10 tabletas', 350, 20, 180], ['IBU-400', 'Ibuprofeno 400 mg', 0, 'Blíster · 10 cápsulas', 650, 20, 95], ['ALC-070', 'Alcohol 70°', 4, 'Frasco · 250 ml', 780, 15, 65], ['VIT-C01', 'Vitamina C 1 g', 2, 'Tubo · 10 efervescentes', 1590, 10, 42], ['LOR-010', 'Loratadina 10 mg', 5, 'Blíster · 10 tabletas', 590, 15, 90], ['SAL-100', 'Sales de rehidratación', 3, 'Sobre · 20.5 g', 280, 20, 8], ['GAS-010', 'Gasas estériles', 4, 'Paquete · 10 unidades', 450, 20, 0], ['PRO-050', 'Protector solar FPS 50', 1, 'Tubo · 50 ml', 4290, 8, 23], ['OME-020', 'Omeprazol 20 mg', 3, 'Blíster · 10 cápsulas', 850, 15, 68], ['CEP-001', 'Cepillo dental suave', 1, 'Unidad', 690, 10, 35], ['MUL-060', 'Multivitamínico', 2, 'Frasco · 60 tabletas', 3490, 10, 7], ['TER-001', 'Termómetro digital', 4, 'Unidad', 1890, 6, 19], ['JAR-120', 'Jarabe de miel', 5, 'Frasco · 120 ml', 1650, 10, 32], ['VEN-005', 'Venda elástica 5 cm', 4, 'Rollo · 5 m', 590, 12, 48], ['SUF-030', 'Suero fisiológico', 4, 'Frasco · 100 ml', 620, 15, 39], ['CRE-100', 'Crema hidratante', 1, 'Tubo · 100 g', 2290, 8, 21]];
            $products = [];
            foreach ($rows as $i => $row) {
                [$code,$name,$c,$presentation,$price,$min,$stock] = $row;
                $p = Product::create(['code' => $code, 'name' => $name, 'category_id' => $cats[$c]->id, 'presentation' => $presentation, 'description' => 'Producto ficticio para la demostración académica.', 'price_cents' => $price, 'min_stock' => $min]);
                $products[] = $p;
                if ($stock) {
                    $b = Batch::create(['product_id' => $p->id, 'code' => 'DEMO-'.str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT), 'expires_at' => today()->addDays(in_array($i, [3, 8, 12]) ? 18 : 240 + $i)->toDateString(), 'quantity' => $stock]);
                    Movement::create(['batch_id' => $b->id, 'user_id' => $admin->id, 'type' => 'entry', 'quantity' => $stock, 'stock_after' => $stock, 'reason' => 'Carga inicial de demostración', 'created_at' => now()->subDays(10)]);
                }
            }
            $b = Batch::create(['product_id' => $products[0]->id, 'code' => 'DEMO-VENCIDO', 'expires_at' => today()->subDays(12)->toDateString(), 'quantity' => 12]);
            Movement::create(['batch_id' => $b->id, 'user_id' => $admin->id, 'type' => 'entry', 'quantity' => 12, 'stock_after' => 12, 'reason' => 'Lote vencido de demostración: no se vende', 'created_at' => now()->subDays(50)]);
            $service = app(InventoryService::class);
            for ($day = 6; $day >= 0; $day--) {
                for ($j = 0; $j < 3 + ($day % 3); $j++) {
                    $p = $products[($day + $j) % 5];
                    $result = $service->sell($j % 2 ? $seller : $admin, ['payment_method' => ['cash', 'card', 'transfer'][$j % 3], 'items' => [['product_id' => $p->id, 'quantity' => 1 + ($j % 3)]]]);
                    $id = $result['sale']['id'];
                    $at = now()->subDays($day)->setTime(9 + $j * 2, 15);
                    DB::table('sales')->where('id', $id)->update(['demo' => true, 'created_at' => $at, 'updated_at' => $at]);
                    DB::table('movements')->where('sale_id', $id)->update(['created_at' => $at]);
                }
            }
        });
    }
}

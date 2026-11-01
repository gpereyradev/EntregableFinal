<?php

// Run only against an isolated, already migrated testing database.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
use App\Models\Batch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

if (app()->environment() !== 'testing' || DB::getDriverName() !== 'pgsql') {
    throw new RuntimeException('Requires APP_ENV=testing and a dedicated PostgreSQL test branch.');
}
$tag = substr((string) Str::uuid(), 0, 8);
$category = Category::firstOrCreate(['name' => 'Concurrency tests']);
$p = Product::create(['code' => 'RACE-'.$tag, 'name' => 'Concurrent last unit test', 'category_id' => $category->id, 'presentation' => 'Test', 'price_cents' => 105, 'min_stock' => 1]);
$b = Batch::create(['product_id' => $p->id, 'code' => 'RACE', 'expires_at' => today()->addYear()->toDateString(), 'quantity' => 1]);
$users = [];
foreach ([1, 2] as $i) {
    $users[] = User::create(['name' => 'Race '.$i, 'email' => 'race-'.$tag.'-'.$i.'@test.invalid', 'password' => Str::random(32), 'role' => 'seller']);
}
$run = function (array $actors, string $key) use ($p) {
    $start = microtime(true) + .3;
    $pids = [];
    $files = [];
    DB::disconnect();
    foreach ($actors as $i => $actor) {
        $file = sys_get_temp_dir().'/nova-race-'.Str::uuid().'.json';
        $files[] = $file;
        $pid = pcntl_fork();
        if ($pid === -1) {
            throw new RuntimeException('fork failed');
        }if ($pid === 0) {
            DB::purge();
            while (microtime(true) < $start) {
                usleep(1000);
            }try {
                $s = app(InventoryService::class);
                $payload = ['payment_method' => 'cash', 'items' => [['product_id' => $p->id, 'quantity' => 1]]];
                $r = $s->once($actor, $key, $payload, fn () => $s->sell($actor, $payload));
                file_put_contents($file, json_encode(['status' => 'ok', 'sale_id' => $r['sale']['id']]));
            } catch (ValidationException $e) {
                file_put_contents($file, json_encode(['status' => 'stock_rejected']));
            } catch (Throwable $e) {
                file_put_contents($file, json_encode(['status' => 'error', 'type' => get_class($e)]));
            }exit(0);
        } $pids[] = $pid;
    }foreach ($pids as $pid) {
        pcntl_waitpid($pid, $status);
    }DB::purge();
    $results = [];
    foreach ($files as $f) {
        $results[] = json_decode(file_get_contents($f), true);
        unlink($f);
    }

return $results;
};
$before = Sale::count();
$out = $run($users, (string) Str::uuid());
$statuses = array_column($out, 'status');
sort($statuses);
assert($statuses === ['ok', 'stock_rejected']);
assert($b->fresh()->quantity === 0);
assert(Sale::count() === $before + 1);
if ($statuses !== ['ok', 'stock_rejected'] || $b->fresh()->quantity !== 0 || Sale::count() !== $before + 1) {
    throw new RuntimeException('Last-unit race failed: '.json_encode($out));
}
echo "PASS: two sellers, last unit -> one sale, one stock rejection, stock=0\n";
$b->update(['quantity' => 1]);
$key = (string) Str::uuid();
$before = Sale::count();
$out = $run([$users[0], $users[0]], $key);
if (array_column($out, 'status') !== ['ok', 'ok'] || count(array_unique(array_column($out, 'sale_id'))) !== 1 || Sale::count() !== $before + 1 || $b->fresh()->quantity !== 0) {
    throw new RuntimeException('Concurrent retry failed');
}
echo "PASS: simultaneous duplicate key -> same sale, one deduction\n";

<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class SaleItem extends Model { protected $fillable=['sale_id','product_id','product_name','product_code','quantity','unit_price_cents','subtotal_cents']; public function allocations(){return $this->hasMany(Allocation::class);} public $timestamps=false; }

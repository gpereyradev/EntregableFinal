<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Sale extends Model { protected $fillable=['user_id','payment_method','total_cents','status','demo','cancelled_at','cancelled_by','cancel_reason','created_at']; public function items(){return $this->hasMany(SaleItem::class);} public function user(){return $this->belongsTo(User::class);} public function canceller(){return $this->belongsTo(User::class,'cancelled_by');} protected function casts():array{return ['total_cents'=>'integer','demo'=>'boolean'];} }

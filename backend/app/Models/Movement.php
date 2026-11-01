<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Movement extends Model { protected $fillable=['batch_id','user_id','sale_id','type','quantity','stock_after','reason','created_at']; public function batch(){return $this->belongsTo(Batch::class);} public function user(){return $this->belongsTo(User::class);} public $timestamps=false; }

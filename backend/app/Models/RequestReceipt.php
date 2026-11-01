<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class RequestReceipt extends Model { protected $fillable=['user_id','key','hash','response'];  protected function casts():array{return ['response'=>'array'];} }

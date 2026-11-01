<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Audit extends Model { protected $fillable=['user_id','action','subject','metadata'];  public $timestamps=false; protected function casts():array{return ['metadata'=>'array'];} }

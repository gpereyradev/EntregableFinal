<?php
namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
class User extends Authenticatable {
 use HasFactory;
 protected $attributes=['active'=>true,'role'=>'seller'];
 protected $fillable=['name','email','password','role','active'];
 protected $hidden=['password','remember_token'];
 protected function casts():array{return ['password'=>'hashed','active'=>'boolean'];}
}

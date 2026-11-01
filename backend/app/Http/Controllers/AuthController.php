<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{Auth,Hash};
use App\Models\Audit;
class AuthController extends Controller {
 public function session(Request $r){return response()->json(['user'=>$r->user()?->active?$r->user():null,'csrf_token'=>csrf_token(),'demo'=>config('app.demo')]);}
 public function login(Request $r){$d=$r->validate(['email'=>'required|email|max:255','password'=>'required|string|max:255']);if(!Auth::attempt([...$d,'active'=>true]))return response()->json(['message'=>'Correo o contraseña incorrectos.'],422);$r->session()->regenerate();Audit::create(['user_id'=>$r->user()->id,'action'=>'auth.login','subject'=>'user:'.$r->user()->id]);return ['user'=>$r->user(),'csrf_token'=>csrf_token()];}
 public function logout(Request $r){Auth::logout();$r->session()->invalidate();$r->session()->regenerateToken();return ['message'=>'Sesión cerrada.','csrf_token'=>csrf_token()];}
}

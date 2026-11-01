<?php
namespace App\Http\Controllers;
use App\Models\{User,Audit};
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
class UserController extends Controller {
 public function index(){return User::orderBy('name')->get();}
 public function store(Request $r){$d=$r->validate(['name'=>'required|string|max:100','email'=>'required|email|max:255|unique:users','password'=>'required|string|min:12|max:128','role'=>'required|in:admin,seller','active'=>'required|boolean']);return DB::transaction(function()use($r,$d){$u=User::create($d);Audit::create(['user_id'=>$r->user()->id,'action'=>'user.created','subject'=>'user:'.$u->id]);return response()->json($u,201);});}
 public function update(Request $r,User $user){$d=$r->validate(['name'=>'required|string|max:100','email'=>['required','email','max:255',Rule::unique('users')->ignore($user->id)],'password'=>'nullable|string|min:12|max:128','role'=>'required|in:admin,seller','active'=>'required|boolean']);abort_if($r->user()->id===$user->id&&(!$d['active']||$d['role']!=='admin'),422,'No puedes quitarte el acceso de administrador.');if(empty($d['password']))unset($d['password']);return DB::transaction(function()use($r,$user,$d){$u=User::whereKey($user->id)->lockForUpdate()->firstOrFail();$u->update($d);Audit::create(['user_id'=>$r->user()->id,'action'=>'user.updated','subject'=>'user:'.$u->id]);return $u;});}
 public function audit(){return Audit::with([])->orderByDesc('id')->paginate(30);}
}

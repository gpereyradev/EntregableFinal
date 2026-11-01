<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{AuthController,ProductController,OperationController,ReportController,UserController};
Route::prefix('api')->group(function(){
 Route::get('session',[AuthController::class,'session']);
 Route::post('login',[AuthController::class,'login'])->middleware('throttle:6,1');
 Route::middleware('session.api')->group(function(){
  Route::post('logout',[AuthController::class,'logout']);
  Route::get('categories',[ProductController::class,'categories']);
  Route::get('products',[ProductController::class,'index']);Route::get('products/{product}',[ProductController::class,'show']);
  Route::get('sales',[OperationController::class,'sales']);Route::get('sales/{sale}',[OperationController::class,'show']);Route::post('sales',[OperationController::class,'sell'])->middleware('throttle:60,1');
  Route::middleware('admin')->group(function(){
   Route::post('products',[ProductController::class,'store']);Route::put('products/{product}',[ProductController::class,'update']);Route::post('categories',[ProductController::class,'category']);
   Route::post('stock',[OperationController::class,'stock'])->middleware('throttle:60,1');Route::get('movements',[OperationController::class,'movements']);Route::post('sales/{sale}/cancel',[OperationController::class,'cancel']);
   Route::get('alerts',[ReportController::class,'alerts']);Route::get('reports',[ReportController::class,'index']);Route::get('reports/export',[ReportController::class,'csv']);
   Route::get('users',[UserController::class,'index']);Route::post('users',[UserController::class,'store']);Route::put('users/{user}',[UserController::class,'update']);Route::get('audits',[UserController::class,'audit']);
  });
 });
});
Route::get('/{path?}',function(){return response()->file(public_path('app/index.html'));})->where('path','^(?!api(?:/|$)|up$).*');

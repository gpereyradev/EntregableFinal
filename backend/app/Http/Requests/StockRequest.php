<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
class StockRequest extends FormRequest {
 public function authorize():bool{return $this->user()->role==='admin';}
 public function rules():array{return ['product_id'=>'required|integer|exists:products,id','type'=>'required|in:entry,adjustment','batch_id'=>'nullable|required_if:type,adjustment|integer|exists:batches,id','code'=>'nullable|required_if:type,entry|string|max:60','expires_at'=>'nullable|required_if:type,entry|date_format:Y-m-d|after_or_equal:today','quantity'=>'required|integer|not_in:0|min:-100000|max:100000','reason'=>'required|string|min:5|max:255'];}
}

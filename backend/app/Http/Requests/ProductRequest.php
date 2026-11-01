<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return ['code' => ['required', 'string', 'max:40', Rule::unique('products')->ignore($this->route('product'))], 'name' => 'required|string|max:160', 'category_id' => 'required|integer|exists:categories,id', 'presentation' => 'required|string|max:100', 'description' => 'nullable|string|max:2000', 'price_cents' => 'required|integer|min:0|max:10000000', 'min_stock' => 'required|integer|min:0|max:100000', 'active' => 'sometimes|boolean'];
    }
}

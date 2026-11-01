<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = ['code', 'name', 'category_id', 'presentation', 'description', 'price_cents', 'min_stock', 'active'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function batches()
    {
        return $this->hasMany(Batch::class);
    }

    protected function casts(): array
    {
        return ['active' => 'boolean', 'price_cents' => 'integer', 'min_stock' => 'integer'];
    }
}

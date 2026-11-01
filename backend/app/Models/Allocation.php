<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Allocation extends Model
{
    protected $fillable = ['sale_item_id', 'batch_id', 'quantity'];

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public $timestamps = false;
}

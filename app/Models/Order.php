<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;
    
    protected $guarded = [];

    public function scopeSearch($query, $value) {
        $query->where('name', 'like', "%{$value}%")
            ->orWhere('phone_number', 'like', "%{$value}%")
            ->orWhere('email_address', 'like', "%{$value}%")
            ->orWhere('mpesa_reference', 'like', "%{$value}%");
    }

    public function carts()
    {
        return $this->hasMany(Cart::class, 'order_id', 'id')
            ->join('books', 'books.id', '=', 'carts.book_id');
    }
}

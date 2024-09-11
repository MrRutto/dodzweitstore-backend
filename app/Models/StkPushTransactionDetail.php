<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StkPushTransactionDetail extends Model
{
    use HasFactory;
    
    protected $table = 'stk_push_transaction_details';

    protected $fillable = ['amount','phone_number','business_code','receiptNumber','responseCode','MerchantRequestID','CheckoutRequestID','ResponseDescription','errorMessage','status'];
}

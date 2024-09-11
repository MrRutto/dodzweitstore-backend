<?php

namespace App\Http\Controllers;

use App\Http\Helpers\Mpesa;
use App\Mail\OrderReceived;
use App\Models\Book;
use App\Models\Cart;
use App\Models\Delivery;
use App\Models\Order;
use Exception;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function createOrder(Request $request) 
    {
        try {
            $request->validate([
                'firstName' => 'required|string',
                'lastName' => 'required|string',
                'phoneNumber' => 'required',
                'emailAddress' => 'required|email',
                'mpesaReference' => 'nullable|string',
                'deliveryType' => 'required|in:pickup,nairobi,kenya',
                'country' => 'nullable|string',
                'county' => 'nullable|string',
                'city' => 'nullable|string',
                'buildingDetails' => 'nullable|string',
                'deliveryInstructions' => 'nullable|string',
                'books' => 'required|array',
                'books.*.id' => 'required|string',
                'books.*.quantity' => 'required|numeric|min:1',
            ]);
        } catch (ValidationException $e) {
            return response()->json([ 'message' => $e->getMessage() ], 400);
        }

        // Parse through book catalogue and get price
        $price = 0;
        $quantities = 0;
        $books = $request->books;

        foreach ($books as $book) {
            $price += ($book['quantity'] * 1000);
        }

        try {
            DB::beginTransaction();

            // Store Order    
            $order = new Order();
            $order->uuid = Str::uuid();
            $order->name = $request->firstName . ' ' . $request->lastName;
            $order->phone_number = $request->phoneNumber;
            $order->email_address = $request->emailAddress;
            $order->price = $price;
            $order->save();

            if ($request->deliveryType != 'pickup') {
                $delivery = new Delivery();
                $delivery->order_id = $order->id;
                $delivery->country = $request->country;
                $delivery->county = $request->county;
                $delivery->city = $request->city;
                $delivery->building_details = $request->buildingDetails;
                $delivery->delivery_instructions = $request->deliveryInstructions;
                $delivery->save();
            }

            // Store Bbooks
            foreach ($books as $book) {
                $bookDetails = Book::where('uuid', $book['id'])->first();

                $cart = new Cart();
                $cart->book_id = $bookDetails->id;
                $cart->quantity = $book['quantity'];
                $cart->order_id = $order->id;
                $cart->save();
            }
    
            // Send email
            // Mail::to($order->email_address)->send(new OrderReceived($order));

            DB::commit();
        }  catch(Exception $err) {
            DB::rollback();
            return response()->json([ 'message' => $err->getMessage() ], 500);
        }

        return response()->json([
            'message' => 'Successfully processed',
            'reference' => $order->uuid
        ]);
    }

    public function getOrderStatus(String $id)
    {
        $order = Order::where('uuid', $id)
            ->first();

        if(!isset($order)) return response()->json([ 'message' => 'Order Cannot be proccessed' ], 409);
        
        if ($order->status == 'processing') return response()->json([ 'message' => 'success', 'status' => 'success']);

        if ($order->status != 'placed') return response()->json([ 'message' => 'success', 'status' => 'invalid']);

        return response()->json([ 'message' => 'success', 'status' => 'processing', 'order' => $order->price ]);
    }
}

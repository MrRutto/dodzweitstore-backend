<?php

namespace App\Http\Controllers;

use App\Http\Helpers\Mpesa;
use App\Http\Resources\OrderCollection;
use App\Mail\OrderReceived;
use App\Models\Book;
use App\Models\Cart;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrderHistory;
use Exception;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function fetch()
    {
        return Inertia::render('Order/List',[
            'orders' => new OrderCollection(
                Order::orderBy('id','desc')->paginate()

            )
        ]);
    }

    public function orderDetails(Order $order)
    {
        $cart = Cart::leftJoin('books', 'books.id', '=', 'carts.book_id')
            ->where('order_id', $order->id)
            ->select(
                'carts.*', 
                'books.title', 
                'books.title as book_id',
                'books.uuid as book_uuid',
                'books.imageUrl',
                'books.price',
            )->get();

        $delivery = Delivery::where('order_id', $order->id)->first();
        $history = OrderHistory::where('order_id', $order->id)->orderBy('id','desc')->get();

        return Inertia::render('Order/Details',[
            'order' => $order,
            'cart' => $cart,
            'delivery' => $delivery,
            'history' => $history
        ]);
    }

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
            $order->delivery_type = $request->deliveryType;

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
    
            $history = new OrderHistory();
            $history->order_id = $order->id;
            $history->action_by = 'Customer';
            $history->action = 'Customer created a new order';
            $history->save();

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

        return response()->json([ 'message' => 'success', 'status' => 'processing', 'order' => ($order->price + $this->ValidateDeliveryPrice($order->delivery_type)) ]);
    }

    private function ValidateDeliveryPrice($location) 
    {
        switch($location)
        {
            case 'pickup': return 0;
            case 'nairobi': return 500;
            default: return 1000;
        }
    }

    public function upateOrderStatus(Request $request)
    {        
        try {
            $request->validate([
                'id' => 'integer',
                'status' => 'string'
            ]);

        } catch (ValidationException $e) {
            return redirect()->back()->withErrors('Cannot process order.');
        }

        $order = Order::where('id', $request->id)
            ->first();

        if (!isset($order)) return redirect()->back()->withErrors('Cannot process order.');

        $order->status = $request->status;
        $order->save();

        $history = new OrderHistory();
        $history->order_id = $request->id;
        $history->user_id = Auth::user()->id;
        $history->action_by = Auth::user()->name;
        $history->action = Auth::user()->name . ' updated the order status to ' . strtoupper($request->status);
        $history->save();

        return redirect()->back();
    }

    public function reconcilePayment(Request $request)
    {        
        try {
            $request->validate([
                'id' => 'integer',
                'paymentMethod' => 'string',
                'mpesaRef' => 'nullable|string'
            ]);
        } catch (ValidationException $e) {
            return redirect()->back($e->getMessage());
        }

        $order = Order::where('id', $request->id)
            ->first();

        if (!isset($order)) return redirect()->back()->withErrors('Cannot process order.');

        $order->is_paid = true;
        $order->payment_type = $request->paymentMethod;
        $order->mpesa_reference = $request->mpesaRef;
        if($order->status == 'placed') $order->status = 'processing';

        $order->save();

        $history = new OrderHistory();
        $history->order_id = $request->id;
        $history->user_id = Auth::user()->id;
        $history->action_by = Auth::user()->name;
        $history->action = Auth::user()->name . ' updated the order with payment method ' . $request->paymentMethod;
        $history->save();

        return redirect()->back();
    }

}

<?php

namespace App\Http\Controllers;

use App\Http\Helpers\Mpesa;
use App\Models\ApiResult;
use App\Models\Order;
use App\Models\StkPushTransactionDetail;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function triggerSTKPayment(Request $request)
    {
        $order = Order::where('uuid', $request->reference)
            ->where('status', 'placed')
            ->first();

        if(!isset($order)) return response()->json([ 'message' => 'Order Cannot be proccessed'],409);

        $phone_number = $request->phoneNumber;
        $billref = $request->reference;
        $amount = 1;

        try {
            $triggerPayment = Mpesa::triggerStkPush($phone_number, $amount, $billref, $order->id);

            Log::info("[Payment][STK Transaction]billRef: $billref | repsonse".json_encode($triggerPayment));

            if (isset($triggerPayment->errorMessage)) {
                $message = "something wrong happened sending stk push";
                $response_code = 500;
            }

            return response()->json([
                'message' => 'Successfully processed'
            ]);
        } catch(Exception $err) {
            return response()->json([ 'message' => $err->getMessage() ], 500);
        }
    }

    public function validateMpesaTransaction(Request $request)
    {
        try {
            $triggerPayment = Mpesa::checkTransactionStatus($request->TransactionID);

            // Log::info("[Payment][STK Transaction]billRef: $billref | repsonse".json_encode($triggerPayment));

            if (isset($triggerPayment->errorMessage)) {
                $message = "something wrong happened sending stk push";
                $response_code = 500;
            }

            return response()->json([
                'message' => 'Successfully processed'
            ]);
        } catch(Exception $err) {
            return response()->json([ 'message' => $err->getMessage() ], 500);
        }
    }

    public function handleMPESACallback(Request $request)
    {
        Log::debug($request->all());

        return 'success';
    }

    public function handleSTKCallback(Request $request)
    {
        ApiResult::create([
            'response_type' => 'stk_callback',
            'response' => $request
        ]);

        $body = $request->Body['stkCallback'];

        $detail = StkPushTransactionDetail::where('CheckoutRequestID', $body['CheckoutRequestID'])
            ->first();

        if ($body['ResultCode'] != 0) {
            $detail->responseCode = $body['ResultCode'];
            $detail->errorMessage = $body['ResultDesc'];
            $detail->save();
            return 'OK';
        }

        $detail->receiptNumber = $body['CallbackMetadata']['Item'][1]['Value'];
        $detail->save();

        $order = Order::find($detail->order_id);
        $order->status = "processing";
        $order->mpesa_reference = $body['CallbackMetadata']['Item'][1]['Value'];
        $order->save();

        return 'OK';
    }

    public function validatePayment(String $id)
    {
        $detail = StkPushTransactionDetail::where('orders.uuid', $id)
            ->leftJoin('orders', 'orders.id', '=', 'stk_push_transaction_details.order_id')
            ->select('stk_push_transaction_details.*')
            ->orderBy('stk_push_transaction_details.id', 'desc')
            ->first();

        

        if (isset($detail->receiptNumber)) {
            return response()->json([
                'message' => 'success',
                'status' => 'processed'
            ]);
        }

        if ($detail->responseCode > 0) {
            return response()->json([
                'message' => 'success',
                'status' => 'error'
            ]);
        }

        return response()->json([
            'message' => 'success',
            'status' => 'processing'
        ]);
    }
}

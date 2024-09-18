<?php


namespace App\Http\Helpers;

use App\Models\StkPushTransactionDetail;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Log;

class Mpesa
{
  /**
   * Generate Token
   */
  public static function generateToken()
  {
    try {
      $mpesaBaseUrl = env('MPESA_BASE_URL');
      $credentials = base64_encode(env('MPESA_CONSUMER_KEY') . ':' . env('MPESA_CONSUMER_SECRET'));
      
      $ch = curl_init($mpesaBaseUrl . 'oauth/v1/generate?grant_type=client_credentials');
      curl_setopt($ch, CURLOPT_HTTPHEADER, array('Authorization: Basic ' . $credentials));
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
      $response = curl_exec($ch);
      
      curl_close($ch);
      return $response;
    } catch(Exception $error) {
      Log::error($error);
    }
  }

  /**
   * Send MPesa POST transaction
   */
  public static function post($endUrl, $requestBody)
  {
    try {
      $mpesaBaseUrl = env('MPESA_BASE_URL');
  
      $token = self::generateToken();
  
      $data = json_decode($token)->access_token;
      $data_string = json_encode($requestBody);
  
      $curl = curl_init($mpesaBaseUrl . $endUrl);
      curl_setopt($curl, CURLOPT_HTTPHEADER, array('Content-Type:application/json', 'Authorization:Bearer ' . $data));
      curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
      curl_setopt($curl, CURLOPT_POST, true);
      curl_setopt($curl, CURLOPT_POSTFIELDS, $data_string);
      curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
      curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, FALSE);

      $response = curl_exec($curl);
      $err = curl_error($curl);
      curl_close($curl);
  
      if ($err) {
        echo "cURL Error #:" . $err;
      } else {
        return json_decode($response);
      }
    } catch(Exception $error) {
      Log::error($error);
    }
  }

  /**
   * Trigger STK Push
   */
  public static function triggerStkPush($phone, $amount, $billRef, $order_id)
  {
    $businessShortCode = env('MPESA_PAYBILL');
    $MPESA_PASSKEY = env('MPESA_PASSKEY');
    $time = Carbon::now()->format('YmdHis');
    $endUrl = 'mpesa/stkpush/v1/processrequest';
    $description = 'purchase';

    Log::debug($MPESA_PASSKEY);
    
    $requestBody = [
      'BusinessShortCode' => $businessShortCode,
      'Password' => base64_encode($businessShortCode . $MPESA_PASSKEY . $time),
      'Timestamp' => $time,
      'TransactionType' => 'CustomerPayBillOnline',
      'Amount' => $amount,
      'PartyA' => $phone,
      'PartyB' => $businessShortCode,
      'PhoneNumber' => $phone,
      'CallBackURL' =>  env('MPESA_CALLBACK_URL'),
      'AccountReference' => $billRef,
      'TransactionDesc' => $description
    ];

    $response = self::post($endUrl, $requestBody);

    if (isset($response->ResponseCode) && $response->ResponseCode == 0) {
      $stk_transaction = new StkPushTransactionDetail();
      $stk_transaction->order_id = $order_id;
      $stk_transaction->amount = $amount;
      $stk_transaction->phone_number = $phone;
      $stk_transaction->business_code = $businessShortCode;
      $stk_transaction->responseCode = $response->ResponseCode;
      $stk_transaction->MerchantRequestID = $response->MerchantRequestID;
      $stk_transaction->CheckoutRequestID = $response->CheckoutRequestID;
      $stk_transaction->ResponseDescription = $response->ResponseDescription;
      $stk_transaction->save();
    } else {
      $stk_transaction = new StkPushTransactionDetail();
      $stk_transaction->order_id = $order_id;
      $stk_transaction->amount = $amount;
      $stk_transaction->phone_number = $phone;
      $stk_transaction->business_code = $businessShortCode;
      $stk_transaction->errorMessage = $response->errorMessage;
      $stk_transaction->save();
    }
    return $response;
  }

  public static function checkTransactionStatus($TransactionID)
  {
    $businessShortCode = env('MPESA_PAYBILL');
    $endUrl = 'mpesa/transactionstatus/v1/query';
    $Initiator = "mrutto";
    $SecurityCredential = "i28zPUmQ3bdHP9QopOKul9VR49GP3COGaxcaY38c0XTRMG+rKybce04mN+IijSq1dZGotfca1uNZm9g9QAEm321ZKwwAmBjTtXm/YTKedRfziw++rIsamSk8GIjFDJtBsRRJzkYzEVLVBONPrXRUGfCBt5u7e9SbssjNzo4roDELgttWKTIa9oCb4ekGLAuEiUpgDMiEohIFCxUy4kwBy55DMKarz2lJ+saFv30cu+d6rI1h5BHCWLbPMQgK+Rud5TKBNZ+yBBxJwPWCUJCRIEuGcp9CVn/7GH02jQyEcoqmWLGqq5iAG4wqGadmnJgJkAZ9XKQbe0PkTBDtoJUFMg==";
    $ResultURL = getenv('MPESA_CALLBACK_URL');
    $QueueTimeOutURL = getenv('MPESA_CALLBACK_URL');

    $requestBody = [
      'Initiator' => $Initiator,
      'SecurityCredential' => $SecurityCredential,
      'CommandID' => 'TransactionStatusQuery',
      'TransactionID' => $TransactionID,
      'PartyA' => $businessShortCode,
      'IdentifierType' => 4,
      'ResultURL' => $ResultURL,
      'QueueTimeOutURL' => $QueueTimeOutURL,
      'Remarks' => 'OK',
      'Occassion' => 'OK'
    ];

    $response = self::post($endUrl, $requestBody);
    Log::debug(json_encode($response));
  }
}

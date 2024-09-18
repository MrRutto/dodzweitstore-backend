<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function fetch()
    {
        $orders = Order::all();

        $totalOrders = $orders->count();
        $ordersUnprocessed = $orders->where('status','placed')->count();
        $ordersCompleted = $orders->where('status','delivered')->count();
        $incomeGenerated = $orders->whereNotIn('status',['placed'])->sum('price');

        $latestOrders = Order::orderBy('id', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('Dashboard',[
            'summary' => [
                'totalOrders' => $totalOrders,
                'ordersUnprocessed' => $ordersUnprocessed,
                'ordersCompleted' => $ordersCompleted,
                'incomeGenerated' => $incomeGenerated
            ],
            'orders' => $latestOrders
        ]);
    }
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';
import { BookCopy, BookDashed, BookOpenCheck, DollarSign } from 'lucide-react';
import dayjs from "dayjs";

export default function Dashboard({ auth, summary, orders }: PageProps<{ mustVerifyEmail: boolean, summary: any, orders: any }>) {
    const numberWithCommas = (x: number) => {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Dashboard</h2>}
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className='mx-auto sm:px-6 lg:px-8'>
                    <div className='mb-6 flex gap-4'>
                        <div className='flex-1 py-4 px-8 bg-white overflow-hidden shadow-sm sm:rounded-lg flex items-center gap-8'>
                            <div className='rounded flex justify-center items-center bg-[#ff7603] h-12 w-12'>
                                <BookCopy size={20} className="text-white" />
                            </div>
                            <div className='flex-1'>
                                <h3 className="font-medium text-gray-600">Total Orders</h3>
                                <p className='ml-2 text-2xl font-semibold'>{summary.totalOrders}</p>
                            </div>
                        </div>
                        <div className='flex-1 py-4 px-8 bg-white overflow-hidden shadow-sm sm:rounded-lg flex items-center gap-8'>
                            <div className='rounded flex justify-center items-center bg-[#ff7603] h-12 w-12'>
                                <BookDashed size={20} className="text-white" />
                            </div>
                            <div className='flex-1'>
                                <h3 className="font-medium text-gray-600">Total Unprocessed Orders</h3>
                                <p className='ml-2 text-2xl font-semibold'>{summary.ordersUnprocessed}</p>
                            </div>
                        </div>
                        <div className='flex-1 py-4 px-8 bg-white overflow-hidden shadow-sm sm:rounded-lg flex items-center gap-8'>
                            <div className='rounded flex justify-center items-center bg-[#ff7603] h-12 w-12'>
                                <BookOpenCheck size={20} className="text-white" />
                            </div>
                            <div className='flex-1'>
                                <h3 className="font-medium text-gray-600">Total Orders Completed</h3>
                                <p className='ml-2 text-2xl font-semibold'>{summary.ordersCompleted}</p>
                            </div>
                        </div>
                        <div className='flex-1 py-4 px-8 bg-white overflow-hidden shadow-sm sm:rounded-lg flex items-center gap-8'>
                            <div className='rounded flex justify-center items-center bg-[#ff7603] h-12 w-12'>
                                <DollarSign size={20} className="text-white" />
                            </div>
                            <div className='flex-1'>
                                <h3 className="font-medium text-gray-600">Income Generated</h3>
                                <p className='ml-2 text-2xl font-semibold'>KES {numberWithCommas(summary.incomeGenerated)}</p>
                            </div>
                        </div>
                    </div>
                    <div className='flex'>
                        <div className="w-1/3 p-4 sm:p-8 bg-white shadow sm:rounded-lg mb-6">
                            <h3 className="text-lg font-semiBold text-gray-900 mb-4">
                                Order Summary
                            </h3>
                            <div className=''>
                            { orders.length <= 0 ? <p className="">Nothing to display</p> :
                                <>
                                { orders.map((order: any) => (
                                    <Link className=''
                                        href={route('order.details', order?.id)}>
                                        <div className='py-2 border-b hover:bg-gray-50'>
                                            <div className='flex justify-between mb-1'>
                                                <p className='text font-medium'>{order.name}</p>
                                                <p className='capitalize'>{order.status}</p>
                                            </div>
                                            <div className='flex justify-between'>
                                                <p className='text-gray-600 text-sm'>KES {numberWithCommas(order.price)}</p>
                                                <p className='text-gray-600 text-sm'>{dayjs(order.created_at).format("MMM D, YYYY h:mm A")}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                </>
                            }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

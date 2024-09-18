import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import Table from '@/Components/Table/Table';
import Dropdown from '@/Components/Dropdown';
import Pagination from '@/Components/Pagination/Pagination';
import { EllipsisVertical, Eye } from 'lucide-react';
import { Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import Checkbox from '@/Components/Checkbox';
import { FC } from 'react';

type Status = 'rejected' | 'processing' | 'dispatched' | 'delivered' | string;

interface StatusStyle {
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const statusStyles: Record<Status, StatusStyle> = {
  rejected: { bgColor: 'bg-red-100', textColor: 'text-red-700', borderColor: 'border-red-500' },
  processing: { bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', borderColor: 'border-yellow-500' },
  dispatched: { bgColor: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-500' },
  delivered: { bgColor: 'bg-green-100', textColor: 'text-green-700', borderColor: 'border-green-500' },
  default: { bgColor: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-500' },
};

interface StatusBadgeProps {
  status: Status;
}

export default function Order({ auth, orders }: PageProps<{ mustVerifyEmail: boolean, orders: any }>) {
  const { data, meta: { links }} = orders;

  const numberWithCommas = (x: number) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const renderStatusPill = (status: any): JSX.Element => {
    switch (status) {
      case 'rejected':
        return (<div className='p-2 bg-red-200 text-center rounded-2xl'>
          <p className='capitalize text-red-700 font-medium text-sm'>{status}</p>
        </div>);
      case 'processing':
        return (<div className='p-2 bg-yellow-200 text-center rounded-2xl'>
          <p className='capitalize text-yellow-700 font-medium text-sm'>{status}</p>
        </div>);
      case 'dispatched':
        return (<div className='p-2 bg-blue-200 text-center rounded-2xl'>
          <p className='capitalize text-blue-700 font-medium text-sm'>{status}</p>
        </div>);
      case 'delivered':
        return (<div className='p-2 bg-green-200 text-center rounded-2xl'>
          <p className='capitalize text-green-700 font-medium text-sm'>{status}</p>
        </div>);
      default:
        return (<div className='p-2 bg-gray-200 text-center rounded-2xl'>
          <p className='capitalize text-gray-700 font-medium text-sm'>{status}</p>
        </div>);
    }
  }

  const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
    const { bgColor, textColor, borderColor } = statusStyles[status] || statusStyles.default;
  
    return (
      <div className={`border ${borderColor} py-1 px-2 ${bgColor} text-center rounded-xl`}>
        <p className={`capitalize ${textColor} font-medium text-sm`}>{status}</p>
      </div>
    );
  };
  

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Orders</h2>}
      >
      <Head title="Orders" />
      <div className="py-12 text-gray-900">
        <div className="mx-auto sm:px-6 lg:px-8">
          <Table
            columns={[
              {
                label: 'Name',
                name: 'name',
                renderCell: (row: any) => (
                  <p className='font-medium'>{ row.name }</p>
                )
              },
              { label: 'Email Address', name: 'email_address'},
              { label: 'Phone Number', name: 'phone_number' },
              {
                label: 'Order Status',
                name: 'status',
                renderCell: (row: any) => (
                  <StatusBadge status={row.status} />
                )
              },
              {
                label: 'Price',
                name: 'price',
                renderCell: (row: any) => (
                  <p className='font-medium'>
                    KES { numberWithCommas(row.price) }
                  </p>
                )
              },
              { label: 'Payment Type', name: 'payment_type' },
              {
                label: 'Created At',
                name: 'created_at',
                renderCell: (row: any) => (
                  <p className=''>
                    { dayjs(row.created_at).format('MMM D, YYYY h:mm A') }
                  </p>
                )
              },
              {
                label: 'Actions',
                name: 'actions',
                renderCell: (row: any) => (
                  <div className=''>
                    <Link
                      href={route('order.details', row?.id)}
                      className=" p-2 flex items-center">
                      <Eye size={20} className="text-gray-800 ml-4" />
                    </Link>
                  </div>
                )
              },
            ]}
            rows={data}
            getRowDetailsUrl={(row:any) => route('order.details', row?.id)}
          />
          <Pagination links={links} />
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
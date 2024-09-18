import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { PageProps } from "@/types";
import Table from '@/Components/Table/Table';
import dayjs from 'dayjs';
import { FormEventHandler, useEffect, useState } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import Loader from '@/Components/Loader';
import Swal from 'sweetalert2';

export default function UsersList({ auth, errors, users }: PageProps<{ mustVerifyEmail: boolean, users: any, errors: any }>) {
  const { meta: { links }} = users;
  const [loading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, setData, reset,post, patch, processing, recentlySuccessful } = useForm({
    name: '',
    email: '',
    password: ''
  });

  const closeModal = () => {
    setIsModalOpen(false);
    reset();
  };

  const openModal = () => {
    setIsModalOpen(true);
  }

  const processCreateUser: FormEventHandler = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await router.post('/users/create', data);
    } catch (error) {
      console.log(error)
      Swal.fire({
        title: "User Creation",
        text: "action was unsuccessful. Please try again later.",
        icon: "error",
        showCancelButton: false,
        confirmButtonColor: "#ff7603",
      });
    } finally {
      setIsLoading(false);
      closeModal();
    }
  }

  useEffect(() => {
    if (Object.values(errors).length < 1) return;

    Swal.fire({
      title: "User Creation",
      text: errors[0] ?? "Action was unsuccessful. Please try again later.",
      icon: "error",
      showCancelButton: false,
      confirmButtonColor: "#ff7603",
    });
  },[errors])

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">User List</h2>}
      >
      <Head title="User List" />
      <Loader isLoading={loading} />

      <div className="py-12 text-gray-900">
        <div className="mx-auto sm:px-6 lg:px-8">
          <div className='flex justify-end'>
            <button className='float flex  items-center justify-center px-4 py-2 mb-4 bg-white text-sm font-medium border border-orange-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500'
              onClick={openModal}>
              Add new user
            </button>
          </div>
          <Table
            columns={[
              {
                label: 'Name',
                name: 'name',
                renderCell: (row: any) => (
                  <p className='font-medium'>{ row.name }</p>
                )
              },
              { label: 'Email Address', name: 'email'},
              {
                label: 'Created At',
                name: 'created_at',
                renderCell: (row: any) => (
                  <p className=''>
                    { dayjs(row.created_at).format('MMM D, YYYY h:mm A') }
                  </p>
                )
              },
            ]}
            rows={users.data} />
        </div>
      </div>
      <Modal show={isModalOpen} onClose={closeModal}>
        <form onSubmit={processCreateUser} className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New User</h2>
          <div className="mb-4">
            <InputLabel htmlFor="name" value="User Name" />
            <TextInput
              id="name"
              name="name"
              value={data.name}
              className="mt-1 block w-full"
              autoComplete="name"
              isFocused={true}
              onChange={(e) => setData('name', e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <InputLabel htmlFor="email" value="Email Address" />
            <TextInput
              id="email"
              type="email"
              name="email"
              value={data.email}
              className="mt-1 block w-full"
              autoComplete="username"
              onChange={(e) => setData('email', e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <InputLabel htmlFor="password" value="Password" />
            <TextInput
                id="password"
                className="mt-1 block w-full"
                value={data.password}
                type="password"
                onChange={(e) => setData('password', e.target.value)}
                required
                autoComplete="false"
            />
          </div>
          <div className="mt-6 flex justify-end">
              <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
              <PrimaryButton className="ms-3" disabled={processing}>Save</PrimaryButton>
          </div>
        </form>
      </Modal>
    </AuthenticatedLayout>
  )
}
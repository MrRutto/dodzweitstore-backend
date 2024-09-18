import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { PageProps } from "@/types";
import { FC, FormEventHandler, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { statusActionHandler } from "@/Helpers/statusActionHandler";
import Modal from "@/Components/Modal";
import Swal from "sweetalert2";
import Loader from "@/Components/Loader";
import TextInput from "@/Components/TextInput";
import InputLabel from "@/Components/InputLabel";
import SecondaryButton from "@/Components/SecondaryButton";
import PrimaryButton from "@/Components/PrimaryButton";
import axios from "axios";
import relativeTime from "dayjs/plugin/relativeTime";
import { ChevronDown } from "lucide-react";

dayjs.extend(relativeTime);

type ButtonConfig = {
  action: string;
  label: string;
};

const buttonConfigs: ButtonConfig[] = [
  { action: "rejected", label: "Mark as Rejected" },
  { action: "processing", label: "Mark as Processing" },
  { action: "dispatched", label: "Mark as Dispatched" },
  { action: "delivered", label: "Mark as Delivered" },
];

interface ActionDropdownProps {
  orderStatus: string;
  onActionSelect: (action: string) => void;
  isProcessing: boolean;
}

export default function Order({auth, order, cart, delivery, history, errors}: PageProps<{ mustVerifyEmail: boolean;  order: any;  cart: any;  delivery: any; history: any; errors: any }>) {
  const { flash } = usePage().props
  const [loading, setIsLoading] = useState(false);
  const [confirmOrderPayment, setConfirmOrderPayment] = useState(false);
  const { data, setData, reset, patch, processing, recentlySuccessful } = useForm({
    paymentMethod: 'CASH',
    mpesaRef: '',
  });

  const processOrderPayment: FormEventHandler = async (e) => {
    e.preventDefault();
    closeModal();
    setIsLoading(true);

    try {
      await router.post('/orders/payment', {
        'id': order.id,
        'paymentMethod': data.paymentMethod,
        'mpesaRef': data.mpesaRef,
      });

      Swal.fire({
        title: "Payment Successful",
        text: "Action was successfully completed",
        icon: "success",
        showCancelButton: false,
        confirmButtonColor: "#ff7603",
      });
    } catch (error) {
      Swal.fire({
        title: "Payment Unsuccessful",
        text: "Action was unsuccessful. Please try again later.",
        icon: "error",
        showCancelButton: false,
        confirmButtonColor: "#ff7603",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const confirmUserDeletion = () => {
    setConfirmOrderPayment(true);
  };
  const closeModal = () => {
    setConfirmOrderPayment(false);
    reset();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setData('paymentMethod', event.target.value);
  };

  const numberWithCommas = (x: number) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const ActionDropdown: React.FC<ActionDropdownProps> = ({
    orderStatus,
    onActionSelect,
    isProcessing,
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (action: string) => {
      setIsOpen(false);
      onActionSelect(action);
    };

    return (
      <div className="relative inline-block text-left">
        <div>
          <button
            type="button"
            className="inline-flex justify-center items-center gap-2 w-full px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Select Action"}
            <ChevronDown size={16} className="text-gray-700" />
          </button>
        </div>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
            <div
              className="py-1"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="options-menu"
            >
              {buttonConfigs.map(
                (config) =>
                  statusActionHandler({
                    action: config.action,
                    status: orderStatus,
                  }) && (
                    <button
                      key={config.action}
                      onClick={() =>
                        handleSelect(config.action)
                      }
                      className="block px-4 py-2 text-sm text-gray-700 w-full text-left hover:bg-gray-100"
                      role="menuitem"
                    >
                      {config.label}
                    </button>
                  )
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const Actions: FC<{ status: string }> = ({ status }) => {
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const handleActionSelect = async (action: string) => {
      const prompt: any = handlePromptMessage(action);

      const res = await Swal.fire({
        title: "Are you sure?",
        text: prompt.text,
        icon: "warning",
        showCancelButton: prompt.showCancelButton,
        confirmButtonColor: prompt.confirmButtonColor,
        confirmButtonText: prompt.confirmButtonText,
      });

      if (!res.isConfirmed) {
        return Swal.fire({
          title: "Action Issue",
          text: "Action cannot be performed. Please try again later",
          icon: "error",
          showCancelButton: false,
          confirmButtonColor: "#ff7603",
        });
      }

      const canProceed = statusActionHandler({
        action,
        status: order.status,
      });

      if (!canProceed) return;

      setIsProcessing(action);
      setIsLoading(true);

      try {
        await  axios.post(route('order.status'), {
          'id': order.id,
          'status': action
        });

        Swal.fire({
          title: "Action Successful",
          text: "Action was successfully completed",
          icon: "success",
          showCancelButton: false,
          confirmButtonColor: "#ff7603",
        });
        router.reload();
      } catch (error) {
        console.log(error)
        Swal.fire({
          title: "Action Unsuccessful",
          text: "Action was unsuccessful. Please try again later.",
          icon: "error",
          showCancelButton: false,
          confirmButtonColor: "#ff7603",
        });
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="actions">
        <ActionDropdown
          orderStatus={order.status}
          onActionSelect={handleActionSelect}
          isProcessing={isProcessing !== null}
        />
      </div>
    );
  };

  const handlePromptMessage = (action: string) => {
    let prompt = {};

    switch (action) {
      case "rejected":
        prompt = {
          text: "You are about to mark order as rejected. This action is irreversible",
          showCancelButton: false,
          confirmButtonColor: "#dd3333",
          confirmButtonText: "Yes, Reject",
        };
        break;
      case "delivered":
        prompt = {
          text: "You are about to mark order as delivered. This action is irreversible",
          showCancelButton: false,
          confirmButtonColor: "#dd3333",
          confirmButtonText: "Yes, mark as delivered",
        };
        break;
      case "processing":
        prompt = {
          text: "You are about to mark order as proccessing. This action is irreversible",
          showCancelButton: false,
          confirmButtonColor: "#dd3333",
          confirmButtonText: "Yes, process",
        };
        break;
      case "dispatched":
        prompt = {
          text: "You are about to mark order as dispatched. This action is irreversible",
          showCancelButton: false,
          confirmButtonColor: "#dd3333",
          confirmButtonText: "Yes, dispatch",
        };
        break;
      default:
        break;
    }

    return prompt;
  };

  useEffect(() => {
    if (Object.values(errors).length < 1) return;

    Swal.fire({
      title: "Payment Unsuccessful",
      text: "Action was unsuccessful. Please try again later.",
      icon: "error",
      showCancelButton: false,
      confirmButtonColor: "#ff7603",
    });
  },[errors])

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Order Details" />
      <Loader isLoading={loading} />
      <div className="sm:px-6 lg:px-8 py-6 mx-auto text-gray-900">
        <div className="mb-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
              Order ID: {order.uuid}
            </h2>
            { !order.is_paid &&
              <div
                className={`border border-yellow-500 py-1 px-4 bg-yellow-50 text-center rounded-xl`}
              >
                <p className={`capitalize text-yellow-600 text-sm`}>
                  Payment Pending
                </p>
              </div>
            }
          </div>
          <div className="w-fit inline-flex items-center gap-4">
            { !order.is_paid &&
              <button type="button"
                onClick={confirmUserDeletion} 
                className="justify-center px-4 py-2 text-sm font-medium bg-gray-100 border border-orange-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                  Pay Order
              </button>
            }
            <Actions status={order.status} />
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-1/3 p-4 sm:p-8 bg-white shadow sm:rounded-lg mb-6">
            <div className="border border-gray-300 p-6 rounded-md mb-8">
              <h3 className="text-lg font-medium text-gray-900 underline mb-4">
                Order Summary
              </h3>
              <div className="flex items-center mb-2">
                <p className="text-sm mr-4">Order Date</p>
                <p className="text-gray-600">
                  {dayjs(order.created_at).format(
                    "MMM D, YYYY"
                  )}
                </p>
              </div>
              <div className="flex items-center mb-2">
                <p className="text-sm mr-4">Order Time</p>
                <p className="text-gray-600">
                  {dayjs(order.created_at).format("h:mm A")}
                </p>
              </div>
              <div className="flex items-center mb-2">
                <p className="text-sm mr-4">Subtotal</p>
                <p className="text-gray-600">
                  KES {numberWithCommas(order.price)}
                </p>
              </div>
              <div className="flex items-center mb-2">
                <p className="text-sm mr-4">Delivery Fee</p>
                <p className="text-gray-600">
                  KES {numberWithCommas(order.price)}
                </p>
              </div>
              <div className="flex items-center mb-2">
                <p className="text-sm mr-4">Status</p>
                <p className="text-gray-600 capitalize">
                  {order.status}
                </p>
              </div>
              <div className="flex items-center mb-2">
                <p className="text-sm mr-4">Last Updated At</p>
                <p className="text-gray-600">
                  {dayjs(order.updated_at).format(
                    "MMM D, YYYY h:mm A"
                  )}
                </p>
              </div>
              <div className="flex items-center mb-2">
                <p className="text-sm mr-4">Payment Method</p>
                <p className="text-gray-600 capitalize">
                  {order.payment_type}
                </p>
              </div>
              { order.payment_type == "MPESA" &&
                <div className="flex items-center mb-2">
                  <p className="text-sm mr-4">M-Pesa Reference</p>
                  <p className="text-gray-600 capitalize">
                    {order.mpesa_reference}
                  </p>
                </div>
              }
            </div>
            <div className="mb-8 border border-gray-300 p-6 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 underline mb-4">
                Customer Details
              </h3>
              <div className="flex items-center mb-2">
                <p className="text-sm mr-4">Name</p>
                <p className="text-gray-600">{order.name}</p>
              </div>
              <div className="flex items-center mb-2">
                <p className="text-sm mr-4">Email Address</p>
                <p className="text-gray-600">
                  {order.email_address}
                </p>
              </div>
              <div className="flex items-center mb-2">
                <p className="text-sm mr-4">Phone Number</p>
                <p className="text-gray-600">
                  {order.phone_number}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-8 bg-white shadow sm:rounded-lg w-full">
            <div className="border border-gray-300 p-6 rounded-md mb-6">
              <h3 className="text-lg font-medium text-gray-900 underline">
                Order Items
              </h3>
              <div className="">
                {cart.map((book: any) => (
                  <div
                    className="py-4 px-6 border-b border-gray-200 gap-8 flex"
                    key={book.id}
                  >
                    <img
                      src={book.imageUrl}
                      className="w-24"
                      alt="Book Image"
                    />
                    <div className="text-gray-800 mt-4">
                      <p className="text-lg font-medium">
                        {book.title}
                      </p>
                      <p className="">
                        Unit Price: KES{" "}
                        {numberWithCommas(book.price)}
                      </p>
                      <p className="">
                        Qty: {book.quantity}
                      </p>
                      <p className="">
                        Total: KES{" "}
                        {numberWithCommas(
                          book.quantity * book.price
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-gray-300 p-6 rounded-md mb-6">
              <h3 className="min-w-52 text-lg font-medium text-gray-900 underline mb-4">
                Delivery Details
              </h3>
              <div className="flex items-center mb-3">
                <p className="min-w-52 text-sm mr-4">Delivery Type</p>
                <p className="text-gray-600 capitalize">
                  {order.delivery_type}
                </p>
              </div>
              <div className="flex items-center mb-3">
                <p className="min-w-52 text-sm mr-4">Country</p>
                <p className="text-gray-600">
                  {delivery?.country ?? "-"}
                </p>
              </div>
              <div className="flex items-center mb-3">
                <p className="min-w-52 text-sm mr-4">County / State</p>
                <p className="text-gray-600">
                  {delivery?.county ?? "-"}
                </p>
              </div>
              <div className="flex items-center mb-3">
                <p className="min-w-52 text-sm mr-4">City / Town</p>
                <p className="text-gray-600 capitalize">
                  {delivery?.city ?? "-"}
                </p>
              </div>
              <div className="flex items-center mb-3">
                <p className="min-w-52 text-sm mr-4">Building Details</p>
                <p className="text-gray-600">
                  {delivery?.building_details ?? "-"}
                </p>
              </div>
              <div className="flex items-start mb-3">
                <p className="min-w-52 text-sm mr-4">
                  Delivery Instructions
                </p>
                <p className="text-gray-600">
                  {delivery?.delivery_instructions ?? "-"}
                </p>
              </div>
            </div>
            <div className="border border-gray-300 p-6 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 underline mb-4">
                Timeline
              </h3>
              { history.length <= 0 ? <p className="">Nothing to display</p> :
                <div className="timeline">
                { history.map((detail: any) => (
                  <div className="relative timeline-item flex justify-between items-center mb-6" key={detail.id}>
                    <div className="timeline-icon absolute"></div>
                    <p className="">{detail?.action}</p>
                    <p className="text-sm text-gray-600">{dayjs().from(detail.created_at, true)} ago</p>
                  </div>
                ))}
                </div>
              }
            </div>
          </div>
        </div>
      </div>
      <Modal show={confirmOrderPayment} onClose={closeModal}>
        <form onSubmit={processOrderPayment} className="p-6">
            <h2 className="text-lg font-medium text-gray-900">
                Order Payment
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Please select a payment method to complete the order. You can choose between MPESA or CASH. If you select MPESA, a valid MPESA reference code will be required to confirm the transaction. For CASH payments, no additional information is needed.
            </p>

            <div className="mt-8 mb-4">
              <InputLabel htmlFor="paymentMethod" value="Payment Method" />
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="MPESA"
                    checked={data.paymentMethod === 'MPESA'}
                    onChange={handleChange}
                    className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">MPESA</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="CASH"
                    checked={data.paymentMethod === 'CASH'}
                    onChange={handleChange}
                    className="form-radio h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">CASH</span>
                </label>
              </div>
            </div>
            { data.paymentMethod === 'MPESA' && 
              <div className="">
                  <InputLabel htmlFor="mpesaRef" value="M-Pesa Reference Code" />
                  <TextInput
                      id="mpesaRef"
                      className="mt-1 block w-full"
                      value={data.mpesaRef}
                      onChange={(e) => setData('mpesaRef', e.target.value)}
                      required
                      autoComplete="false"
                  />

              </div>
            }

            <div className="mt-6 flex justify-end">
                <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                <PrimaryButton className="ms-3" disabled={processing}>Save</PrimaryButton>
            </div>
        </form>
      </Modal>
    </AuthenticatedLayout>
  );
}

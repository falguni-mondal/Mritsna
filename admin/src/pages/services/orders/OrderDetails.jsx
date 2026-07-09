import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminOrderById, fulfillAdminOrder, updateAdminOrderStatus, clearCurrentOrder, clearOrderErrors } from "../../../store/slices/orderSlice";
import toast, { Toaster } from "react-hot-toast";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Import the modular blocks
import OrderHeader from "../../../components/orders/details/OrderHeader";
import CustomerLogistics from "../../../components/orders/details/CustomerLogistics";
import OrderLedger from "../../../components/orders/details/OrderLedger";
import FulfillmentEngine from "../../../components/orders/details/FulfillmentEngine";

gsap.registerPlugin(useGSAP);

const OrderDetails = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const containerRef = useRef(null);

  const { currentOrder: order, currentOrderLoading, actionLoading, error, actionError } = useSelector((state) => state.adminOrders);

  // Fetch data on mount
  useEffect(() => {
    if (orderId) {
      dispatch(fetchAdminOrderById(orderId));
    }
    // Cleanup when leaving the page
    return () => {
      dispatch(clearCurrentOrder());
      dispatch(clearOrderErrors());
    };
  }, [dispatch, orderId]);

  // GSAP Stagger Animation - Triggers when order data successfully loads
  useGSAP(() => {
    if (order && !currentOrderLoading) {
      gsap.fromTo(
        ".stagger-block",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" }
      );
    }
  }, { dependencies: [order, currentOrderLoading], scope: containerRef });

  // Error Handling Toast
  useEffect(() => {
    const activeError = error || actionError;
    if (activeError) {
      toast.error(activeError, {
        style: { background: '#1A1A1A', color: '#fff', fontSize: '12px', borderRadius: '2px' },
        iconTheme: { primary: '#ff4b4b', secondary: '#fff' },
      });
      dispatch(clearOrderErrors());
    }
  }, [error, actionError, dispatch]);

  // Action Handlers
  const handleFulfill = async () => {
    const toastId = toast.loading("Connecting to Delhivery...", { style: { background: '#1A1A1A', color: '#fff', fontSize: '12px', borderRadius: '2px' }});
    try {
      await dispatch(fulfillAdminOrder(order._id)).unwrap();
      toast.success("Order Shipped via Delhivery", { id: toastId });
    } catch (err) {
      // Error is caught by Redux and pushed to actionError state
      toast.dismiss(toastId);
    }
  };

  const handleStatusOverride = async (newStatus) => {
    const toastId = toast.loading("Updating Ledger...", { style: { background: '#1A1A1A', color: '#fff', fontSize: '12px', borderRadius: '2px' }});
    try {
      await dispatch(updateAdminOrderStatus({ orderId: order._id, orderStatus: newStatus })).unwrap();
      toast.success("Order Status Updated", { id: toastId });
    } catch (err) {
      toast.dismiss(toastId);
    }
  };

  // Loading Screen
  if (currentOrderLoading || !order) {
    return (
      <div className="w-full min-h-screen bg-[#f8f8f8] flex justify-center items-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border border-[#1a1a1a]/10 rounded-full" />
          <div className="absolute inset-0 border border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f8f8f8] min-h-screen py-10">
      {/* Make sure Toaster isn't duplicated if you have a global one in App.jsx. I included it just in case, but remove if you have the global setup */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6" ref={containerRef}>
        
        {/* The Master White Panel */}
        <div className="bg-white p-8 md:p-12 border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] min-h-[800px]">
          
          <div className="stagger-block">
            <OrderHeader order={order} />
          </div>
          
          <div className="stagger-block">
            <CustomerLogistics order={order} />
          </div>
          
          <div className="stagger-block">
            <OrderLedger order={order} />
          </div>

          <div className="stagger-block">
            <FulfillmentEngine 
              order={order} 
              onFulfill={handleFulfill} 
              onStatusOverride={handleStatusOverride}
              actionLoading={actionLoading}
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
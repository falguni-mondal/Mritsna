import React, { useRef } from "react";
import OrderStatusBadge from "./OrderStatusBadge";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Register the GSAP hook
gsap.registerPlugin(useGSAP);

const OrderTable = ({ orders }) => {
  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Staggered row animation
  useGSAP(() => {
    if (orders && orders.length > 0) {
      gsap.fromTo(
        ".table-row",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: 0.05, duration: 0.8, ease: "power3.out" }
      );
    }
  }, { dependencies: [orders], scope: tableRef });

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-24 bg-white border border-gray-100 rounded-sm">
        <p className="text-sm tracking-widest uppercase text-gray-400">No orders found.</p>
      </div>
    );
  }

  return (
    <div ref={tableRef} className="overflow-x-auto bg-white">
      <table className="min-w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-6 py-5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Order ID
            </th>
            <th className="px-6 py-5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Date
            </th>
            <th className="px-6 py-5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Customer
            </th>
            <th className="px-6 py-5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Total
            </th>
            <th className="px-6 py-5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Status
            </th>
            <th className="px-6 py-5 text-right text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((order) => {
            const orderTotal = (order.advancePaid || 0) + (order.balanceDueOnDelivery || 0) || order.paymentAmount || 0;

            return (
              <tr key={order._id} className="table-row hover:bg-[#FAFAFA] transition-colors duration-300">
                <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-gray-900 tracking-wide">
                  {order.orderNumber}
                </td>
                <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-500">
                  {order.isGuestCheckout ? order.guestEmail : order?.user?.email || "Unknown"}
                </td>
                <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-900 tracking-wide">
                  {orderTotal.toLocaleString("en-IN", {
                    style: "currency",
                    currency: order.paymentCurrency || "INR",
                  })}
                </td>
                <td className="px-6 py-6 whitespace-nowrap">
                  <OrderStatusBadge status={order.orderStatus} />
                </td>
                <td className="px-6 py-6 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={() => navigate(`/admin/orders/${order._id}`)}
                    className="text-xs uppercase tracking-widest text-gray-900 font-medium hover:text-[#C5A880] transition-colors duration-300"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
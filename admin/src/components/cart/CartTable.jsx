import React from "react";
import { Icon } from "@iconify/react";

const formatINR = (amount) => {
  return `₹ ${Number(amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

const CartTable = ({ carts, pagination, isLoading, currentFilter, onFilterChange, onPageChange, onRowClick }) => {
  const tabs = [
    { id: "all", label: "All Carts" },
    { id: "recent", label: "Recent (< 24h)" },
    { id: "abandoned", label: "Abandoned (> 24h)" },
  ];

  return (
    <div className="flex flex-col w-full">
      
      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-black/10 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={`pb-4 text-xs font-bold uppercase tracking-widest transition-colors relative
              ${currentFilter === tab.id ? "text-black" : "text-black/40 hover:text-black/70"}
            `}
          >
            {tab.label}
            {currentFilter === tab.id && (
              <span className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black/5 text-[0.65rem] uppercase tracking-widest opacity-50">
              <th className="py-4 px-4 font-bold">Customer</th>
              <th className="py-4 px-4 font-bold">Items</th>
              <th className="py-4 px-4 font-bold">Value</th>
              <th className="py-4 px-4 font-bold">Status</th>
              <th className="py-4 px-4 font-bold text-right">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="py-12 text-center">
                  <Icon icon="ph:spinner-gap-light" className="text-3xl animate-spin mx-auto opacity-30" />
                </td>
              </tr>
            ) : carts.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-12 text-center text-sm opacity-40">
                  No carts found for this filter.
                </td>
              </tr>
            ) : (
              carts.map((cart) => (
                <tr 
                  key={cart.cartId} 
                  onClick={() => onRowClick(cart.cartId)}
                  className="border-b border-black/5 hover:bg-black/[0.02] transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-4">
                    <p className="text-sm font-medium">{cart.user.name}</p>
                    <p className="text-xs opacity-50">{cart.user.email}</p>
                  </td>
                  <td className="py-4 px-4 text-sm">{cart.itemCount}</td>
                  <td className="py-4 px-4 text-sm font-medium">{formatINR(cart.cartValueINR)}</td>
                  <td className="py-4 px-4">
                    {cart.isAbandoned ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-red-100 text-red-800 text-[0.65rem] uppercase tracking-widest font-bold">
                        Abandoned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-green-100 text-green-800 text-[0.65rem] uppercase tracking-widest font-bold">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-right opacity-60">
                    {timeAgo(cart.lastActive)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-black/5">
          <span className="text-xs opacity-50 uppercase tracking-widest font-bold">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="w-8 h-8 flex items-center justify-center border border-black/10 disabled:opacity-30 hover:bg-black/5 transition-colors"
            >
              <Icon icon="ph:caret-left-bold" />
            </button>
            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="w-8 h-8 flex items-center justify-center border border-black/10 disabled:opacity-30 hover:bg-black/5 transition-colors"
            >
              <Icon icon="ph:caret-right-bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartTable;
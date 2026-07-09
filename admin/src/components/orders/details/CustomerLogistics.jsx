import React from "react";

const CustomerLogistics = ({ order }) => {
  const { shippingAddress, billingAddress, isGuestCheckout, guestEmail, user } = order;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-b border-gray-100">
      
      {/* Identity Block */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-4">Customer Profile</h3>
        <div className="space-y-1">
          <p className="text-sm text-black font-medium tracking-wide">
            {shippingAddress.firstName} {shippingAddress.lastName}
          </p>
          <p className="text-xs text-gray-500">{isGuestCheckout ? guestEmail : user?.email}</p>
          <p className="text-xs text-gray-500">{shippingAddress.phone}</p>
          <div className="mt-3 inline-block">
            <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-1 bg-gray-50 border border-gray-200 text-gray-500 rounded-sm">
              {isGuestCheckout ? "Guest Checkout" : "Registered User"}
            </span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-4">Shipping Address</h3>
        <div className="space-y-1 text-xs text-gray-600 leading-relaxed">
          <p className="text-black font-medium">{shippingAddress.firstName} {shippingAddress.lastName}</p>
          <p>{shippingAddress.street}</p>
          <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.pinCode}</p>
          <p className="uppercase tracking-widest mt-1 text-[10px] text-gray-400">{shippingAddress.country}</p>
        </div>
      </div>

      {/* Billing Address */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-4">Billing Address</h3>
        <div className="space-y-1 text-xs text-gray-600 leading-relaxed">
          <p className="text-black font-medium">{billingAddress.firstName} {billingAddress.lastName}</p>
          <p>{billingAddress.street}</p>
          <p>{billingAddress.city}, {billingAddress.state} {billingAddress.pinCode}</p>
          <p className="uppercase tracking-widest mt-1 text-[10px] text-gray-400">{billingAddress.country}</p>
        </div>
      </div>

    </div>
  );
};

export default CustomerLogistics;
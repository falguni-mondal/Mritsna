import React, { useState } from 'react';
import { Icon } from '@iconify/react';

// Helper for optimized ImageKit URLs
const getOptimizedImgUrl = (url) => {
  if (!url) return "";
  if (url.includes("tr=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}tr=w-200,q-80`; // Smaller width for checkout thumbnails
};

const CheckoutSummary = ({ cartItems, subTotal, shippingState, currencySymbol, currencyCode }) => {
  const [couponCode, setCouponCode] = useState('');
  const [showTaxDetails, setShowTaxDetails] = useState(false);

  // Formatting helper matching Cart.jsx
  const formatPrice = (price) => {
    const locale = currencyCode === "INR" ? "en-IN" : "en-US";
    return `${currencySymbol || "₹"} ${Number(price).toLocaleString(locale, { maximumFractionDigits: 0 })}`;
  };

  // MOCK CALCULATIONS based on architecture
  const discountAmount = 0; // Would be updated via backend
  const taxRate = 0.18; // 18% GST
  const taxableAmount = (subTotal || 0) - discountAmount;
  const totalTax = taxableAmount * taxRate;
  const finalTotal = taxableAmount + totalTax;

  // Dynamic GST Splitter
  const isLocalState = shippingState && shippingState.toLowerCase() === 'maharashtra'; // Assuming business is in MH

  return (
    <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-black/5">
      <h2 className="text-lg font-medium mb-6">Order Summary</h2>

      {/* Cart Items Preview */}
      <div className="space-y-4 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {cartItems && cartItems.length > 0 ? (
          cartItems.map((item, idx) => (
            <div key={item.variantId || idx} className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden relative shrink-0">
                 <img src={getOptimizedImgUrl(item.img)} alt={item.title} className="w-full h-full object-cover mix-blend-multiply" />
                 <span className="absolute -top-2 -right-2 bg-black text-white text-[0.5rem] w-5 h-5 flex items-center justify-center rounded-full z-10">
                   {item.quantity}
                 </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-gray-500 truncate">{item.colorName}</p>
              </div>
              <p className="text-sm shrink-0">{formatPrice(item.price)}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 italic">Your cart is empty.</p>
        )}
      </div>

      {/* Coupon Input */}
      <div className="flex gap-2 mb-8 border-b border-black/10 pb-8">
        <input 
          type="text" 
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Gift card or discount code" 
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black uppercase tracking-widest transition-colors"
        />
        <button className="bg-black text-white px-6 py-3 rounded-lg text-[0.65rem] font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors">
          Apply
        </button>
      </div>

      {/* Financial Breakdown */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-gray-500">
          <span>Subtotal</span>
          <span>{formatPrice(subTotal || 0)}</span>
        </div>

        {/* Expandable Tax Section */}
        <div className="border-t border-dashed border-gray-200 pt-3 mt-3">
          <button 
            type="button"
            onClick={() => setShowTaxDetails(!showTaxDetails)}
            className="w-full flex justify-between text-gray-500 hover:text-black transition-colors items-center group"
          >
            <span className="flex items-center gap-1">
              Estimated Taxes
              <Icon icon="lucide:chevron-down" className={`transition-transform duration-300 ${showTaxDetails ? 'rotate-180' : ''}`} />
            </span>
            <span>{formatPrice(totalTax)}</span>
          </button>
          
          {/* Subtle Accordion Dropdown */}
          <div className={`overflow-hidden transition-all duration-500 ${showTaxDetails ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
            <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-500 space-y-1">
              {shippingState ? (
                isLocalState ? (
                  <>
                    <div className="flex justify-between"><span>CGST (9%)</span><span>{formatPrice(totalTax / 2)}</span></div>
                    <div className="flex justify-between"><span>SGST (9%)</span><span>{formatPrice(totalTax / 2)}</span></div>
                  </>
                ) : (
                  <div className="flex justify-between"><span>IGST (18%)</span><span>{formatPrice(totalTax)}</span></div>
                )
              ) : (
                <p className="italic text-[0.6rem]">Enter state to see detailed tax breakdown.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between text-lg font-medium pt-4 border-t border-black/10 mt-4">
          <span>Total</span>
          <span>{formatPrice(finalTotal)}</span>
        </div>
      </div>

      {/* Giant Pay Button */}
      <button 
        disabled={!cartItems || cartItems.length === 0}
        className="w-full bg-black text-white py-4 mt-8 rounded-lg text-xs font-bold tracking-[0.2em] uppercase hover:bg-gray-900 transform hover:-translate-y-1 transition-all duration-300 shadow-[0_10px_20px_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
      >
        Proceed to Payment
      </button>
    </div>
  );
};

export default CheckoutSummary;
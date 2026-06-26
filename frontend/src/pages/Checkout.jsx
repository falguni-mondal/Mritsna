import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  calculateCheckoutTotals, 
  createRazorpayOrder, 
  verifyRazorpayPayment 
} from '../store/features/checkoutSlice'; 
import CheckoutAddresses from '../components/checkout/CheckoutAddresses';
import CheckoutForm from '../components/checkout/CheckoutForm';
import CheckoutSummary from '../components/checkout/CheckoutSummary';

// Helper to dynamically load the Razorpay SDK
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const dispatch = useDispatch();
  
  // --- REAL REDUX STATE ---
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items: cartItems, currencySymbol, currencyCode } = useSelector((state) => state.cart);
  const { 
    appliedCouponCode, 
    paymentOption, 
    skipAutoApply, 
    guestEmail, 
    deviceId 
  } = useSelector((state) => state.checkout);

  const isGuest = !isAuthenticated;

  // --- MASTER STATE ---
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    street: '', city: '', pinCode: '', 
    country: 'India', countryCode: 'IN', // Default to India
    state: '', stateCode: '' 
  });

  // --- HANDOFF 1: Initial Auth Prefill ---
  useEffect(() => {
    if (user && !isGuest) {
      setFormData(prev => ({ 
        ...prev, 
        firstName: user.firstName || '', 
        lastName: user.lastName || '', 
        email: user.email || '' 
      }));
    }
  }, [user, isGuest]);

  // --- HANDOFF 2: Address Selection Prefill ---
  const handleAddressSelect = (address) => {
    setSelectedAddressId(address.id);
    setFormData(prev => ({
      ...prev,
      street: address.street,
      city: address.city,
      state: address.state,
      stateCode: address.stateCode || '', 
      pinCode: address.pinCode,
      country: address.country || 'India',
      countryCode: address.countryCode || 'IN',
      phone: address.phone || prev.phone
    }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- THE AUTO-CALCULATION ENGINE ---
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      const formattedItems = cartItems.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity
      }));

      dispatch(calculateCheckoutTotals({
        items: formattedItems,
        country: formData.country,
        state: formData.state,
        couponCode: appliedCouponCode,
        paymentOption: paymentOption,
        skipAutoApply: skipAutoApply,
        guestEmail: isGuest ? formData.email : undefined,
        deviceId: deviceId || 'browser-fingerprint-fallback' 
      }));
    }
  }, [cartItems, formData.state, formData.country, appliedCouponCode, paymentOption, skipAutoApply, isGuest, formData.email, deviceId, dispatch]);

  // --- THE RAZORPAY GATEWAY HANDLER ---
  const handleProceedToPayment = async () => {
    // 1. Basic Frontend Validation
    if (!formData.street || !formData.city || !formData.state || !formData.firstName || !formData.phone) {
      alert("Please complete all required shipping details before paying.");
      return;
    }

    // 2. Load External SDK
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      alert("Failed to load Razorpay SDK. Please check your internet connection.");
      return;
    }

    // 3. Construct the strict payload expected by Zod
    const addressPayload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      street: formData.street,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      pinCode: formData.pinCode,
    };

    const orderPayload = {
      items: cartItems.map(item => ({ variantId: item.variantId, quantity: item.quantity })),
      shippingAddress: addressPayload,
      billingAddress: addressPayload, // Assuming same as shipping for this flow
      couponCode: appliedCouponCode,
      paymentOption: paymentOption,
      skipAutoApply: skipAutoApply,
      guestEmail: isGuest ? formData.email : undefined,
      deviceId: deviceId || 'browser-fingerprint-fallback'
    };

    // 4. Dispatch Order Creation to Backend
    const resultAction = await dispatch(createRazorpayOrder(orderPayload));

    if (createRazorpayOrder.fulfilled.match(resultAction)) {
      const { razorpayOrderId, orderId, amount, currency, keyId } = resultAction.payload;

      // 5. Initialize the Razorpay Window
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: "Mritsna",
        description: "Secure Checkout",
        order_id: razorpayOrderId,
        handler: async function (response) {
          // Payment Succeeded on Gateway -> Verify Cryptographically on Backend
          const verifyPayload = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            db_order_id: orderId
          };

          const verifyAction = await dispatch(verifyRazorpayPayment(verifyPayload));
          
          if (verifyRazorpayPayment.fulfilled.match(verifyAction)) {
            alert("Payment Verified Successfully! Your order is confirmed.");
            // Add a redirect here: navigate(`/order-confirmation/${verifyAction.payload.data.orderNumber}`)
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: "#000000"
        }
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response){
        alert(`Payment Failed: ${response.error.description}`);
      });
      
      paymentObject.open();

    } else {
      alert(resultAction.payload?.message || "Failed to initialize the order in the database.");
    }
  };

  return (
    <main className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-[100px] pb-20 selection:bg-[#1a1a1a] selection:text-white">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-light tracking-wide">Checkout</h1>
          <p className="text-xs text-gray-500 mt-2 tracking-widest uppercase">Secure Encrypted Transaction</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-16 relative">
          
          {/* LEFT COLUMN: Logistics */}
          <div className="w-full lg:w-[60%] flex flex-col gap-12">
            <CheckoutAddresses 
              user={user} 
              isGuest={isGuest} 
              selectedAddressId={selectedAddressId} 
              onSelect={handleAddressSelect} 
            />
            
            <hr className="border-black/5" />
            
            <CheckoutForm 
              formData={formData} 
              onChange={handleFormChange} 
              setFormData={setFormData} // NEW: Passing the state setter down for complex dropdown logic
              isGuest={isGuest} 
            />
          </div>

          {/* RIGHT COLUMN: Sticky Summary */}
          <div className="w-full lg:w-[40%]">
            <div className="sticky top-[120px]">
              <CheckoutSummary 
                cartItems={cartItems} 
                shippingState={formData.state} 
                currencySymbol={currencySymbol}
                currencyCode={currencyCode}
                onPay={handleProceedToPayment}
              />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default Checkout;
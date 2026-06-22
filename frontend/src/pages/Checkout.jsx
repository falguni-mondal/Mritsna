import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import CheckoutAddresses from '../components/checkout/CheckoutAddresses';
import CheckoutForm from '../components/checkout/CheckoutForm';
import CheckoutSummary from '../components/checkout/CheckoutSummary';

const Checkout = () => {
  // --- REAL REDUX STATE ---
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  // Destructuring exactly as it is in your Cart.jsx
  const { 
    items: cartItems, 
    subTotal, 
    currencySymbol, 
    currencyCode 
  } = useSelector((state) => state.cart);

  const isGuest = !isAuthenticated;

  // --- MASTER STATE ---
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    street: '', city: '', state: '', pinCode: ''
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
      pinCode: address.pinCode,
      phone: address.phone || prev.phone
    }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
            
            <CheckoutForm formData={formData} onChange={handleFormChange} isGuest={isGuest} />
          </div>

          {/* RIGHT COLUMN: Sticky Summary */}
          <div className="w-full lg:w-[40%]">
            <div className="sticky top-[120px]">
              <CheckoutSummary 
                cartItems={cartItems} 
                subTotal={subTotal} 
                shippingState={formData.state} 
                currencySymbol={currencySymbol}
                currencyCode={currencyCode}
              />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default Checkout;
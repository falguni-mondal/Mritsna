import React from 'react';

const CheckoutForm = ({ formData, onChange, isGuest }) => {
  // Helper for premium input styling
  const inputClass = "w-full bg-transparent border-b border-black/20 pb-2 text-sm focus:outline-none focus:border-black transition-colors placeholder:text-gray-400";
  const labelClass = "block text-[0.6rem] font-bold tracking-[0.15em] uppercase text-gray-500 mb-2";

  return (
    <section>
      <h2 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-gray-400 mb-8">
        Shipping Details
      </h2>

      <form className="space-y-8">
        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className={labelClass}>First Name</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={onChange} className={inputClass} placeholder="John" readOnly={!isGuest} />
          </div>
          <div>
            <label className={labelClass}>Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={onChange} className={inputClass} placeholder="Doe" readOnly={!isGuest} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={onChange} className={`${inputClass} ${!isGuest ? 'text-gray-400 cursor-not-allowed' : ''}`} placeholder="john@example.com" readOnly={!isGuest} />
          </div>
        </div>

        {/* Address Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Street Address</label>
            <input type="text" name="street" value={formData.street} onChange={onChange} className={inputClass} placeholder="Apartment, suite, unit, etc." />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input type="text" name="city" value={formData.city} onChange={onChange} className={inputClass} placeholder="Mumbai" />
          </div>
          <div>
            <label className={labelClass}>State / Province</label>
            <input type="text" name="state" value={formData.state} onChange={onChange} className={inputClass} placeholder="Maharashtra" />
          </div>
          <div>
            <label className={labelClass}>Postal Code</label>
            <input type="text" name="pinCode" value={formData.pinCode} onChange={onChange} className={inputClass} placeholder="400001" />
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <input type="tel" name="phone" value={formData.phone} onChange={onChange} className={inputClass} placeholder="+91" />
          </div>
        </div>
      </form>
    </section>
  );
};

export default CheckoutForm;
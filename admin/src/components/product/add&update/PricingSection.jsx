import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Icon } from '@iconify/react';

// Your quick-reference dictionary for the UI
const COMMON_HSN_CODES = [
  { label: 'Vases (Ceramic)', code: '6912' },
  { label: 'Lighting (Lamps)', code: '9405' },
  { label: 'Wood Decor', code: '4420' },
  { label: 'Glassware', code: '7013' }
];

const PricingSection = () => {
  // We bring in 'setValue' to programmatically change the input when a badge is clicked
  const { register, setValue, formState: { errors } } = useFormContext();

  const handleHsnClick = (code) => {
    // This instantly updates the form state and re-validates the field
    setValue('pricing.hsnCode', code, { shouldValidate: true });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
        <Icon icon="lucide:indian-rupee" width="20" className="text-gray-400" />
        Pricing & Taxation
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Base Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Base Price (INR) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Icon icon="lucide:indian-rupee" width="16" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              {...register('pricing.basePrice')} 
              type="number" 
              min="0"
              placeholder="0.00" 
              className={`w-full pl-9 pr-4 py-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.pricing?.basePrice ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-black/5'
              }`}
            />
          </div>
          {errors.pricing?.basePrice && (
            <p className="text-red-500 text-xs mt-1">{errors.pricing.basePrice.message}</p>
          )}
        </div>

        {/* Discount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
          <div className="relative">
            <Icon icon="lucide:percent" width="16" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              {...register('pricing.discountPercentage')} 
              type="number" 
              min="0"
              max="100"
              placeholder="0" 
              className={`w-full pl-9 pr-4 py-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
                errors.pricing?.discountPercentage ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-black/5'
              }`}
            />
          </div>
          {errors.pricing?.discountPercentage && (
            <p className="text-red-500 text-xs mt-1">{errors.pricing.discountPercentage.message}</p>
          )}
        </div>

        {/* Tax Class */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax Class</label>
          <select 
            {...register('pricing.taxClass')}
            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
          >
            <option value="standard">Standard Tax</option>
            <option value="reduced">Reduced Tax</option>
            <option value="exempt">Tax Exempt</option>
          </select>
        </div>

        {/* HSN Code with Suggestion Badges */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            HSN Code <span className="text-red-500">*</span>
          </label>
          <input 
            {...register('pricing.hsnCode')} 
            type="text" 
            placeholder="e.g. 6912" 
            className={`w-full p-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all ${
              errors.pricing?.hsnCode ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-black/5'
            }`}
          />
          {errors.pricing?.hsnCode && (
            <p className="text-red-500 text-xs mt-1">{errors.pricing.hsnCode.message}</p>
          )}
          
          {/* Quick Add Suggestions */}
          <div className="mt-2 flex flex-wrap gap-2">
            {COMMON_HSN_CODES.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => handleHsnClick(item.code)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
              >
                {item.label}: <span className="font-mono">{item.code}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PricingSection;
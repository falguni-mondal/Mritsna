import React from "react";
import { Link } from "react-router-dom";

const ProductInfo = ({ product, activeVariant, currencySymbol = "₹", currencyCode = "INR" }) => {
  
  // Dynamic formatter helper: 
  // Uses en-IN (Lakhs/Crores) for Indian Rupees, and en-US (Thousands/Millions) for global currencies.
  const formatPrice = (price) => {
    const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
    return `${currencySymbol} ${price.toLocaleString(locale, { maximumFractionDigits: 0 })}`;
  };

  // --- NEW LOGIC: Calculate the mock original price assuming current price is 85% ---
  const calculatedOriginalPrice = Math.round(activeVariant.finalPrice / 0.85);

  return (
    <>
      {/* Breadcrumbs */}
      <div className="product-info-item flex items-center gap-2 text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-8">
        <Link to="/" className="hover:opacity-100 transition-opacity">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:opacity-100 transition-opacity">Shop</Link>
        <span>/</span>
        <Link 
          to={`/product/${product.slug}?variant=${activeVariant.variantId}`} 
          className="hover:opacity-100 transition-opacity"
        >
          {product.title}
        </Link>
      </div>

      {/* Main Title (Includes specific color name) */}
      <h1 className="product-info-item head-font text-4xl lg:text-5xl tracking-wide mb-4">
        {product.title} - {activeVariant.colorName}
      </h1>
      
      {/* Dynamic Pricing */}
      <div className="product-info-item text-lg tracking-widest font-light mb-8 flex items-center gap-3">
        
        {/* --- OLD DYNAMIC PRICING DISPLAY (COMMENTED OUT) --- */}
        {/* 
        <span className="font-medium text-[#1a1a1a]">
          {formatPrice(activeVariant.finalPrice)}.00
        </span>
        
        {activeVariant.discountPercentage > 0 && (
          <span className="text-sm text-gray-400 line-through">
            {formatPrice(activeVariant.originalPrice)}.00
          </span>
        )} 
        */}

        {/* --- NEW CALCULATED PRICING DISPLAY --- */}
        <span className="font-medium text-[#1a1a1a]">
          {formatPrice(activeVariant.finalPrice)}.00
        </span>
        <span className="text-sm text-gray-400 line-through">
          {formatPrice(calculatedOriginalPrice)}.00
        </span>
        
      </div>

      {/* Description */}
      <p className="product-info-item text-sm lg:text-base font-light opacity-80 leading-relaxed mb-10 w-full lg:w-[90%]">
        {product.description}
      </p>
    </>
  );
};

export default ProductInfo;
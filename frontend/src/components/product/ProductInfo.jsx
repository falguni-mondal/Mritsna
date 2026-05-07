import React from "react";
import { Link } from "react-router-dom";

const ProductInfo = ({ product, activeVariant }) => {
  return (
    <>
      <div className="product-info-item flex items-center gap-2 text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-8">
        <Link to="/" className="hover:opacity-100 transition-opacity">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:opacity-100 transition-opacity">Shop</Link>
        <span>/</span>
        <span>{product.category}</span>
      </div>

      <h1 className="product-info-item head-font text-4xl lg:text-5xl tracking-wide mb-4">
        {product.title}
      </h1>
      
      <div className="product-info-item text-lg tracking-widest font-light mb-8 flex items-center gap-3">
        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: product.baseCurrency, maximumFractionDigits: 0 }).format(activeVariant.finalPrice)}
        
        {activeVariant.discountPercentage > 0 && (
          <span className="text-sm text-gray-400 line-through">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: product.baseCurrency, maximumFractionDigits: 0 }).format(activeVariant.originalPrice)}
          </span>
        )}
      </div>

      <p className="product-info-item text-sm lg:text-base font-light opacity-80 leading-relaxed mb-10 w-full lg:w-[90%]">
        {product.description}
      </p>
    </>
  );
};

export default ProductInfo;
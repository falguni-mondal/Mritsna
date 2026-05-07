import React from 'react';
import { Link } from 'react-router-dom';
import PremiumImage from './PremiumImage';

const ProductCard = ({ product }) => {
  return (
    <Link
      to={`/product/${product.slug}`}
      data-cursor="explore"
      // Note the initial hidden state for GSAP: opacity-0 and translate-y-8
      className="gsap-reveal-card group flex flex-col block w-full cursor-none lg:cursor-none opacity-0 translate-y-8"
    >
      <div className="w-full aspect-[4/5] bg-[#eeeeee] flex items-center justify-center overflow-hidden relative">
        {product.isPremium && (
          <div className="absolute top-3 left-3 z-10 bg-black text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
            Premium
          </div>
        )}
        
        {/* We pass a group-hover class so the image scales up when the card is hovered */}
        <div className="w-full h-full transition-transform duration-700 group-hover:scale-105">
          <PremiumImage src={product.img} alt={product.alt || product.name} />
        </div>
      </div>

      <div className="flex flex-col items-start mt-4 lg:mt-5 text-sm lg:text-base tracking-wide font-medium pointer-events-none">
        <h3 className="line-clamp-1">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs lg:text-sm font-medium">
            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.finalPrice)}
          </span>
          {product.discount > 0 && (
            <span className="text-[10px] lg:text-xs text-gray-400 line-through">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
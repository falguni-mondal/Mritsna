import React from "react";
import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
  return (
    <Link
      to={`/product/${product.id}`}
      data-cursor="explore"
      className="product-card group flex flex-col w-full cursor-none lg:cursor-none"
    >
      <div className="w-full aspect-[4/5] bg-[#eeeeee] flex items-center justify-center overflow-hidden mb-5">
        <img
          src={product.img}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col items-start text-sm lg:text-base tracking-wide font-medium pointer-events-none">
        <h3 className="text-[#1a1a1a]">{product.name}</h3>
        <span className="mt-1 text-xs lg:text-sm text-[#1a1a1a]/60">
          {product.price}
        </span>
      </div>
    </Link>
  );
};

export default ProductCard;
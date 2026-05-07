import React, { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const ProductActions = ({ activeVariant }) => {
  const [quantity, setQuantity] = useState(1);
  const { inStock } = activeVariant;

  const buyBtnRef = useRef(null);
  const buyRippleRef = useRef(null);
  const buyTextDarkRef = useRef(null);
  const buyTextLightRef = useRef(null);

  const handleQuantity = (type) => {
    if (type === "dec" && quantity > 1) setQuantity(quantity - 1);
    // Allow max 5 per order if in stock
    if (type === "inc" && quantity < 5) setQuantity(quantity + 1);
  };

  const { contextSafe } = useGSAP();

  const handleBuyMouseEnter = contextSafe((e) => {
    if (!inStock) return;
    const rect = buyBtnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.set(buyRippleRef.current, { x: x, y: y, scale: 0 });
    gsap.to(buyRippleRef.current, { scale: 1, duration: 0.5, ease: "power3.out" });
    gsap.to(buyTextDarkRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
    gsap.to(buyTextLightRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
  });

  const handleBuyMouseLeave = contextSafe((e) => {
    if (!inStock) return;
    const rect = buyBtnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(buyRippleRef.current, { scale: 0, x: x, y: y, duration: 0.5, ease: "power3.out" });
    gsap.to(buyTextDarkRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
    gsap.to(buyTextLightRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
  });

  return (
    <div className="product-info-item w-full flex flex-col gap-4 mb-12">
      <div className="flex gap-4 h-14">
        <div className="flex items-center justify-between border border-black/10 px-4 w-32 shrink-0">
          <button 
            onClick={() => handleQuantity("dec")} 
            disabled={quantity <= 1 || !inStock}
            className={`p-2 transition-opacity ${quantity <= 1 || !inStock ? "opacity-20 cursor-not-allowed" : "opacity-50 hover:opacity-100"}`}
          >
            <Icon icon="ph:minus" />
          </button>
          <span className={`text-sm font-medium ${!inStock && 'opacity-30'}`}>{quantity}</span>
          <button 
            onClick={() => handleQuantity("inc")} 
            disabled={quantity >= 5 || !inStock}
            className={`p-2 transition-opacity ${quantity >= 5 || !inStock ? "opacity-20 cursor-not-allowed" : "opacity-50 hover:opacity-100"}`}
          >
            <Icon icon="ph:plus" />
          </button>
        </div>

        <button 
          disabled={!inStock}
          className="flex-1 bg-[#1a1a1a] text-white text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {inStock ? "Add to Cart" : "Out of Stock"}
        </button>
        <button className="w-14 border border-black/10 flex items-center justify-center text-xl hover:bg-black/5 transition-colors">
          <Icon icon="ph:heart-light" />
        </button>
      </div>
      
      <button 
        ref={buyBtnRef}
        disabled={!inStock}
        onMouseEnter={handleBuyMouseEnter}
        onMouseLeave={handleBuyMouseLeave}
        className="relative overflow-hidden w-full h-14 border border-[#1a1a1a] flex items-center justify-center group disabled:border-black/20 disabled:cursor-not-allowed"
      >
        <div 
          ref={buyRippleRef} 
          className="absolute bg-[#1a1a1a] rounded-full pointer-events-none z-0"
          style={{ width: '1000px', height: '1000px', top: '-500px', left: '-500px', transform: 'scale(0)' }}
        />
        <span ref={buyTextDarkRef} className={`absolute inset-0 z-10 flex items-center justify-center text-[0.65rem] font-bold tracking-[0.2em] uppercase ${!inStock ? 'text-black/30' : 'text-[#1a1a1a]'}`}>
          {inStock ? "Buy it now" : "Unavailable"}
        </span>
        <span ref={buyTextLightRef} className="absolute inset-0 z-10 flex items-center justify-center text-[0.65rem] font-bold tracking-[0.2em] uppercase text-white opacity-0">
          Buy it now
        </span>
      </button>
    </div>
  );
};

export default ProductActions;
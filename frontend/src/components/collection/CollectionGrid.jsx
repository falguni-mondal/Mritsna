import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Link } from "react-router-dom";

const CollectionGrid = ({ products = [], currencyCode }) => {
  const gridRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo(".product-card",
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.2, stagger: 0.15, ease: "power3.out", scrollTrigger: {
        trigger: gridRef.current,
        start: "top 75%",
      }}
    );
  }, { scope: gridRef });

  const getOffsetClass = (index) => {
    const columnPosition = index % 3;
    if (columnPosition === 0) return "mt-0";        
    if (columnPosition === 1) return "lg:mt-32";    
    return "lg:mt-16";                              
  };

  return (
    <section ref={gridRef} className="w-full px-6 lg:px-12 pb-32 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-end border-b border-black/10 pb-8 mb-16">
        <h3 className="head-font text-4xl lg:text-5xl">The Pieces</h3>
        <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50">
          {products.length} Items
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 xl:gap-24">
        {products.map((product, index) => {
          const livePrice = product.variants?.[0]?.pricing?.price || 0;
          
          // --- DYNAMIC CURRENCY FORMATTER ---
          const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
          const formattedPrice = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode || 'INR',
            maximumFractionDigits: 0
          }).format(livePrice);
          
          const primaryImage = product.variants?.[0]?.images?.[0]?.baseUrl;

          return (
            <Link 
              to={`/product/${product.slug}`}
              key={product._id} 
              className={`product-card group flex flex-col cursor-pointer ${getOffsetClass(index)}`}
            >
              <div className="relative w-full aspect-[4/5] overflow-hidden mb-6 bg-[#f0f0f0]">
                {primaryImage ? (
                  <img 
                    src={`${primaryImage}?tr=w-1200,q-80,f-webp`} 
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-black/20">
                    <span className="text-xs uppercase tracking-widest font-bold">No Image</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-start gap-4">
                <h4 className="head-font text-2xl lg:text-3xl transition-colors group-hover:text-black/60">
                  {product.title}
                </h4>
                <p className="text-[0.65rem] font-bold tracking-widest mt-1 shrink-0">
                  {formattedPrice}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CollectionGrid;
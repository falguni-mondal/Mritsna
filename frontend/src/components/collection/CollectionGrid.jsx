import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const CollectionGrid = ({ products }) => {
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

  return (
    <section ref={gridRef} className="w-full px-6 lg:px-12 pb-32 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-end border-b border-black/10 pb-8 mb-16">
        <h3 className="head-font text-4xl lg:text-5xl">The Pieces</h3>
        <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50">
          {products.length} Items
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 xl:gap-24">
        {products.map((product) => (
          <div key={product.id} className={`product-card group flex flex-col cursor-pointer ${product.offset}`}>
            <div className="relative w-full aspect-[4/5] overflow-hidden mb-6 bg-[#f0f0f0]">
              <img 
                src={product.image} 
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105"
              />
            </div>
            <div className="flex justify-between items-start">
              <h4 className="head-font text-2xl lg:text-3xl transition-colors group-hover:text-black/60">
                {product.name}
              </h4>
              <p className="text-[0.65rem] font-bold tracking-widest mt-1">
                {product.price}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CollectionGrid;
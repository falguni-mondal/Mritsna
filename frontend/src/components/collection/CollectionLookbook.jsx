import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Link } from "react-router-dom";

// The Dynamic Hotspot UI
const Hotspot = ({ topPercentage, leftPercentage, product }) => {
  // Fail-safe: if the linked product was deleted from the database, hide the pin
  if (!product) return null;

  // Extract the live price from the first variant
  const livePrice = product.variants?.[0]?.pricing?.price || 0;
  
  // Format the price (assuming Indian Rupees based on your dummy data)
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(livePrice);

  return (
    <div 
      className="absolute group z-10 -translate-x-1/2 -translate-y-1/2" 
      style={{ top: `${topPercentage}%`, left: `${leftPercentage}%` }}
    >
      {/* The Pulsing Pin */}
      <div className="relative flex items-center justify-center w-6 h-6 cursor-pointer">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white transition-transform group-hover:scale-150"></span>
      </div>
      
      {/* The Hover Popover */}
      <div className="absolute top-1/2 left-8 -translate-y-1/2 bg-white/95 backdrop-blur-sm px-4 py-3 min-w-[160px] opacity-0 -translate-x-4 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto shadow-xl">
        <h4 className="head-font text-lg text-black leading-none mb-1 truncate">
          {product.title}
        </h4>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[0.65rem] font-bold tracking-widest text-black/60">
            {formattedPrice}
          </p>
          <Link 
            to={`/product/${product.slug}`}
            className="text-[0.6rem] uppercase tracking-widest font-bold border-b border-black hover:text-black/60 transition-colors"
          >
            View Piece
          </Link>
        </div>
      </div>
    </div>
  );
};

const CollectionLookbook = ({ lookbookImage, lookbookHotspots }) => {
  const lookbookRef = useRef(null);

  useGSAP(() => {
    gsap.fromTo(".lookbook-img",
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 1.5, ease: "power3.out", scrollTrigger: {
        trigger: lookbookRef.current,
        start: "top 70%",
      }}
    );
  }, { scope: lookbookRef });

  return (
    <section ref={lookbookRef} className="relative w-full py-32 lg:py-48 px-6 lg:px-12 max-w-[1800px] mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-32">
      <div className="w-full lg:w-1/3 order-2 lg:order-1">
        <h2 className="head-font text-4xl lg:text-6xl leading-tight mb-8">
          Setting the <br className="hidden lg:block"/> Atmosphere
        </h2>
        <p className="text-sm font-medium text-black/60 leading-relaxed mb-10">
          We photograph our collections precisely as they are meant to be experienced. Interacting with the raw textures and cinematic lighting reveals the true weight of each piece in a living space.
        </p>
        <span className="text-[0.65rem] font-bold tracking-widest uppercase opacity-40 flex items-center gap-2">
          Hover over image to explore pieces
        </span>
      </div>

      <div className="w-full lg:w-2/3 order-1 lg:order-2 relative aspect-[4/5] md:aspect-[16/9] overflow-hidden bg-[#f0f0f0]">
        <div 
          className="lookbook-img w-full h-full bg-cover bg-center will-change-transform"
          style={{ backgroundImage: `url(${lookbookImage?.baseUrl}?tr=w-1600,q-80,f-webp)` }}
        />
        
        {/* Map the hotspots and pass the deep-populated product data */}
        {lookbookHotspots && lookbookHotspots.map(hotspot => (
          <Hotspot 
            key={hotspot._id} 
            topPercentage={hotspot.topPercentage} 
            leftPercentage={hotspot.leftPercentage}
            product={hotspot.product} 
          />
        ))}
      </div>
    </section>
  );
};

export default CollectionLookbook;
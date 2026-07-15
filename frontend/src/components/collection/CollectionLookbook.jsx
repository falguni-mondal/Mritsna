import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// The local Hotspot UI
const Hotspot = ({ top, left, title, price }) => (
  <div className="absolute group z-10" style={{ top, left }}>
    <div className="relative flex items-center justify-center w-6 h-6 cursor-pointer">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-white transition-transform group-hover:scale-150"></span>
    </div>
    
    <div className="absolute top-1/2 left-8 -translate-y-1/2 bg-white/95 backdrop-blur-sm px-4 py-3 min-w-[160px] opacity-0 -translate-x-4 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto">
      <h4 className="head-font text-lg text-black leading-none mb-1">{title}</h4>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[0.65rem] font-bold tracking-widest text-black/60">{price}</p>
        <button className="text-[0.6rem] uppercase tracking-widest font-bold border-b border-black hover:text-black/60 transition-colors">
          Quick Add
        </button>
      </div>
    </div>
  </div>
);

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
        <span className="text-[0.65rem] font-bold tracking-widest uppercase opacity-40">
          Hover over image to explore pieces
        </span>
      </div>

      <div className="w-full lg:w-2/3 order-1 lg:order-2 relative aspect-[4/5] md:aspect-[16/9] overflow-hidden">
        <div 
          className="lookbook-img w-full h-full bg-cover bg-center will-change-transform"
          style={{ backgroundImage: `url(${lookbookImage})` }}
        />
        {lookbookHotspots.map(hotspot => (
          <Hotspot key={hotspot.id} {...hotspot} />
        ))}
      </div>
    </section>
  );
};

export default CollectionLookbook;
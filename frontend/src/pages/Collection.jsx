import React, { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Icon } from "@iconify/react";

// Register ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// --- Dummy Data for Visualization ---
const collectionData = {
  title: "The Obsidian Series",
  subtitle: "Autumn / Winter 2026",
  description: "A study in raw texture and minimalist form. Fired at 1800°C, each piece absorbs ambient light, rendering deep, cinematic shadows that anchor the modern dining space.",
  heroImage: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=3200&auto=format&fit=crop",
  lookbookImage: "https://images.unsplash.com/photo-1578500494198-246f612b3b6d?q=80&w=2000&auto=format&fit=crop",
  lookbookHotspots: [
    { id: 1, top: "45%", left: "30%", title: "Obsidian Platter", price: "₹4,500" },
    { id: 2, top: "60%", left: "65%", title: "Matte Serving Bowl", price: "₹2,800" },
  ],
  products: [
    { id: "p1", name: "Obsidian Platter", price: "₹4,500", image: "https://images.unsplash.com/photo-1613521140785-e85e427f8002?q=80&w=800&auto=format&fit=crop", offset: "mt-0" },
    { id: "p2", name: "Tall Cylinder Vase", price: "₹5,200", image: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?q=80&w=800&auto=format&fit=crop", offset: "lg:mt-32" },
    { id: "p3", name: "Matte Serving Bowl", price: "₹2,800", image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop", offset: "lg:mt-16" },
  ]
};

// --- Hotspot Component ---
const Hotspot = ({ top, left, title, price }) => {
  return (
    <div className="absolute group z-10" style={{ top, left }}>
      {/* Pulsing Dot */}
      <div className="relative flex items-center justify-center w-6 h-6 cursor-pointer">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-white transition-transform group-hover:scale-150"></span>
      </div>
      
      {/* Expanding Tooltip */}
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
};

// --- Main Page Component ---
const Collection = () => {
  const containerRef = useRef(null);
  const heroImgRef = useRef(null);
  
  const [isAddingSet, setIsAddingSet] = useState(false);

  // GSAP Animations
  useGSAP(() => {
    const tl = gsap.timeline();

    // 1. Initial Hero Text Reveal
    tl.fromTo(".hero-reveal", 
      { opacity: 0, y: 40, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.5, stagger: 0.2, ease: "expo.out" }
    );

    // 2. Parallax Hero Image
    gsap.to(heroImgRef.current, {
      yPercent: 30,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "80% top",
        scrub: true,
      }
    });

    // 3. Lookbook Image Fade/Scale
    gsap.fromTo(".lookbook-img",
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 1.5, ease: "power3.out", scrollTrigger: {
        trigger: ".lookbook-section",
        start: "top 70%",
      }}
    );

    // 4. Asymmetric Grid Staggered Entrance
    gsap.fromTo(".product-card",
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.2, stagger: 0.15, ease: "power3.out", scrollTrigger: {
        trigger: ".product-grid",
        start: "top 75%",
      }}
    );
  }, { scope: containerRef });

  const handleShopSet = () => {
    setIsAddingSet(true);
    setTimeout(() => {
      setIsAddingSet(false);
      // Logic to dispatch multiple addToCart actions goes here
    }, 1500);
  };

  return (
    <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a]">
      
      {/* --- 1. The Immersive Hero --- */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* Parallax Background */}
        <div 
          ref={heroImgRef}
          className="absolute inset-[-10%] w-[120%] h-[120%] bg-cover bg-center will-change-transform"
          style={{ backgroundImage: `url(${collectionData.heroImage})` }}
        />
        <div className="absolute inset-0 bg-black/40" /> {/* Dark Overlay */}
        
        {/* Cinematic Typography */}
        <div className="absolute bottom-16 lg:bottom-24 left-6 lg:left-12 text-white z-10 max-w-4xl">
          <p className="hero-reveal text-[0.65rem] font-bold tracking-[0.3em] uppercase opacity-70 mb-6">
            {collectionData.subtitle}
          </p>
          <h1 className="hero-reveal head-font text-5xl md:text-7xl lg:text-[8rem] leading-[0.9] tracking-tight mb-8">
            {collectionData.title}
          </h1>
          <p className="hero-reveal text-sm md:text-base lg:text-lg font-medium opacity-80 leading-relaxed max-w-xl">
            {collectionData.description}
          </p>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 right-6 lg:right-12 flex flex-col items-center gap-4 opacity-50">
          <span className="text-[0.55rem] font-bold tracking-[0.2em] uppercase writing-vertical-rl rotate-180">
            Scroll
          </span>
          <div className="w-[1px] h-12 bg-white/50 overflow-hidden">
            <div className="w-full h-full bg-white animate-scroll-line origin-top" />
          </div>
        </div>
      </section>

      {/* --- 2. The Interactive Lookbook --- */}
      <section className="lookbook-section relative w-full py-32 lg:py-48 px-6 lg:px-12 max-w-[1800px] mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-32">
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
            style={{ backgroundImage: `url(${collectionData.lookbookImage})` }}
          />
          {collectionData.lookbookHotspots.map(hotspot => (
            <Hotspot key={hotspot.id} {...hotspot} />
          ))}
        </div>
      </section>

      {/* --- 3. The Asymmetric Roster (Product Grid) --- */}
      <section className="product-grid w-full px-6 lg:px-12 pb-32 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-end border-b border-black/10 pb-8 mb-16">
          <h3 className="head-font text-4xl lg:text-5xl">The Pieces</h3>
          <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50">
            {collectionData.products.length} Items
          </span>
        </div>

        {/* Editorial Asymmetric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 xl:gap-24">
          {collectionData.products.map((product) => (
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

      {/* --- 4. The Collective Anchor (Shop the Set) --- */}
      <section className="w-full bg-[#1a1a1a] text-white py-24 lg:py-32 px-6 lg:px-12">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-16">
          
          <div className="w-full lg:w-1/2">
            <h2 className="head-font text-5xl lg:text-7xl mb-8">Acquire the <br className="hidden lg:block"/> Complete Look</h2>
            <ul className="flex flex-col gap-4 text-sm font-medium text-white/60">
              <li className="flex items-center gap-4"><Icon icon="ph:check-light" className="text-xl text-white/40" /> 1x Obsidian Platter</li>
              <li className="flex items-center gap-4"><Icon icon="ph:check-light" className="text-xl text-white/40" /> 2x Tall Cylinder Vase</li>
              <li className="flex items-center gap-4"><Icon icon="ph:check-light" className="text-xl text-white/40" /> 4x Textured Dinner Plate</li>
              <li className="flex items-center gap-4"><Icon icon="ph:plus-light" className="text-xl text-white/40" /> 3 additional curated pieces</li>
            </ul>
          </div>

          <div className="w-full lg:w-auto flex flex-col items-start lg:items-end border-t border-white/20 lg:border-none pt-12 lg:pt-0">
            <span className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-2">Curated Bundle Price</span>
            <span className="head-font text-4xl lg:text-5xl mb-10">₹22,900</span>
            
            <button 
              onClick={handleShopSet}
              disabled={isAddingSet}
              className="w-full lg:w-[300px] h-14 bg-white text-[#1a1a1a] flex items-center justify-center gap-3 text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-white/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isAddingSet ? (
                <><Icon icon="ph:spinner-gap-light" className="animate-spin text-lg" /> Curating...</>
              ) : (
                "Add Collection to Cart"
              )}
            </button>
          </div>
          
        </div>
      </section>
      
    </main>
  );
};

export default Collection;
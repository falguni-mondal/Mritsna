import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Zoom } from "swiper/modules";

// Swiper Styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/zoom";

const productData = {
  id: 1,
  name: "Textured Vase",
  price: "₹ 1,200.00",
  category: "Vessels",
  stock: 3, 
  description: "A handcrafted ceramic vase featuring a raw, tactile surface. Thrown on the wheel and fired at high temperatures to ensure durability, this piece brings an earthy, minimalist elegance to any interior space.",
  details: {
    dimensions: "H 24cm x W 15cm",
    material: "Stoneware clay with a matte transparent glaze.",
    care: "Hand wash recommended. Do not microwave."
  },
  images: [
    "/hero_product.png",
    "/hero_product.png", 
    "/hero_product.png",
    "/hero_product.png",
    "/hero_product.png"
  ]
};

const Product = () => {
  const containerRef = useRef(null);
  
  // States
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState("dimensions");
  
  // Desktop Zoom State
  const [desktopZoom, setDesktopZoom] = useState({ show: false, img: "", x: 0, y: 0 });
  
  // Mobile Swiper & Zoom States
  const [isMobileZoomOpen, setIsMobileZoomOpen] = useState(false);
  const [mobileInitialSlide, setMobileInitialSlide] = useState(0);
  const [currentMobileSlide, setCurrentMobileSlide] = useState(1);

  // CTA Ripple Refs
  const buyBtnRef = useRef(null);
  const buyRippleRef = useRef(null);
  const buyTextDarkRef = useRef(null);
  const buyTextLightRef = useRef(null);

  // Enforce functional limits based on stock and minimum value (1)
  const handleQuantity = (type) => {
    if (type === "dec" && quantity > 1) {
      setQuantity(quantity - 1);
    }
    if (type === "inc" && quantity < productData.stock) {
      setQuantity(quantity + 1);
    }
  };

  // --- Desktop Zoom Math ---
  const handleMouseMove = (e, img) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setDesktopZoom({ show: true, img, x, y });
  };

  // --- GSAP Animations (Extracted contextSafe for hover events) ---
  const { contextSafe } = useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.2 });

    tl.fromTo(".product-image", 
      { opacity: 0, y: 50, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 1.2, stagger: 0.15, ease: "power3.out" }
    )
    .fromTo(".product-info-item",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power2.out" },
      "-=2.0" 
    );
  }, { scope: containerRef });

  // --- Buy Button Ripple Logic ---
  const handleBuyMouseEnter = contextSafe((e) => {
    const rect = buyBtnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.set(buyRippleRef.current, { x: x, y: y, scale: 0 });
    gsap.to(buyRippleRef.current, { scale: 1, duration: 0.5, ease: "power3.out" });

    gsap.to(buyTextDarkRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
    gsap.to(buyTextLightRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
  });

  const handleBuyMouseLeave = contextSafe((e) => {
    const rect = buyBtnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(buyRippleRef.current, { scale: 0, x: x, y: y, duration: 0.5, ease: "power3.out" });

    gsap.to(buyTextDarkRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
    gsap.to(buyTextLightRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
  });

  return (
    <>
      <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-[80px] lg:pt-[100px] pb-20">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* ========================================= */}
          {/* LEFT COLUMN: DESKTOP EDITORIAL GALLERY */}
          {/* ========================================= */}
          <div className="hidden lg:grid w-full lg:w-[55%] grid-cols-2 gap-4 pb-32">
            {productData.images.map((img, index) => {
              const colSpanClass = index === 0 ? "col-span-2" : "col-span-1";

              return (
                <div 
                  key={index} 
                  className={`product-image ${colSpanClass} aspect-[4/5] bg-[#eeeeee] overflow-hidden rounded-[2px] relative cursor-crosshair group`}
                  onMouseEnter={() => setDesktopZoom((prev) => ({ ...prev, show: true, img }))}
                  onMouseMove={(e) => handleMouseMove(e, img)}
                  onMouseLeave={() => setDesktopZoom((prev) => ({ ...prev, show: false }))}
                >
                  <img src={img} alt={`Angle ${index + 1}`} className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105" />
                </div>
              );
            })}
          </div>

          {/* ========================================= */}
          {/* LEFT COLUMN: MOBILE SWIPER */}
          {/* ========================================= */}
          <div className="block lg:hidden w-full mb-4 relative">
            
            {/* Custom Editorial Fraction Pagination */}
            <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-[0.6rem] font-bold tracking-[0.2em] text-[#1a1a1a] shadow-sm flex items-center gap-1">
              <span>{currentMobileSlide < 10 ? `0${currentMobileSlide}` : currentMobileSlide}</span>
              <span className="opacity-40 font-light">/</span>
              <span className="opacity-40">{productData.images.length < 10 ? `0${productData.images.length}` : productData.images.length}</span>
            </div>

            <Swiper 
              onSlideChange={(swiper) => setCurrentMobileSlide(swiper.realIndex + 1)}
              className="w-full aspect-[4/5] product-image"
            >
              {productData.images.map((img, index) => (
                <SwiperSlide key={index} onClick={() => {
                  setMobileInitialSlide(index);
                  setIsMobileZoomOpen(true);
                }}>
                  <img src={img} alt={`Angle ${index + 1}`} className="w-full h-full object-cover rounded-[2px]" />
                  <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur text-black p-2 rounded-full shadow-lg text-xs flex items-center justify-center">
                    <Icon icon="iconamoon:zoom-in-light" className="text-lg" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* ========================================= */}
          {/* RIGHT COLUMN: STICKY CONSOLE & ZOOM */}
          {/* ========================================= */}
          <div className="w-full lg:w-[45%] relative">
            <div className="lg:sticky lg:top-[120px] flex flex-col items-start w-full lg:max-w-[500px]">
              
              <div className={`transition-opacity duration-300 w-full ${desktopZoom.show ? "lg:opacity-0 pointer-events-none" : "opacity-100"}`}>
                
                <div className="product-info-item flex items-center gap-2 text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-8">
                  <Link to="/" className="hover:opacity-100 transition-opacity">Home</Link>
                  <span>/</span>
                  <Link to="/shop" className="hover:opacity-100 transition-opacity">Shop</Link>
                  <span>/</span>
                  <span>{productData.category}</span>
                </div>

                <h1 className="product-info-item head-font text-4xl lg:text-5xl tracking-wide mb-4">
                  {productData.name}
                </h1>
                
                <div className="product-info-item text-lg tracking-widest font-light mb-8">
                  {productData.price}
                </div>

                <p className="product-info-item text-sm lg:text-base font-light opacity-80 leading-relaxed mb-10 w-full lg:w-[90%]">
                  {productData.description}
                </p>

                {/* Add to Cart Actions */}
                <div className="product-info-item w-full flex flex-col gap-4 mb-12">
                  <div className="flex gap-4 h-14">
                    
                    {/* Quantity Controls with Disabled States */}
                    <div className="flex items-center justify-between border border-black/10 px-4 w-32 shrink-0">
                      
                      <button 
                        onClick={() => handleQuantity("dec")} 
                        disabled={quantity <= 1}
                        className={`p-2 transition-opacity ${quantity <= 1 ? "opacity-20 cursor-not-allowed" : "opacity-50 hover:opacity-100"}`}
                      >
                        <Icon icon="ph:minus" />
                      </button>
                      
                      <span className="text-sm font-medium">{quantity}</span>
                      
                      <button 
                        onClick={() => handleQuantity("inc")} 
                        disabled={quantity >= productData.stock}
                        className={`p-2 transition-opacity ${quantity >= productData.stock ? "opacity-20 cursor-not-allowed" : "opacity-50 hover:opacity-100"}`}
                      >
                        <Icon icon="ph:plus" />
                      </button>

                    </div>

                    <button className="flex-1 bg-[#1a1a1a] text-white text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors">
                      Add to Cart
                    </button>
                    <button className="w-14 border border-black/10 flex items-center justify-center text-xl hover:bg-black/5 transition-colors">
                      <Icon icon="ph:heart-light" />
                    </button>
                  </div>
                  
                  {/* THE FIX: Animated "Buy it now" Ripple Button */}
                  <button 
                    ref={buyBtnRef}
                    onMouseEnter={handleBuyMouseEnter}
                    onMouseLeave={handleBuyMouseLeave}
                    className="relative overflow-hidden w-full h-14 border border-[#1a1a1a] flex items-center justify-center group"
                  >
                    {/* The Ripple */}
                    <div 
                      ref={buyRippleRef} 
                      className="absolute bg-[#1a1a1a] rounded-full pointer-events-none z-0"
                      style={{ width: '1000px', height: '1000px', top: '-500px', left: '-500px', transform: 'scale(0)' }}
                    />

                    {/* Dark Text (Visible initially) */}
                    <span ref={buyTextDarkRef} className="absolute inset-0 z-10 flex items-center justify-center text-[0.65rem] font-bold tracking-[0.2em] uppercase text-[#1a1a1a]">
                      Buy it now
                    </span>

                    {/* Light Text (Revealed on hover) */}
                    <span ref={buyTextLightRef} className="absolute inset-0 z-10 flex items-center justify-center text-[0.65rem] font-bold tracking-[0.2em] uppercase text-white opacity-0">
                      Buy it now
                    </span>

                    {/* Invisible Placeholder to maintain button height/width structure */}
                    <span className="invisible text-[0.65rem] font-bold tracking-[0.2em] uppercase">
                      Buy it now
                    </span>
                  </button>

                </div>

                {/* Accordion */}
                <div className="product-info-item w-full border-t border-black/10 flex flex-col">
                  {Object.entries(productData.details).map(([key, value]) => (
                    <div key={key} className="w-full border-b border-black/10 overflow-hidden">
                      <button onClick={() => setOpenAccordion(openAccordion === key ? "" : key)} className="w-full py-5 flex items-center justify-between text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-80 hover:opacity-100 transition-opacity">
                        {key}
                        <Icon icon="ph:plus" className={`text-lg transition-transform duration-500 ${openAccordion === key ? "rotate-45" : ""}`} />
                      </button>
                      <div className={`text-sm font-light leading-relaxed opacity-70 transition-all duration-500 ease-in-out ${openAccordion === key ? "max-h-40 pb-5 opacity-70" : "max-h-0 opacity-0 pointer-events-none"}`}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DESKTOP ZOOM LENS */}
              <div 
                className={`hidden lg:block absolute inset-0 w-full h-[600px] bg-[#f8f8f8] z-10 transition-opacity duration-300 pointer-events-none overflow-hidden rounded-[2px]
                  ${desktopZoom.show ? "opacity-100" : "opacity-0"}
                `}
                style={{
                  backgroundImage: `url(${desktopZoom.img})`,
                  backgroundPosition: `${desktopZoom.x}% ${desktopZoom.y}%`,
                  backgroundSize: '400%',
                  backgroundRepeat: 'no-repeat'
                }}
              />

            </div>
          </div>

        </div>
      </main>

      {/* MOBILE FULLSCREEN ZOOM MODAL */}
      <div 
        className={`fixed inset-0 z-[999999] bg-black transition-opacity duration-500 flex flex-col
          ${isMobileZoomOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        <div className="w-full p-6 flex justify-end absolute top-0 z-10">
          <button 
            onClick={() => setIsMobileZoomOpen(false)}
            className="text-white bg-black/50 backdrop-blur p-3 rounded-full hover:bg-white/20 transition-colors"
          >
            <Icon icon="ph:x" className="text-xl" />
          </button>
        </div>
        
        <div className="flex-1 w-full h-full flex items-center justify-center">
          {isMobileZoomOpen && (
            <Swiper 
              modules={[Pagination, Zoom]} 
              zoom={true}
              initialSlide={mobileInitialSlide}
              pagination={{ clickable: true }} 
              className="w-full h-full my-my-swiper"
            >
              {productData.images.map((img, index) => (
                <SwiperSlide key={index} className="flex items-center justify-center">
                  <div className="swiper-zoom-container">
                    <img src={img} alt="Zoomed" className="max-w-full max-h-full object-contain" />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </div>
    </>
  );
};

export default Product;
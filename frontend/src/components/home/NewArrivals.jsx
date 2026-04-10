import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
// Swiper Imports
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Custom helper to split text into individually animatable words
const SplitText = ({ children, className = "" }) => {
  if (typeof children !== "string") return <span className={className}>{children}</span>;
  
  return (
    <span className={`inline-block ${className}`}>
      {children.split(" ").map((word, index) => (
        <span key={index} className="inline-block mr-[0.25em] whitespace-nowrap">
          <span className="reveal-word inline-block will-change-[transform,filter,opacity]">
            {word}
          </span>
        </span>
      ))}
    </span>
  );
};

const NewArrivals = () => {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const sliderWrapperRef = useRef(null);

  // Dummy data
  const products = [
    { id: 1, name: "Textured Vase", price: "₹ 1,200.00", img: "/hero_product.png" },
    { id: 2, name: "Minimalist Bowl", price: "₹ 850.00", img: "/hero_product.png" },
    { id: 3, name: "Clay Serving Platter", price: "₹ 1,400.00", img: "/hero_product.png" },
    { id: 4, name: "Artisan Mug Set", price: "₹ 900.00", img: "/hero_product.png" },
    { id: 5, name: "Decorative Base", price: "₹ 1,100.00", img: "/hero_product.png" },
    { id: 6, name: "Earthy Planter", price: "₹ 1,600.00", img: "/hero_product.png" },
  ];

  useGSAP(() => {
    const words = gsap.utils.toArray(".reveal-word", headingRef.current);
    let mm = gsap.matchMedia();

    // ==========================================
    // DESKTOP: Triggers optimized for wide screens
    // ==========================================
    mm.add("(min-width: 1024px)", () => {
      // --- Reveal Animations ---
      gsap.fromTo(
        words,
        { opacity: 0, y: 40, filter: "blur(12px)", scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          scale: 1,
          duration: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%", 
            toggleActions: "play none none reverse" 
          },
        }
      );

      gsap.fromTo(
        sliderWrapperRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headingRef.current, 
            start: "top 60%",
            toggleActions: "play none none reverse"
          },
        }
      );
    });

    // ==========================================
    // MOBILE: Triggers optimized for tall screens
    // ==========================================
    mm.add("(max-width: 1023px)", () => {
      gsap.fromTo(
        words,
        { opacity: 0, y: 40, filter: "blur(12px)", scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          scale: 1,
          duration: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 50%", 
            toggleActions: "play none none reverse" 
          },
        }
      );

      gsap.fromTo(
        sliderWrapperRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: headingRef.current, 
            start: "top 50%", 
            toggleActions: "play none none reverse"
          },
        }
      );
    });

    return () => mm.revert();
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-32 pb-20 overflow-hidden relative cursor-auto"
      id="new-arrivals"
    >
      <div className="w-full px-6 lg:px-10 mb-14 lg:mb-20 pointer-events-none">
        <div ref={headingRef} className="relative inline-block mt-10 lg:mt-0">
          <span className="absolute left-1 lg:top-4 lg:left-2 text-xs lg:text-base font-bold tracking-[0.2em] uppercase">
            <SplitText>New</SplitText>
          </span>
          <h2 className="head-font text-6xl md:text-8xl lg:text-[8rem] leading-none tracking-tighter">
            <SplitText>arrivals</SplitText>
          </h2>
        </div>
      </div>

      <div ref={sliderWrapperRef} className="w-full pl-6 lg:pl-10">
        <Swiper
          breakpoints={{
            0: { slidesPerView: 1.2, spaceBetween: 16 },
            768: { slidesPerView: 2.5, spaceBetween: 24 },
            1024: { slidesPerView: 4.5, spaceBetween: 10 },
          }}
          className="w-full pb-10" 
        >
          {products.map((product) => (
            <SwiperSlide key={`product-${product.id}`}>
              <Link
                to={`/product/${product.id}`}
                data-cursor="explore" // Connects to your Global CustomCursor
                className="group flex flex-col block w-full cursor-none lg:cursor-none"
              >
                <div className="w-full aspect-[4/5] bg-[#eeeeee] flex items-center justify-center overflow-hidden transition-colors duration-500 group-hover:bg-[#e4e4e4]">
                  <img
                    src={product.img}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-col items-start mt-4 lg:mt-5 text-sm lg:text-base tracking-wide font-medium pointer-events-none">
                  <h3 className="">
                    {product.name}
                  </h3>
                  <span className="mt-1 text-xs lg:text-sm font-medium">
                    {product.price}
                  </span>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default NewArrivals;
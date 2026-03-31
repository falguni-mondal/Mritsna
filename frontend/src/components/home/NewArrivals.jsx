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

const NewArrivals = () => {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const sliderWrapperRef = useRef(null);

  // Dummy data. Replace image paths with your actual pottery images!
  const products = [
    { id: 1, name: "Textured Vase", price: "₹ 1,200.00", img: "/hero_product.png" },
    { id: 2, name: "Minimalist Bowl", price: "₹ 850.00", img: "/hero_product.png" },
    { id: 3, name: "Clay Serving Platter", price: "₹ 1,400.00", img: "/hero_product.png" },
    { id: 4, name: "Artisan Mug Set", price: "₹ 900.00", img: "/hero_product.png" },
    { id: 5, name: "Decorative Base", price: "₹ 1,100.00", img: "/hero_product.png" },
    { id: 6, name: "Earthy Planter", price: "₹ 1,600.00", img: "/hero_product.png" },
  ];

  useGSAP(() => {
    // 1. Reveal the heading when scrolling into view
    gsap.fromTo(
      headingRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%", 
        },
      }
    );

    // 2. Reveal the entire slider container gently
    gsap.fromTo(
      sliderWrapperRef.current,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headingRef.current, // Triggers just after the heading appears
          start: "top 60%", 
        },
      }
    );
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-32 pb-20 overflow-hidden"
      id="new-arrivals"
    >
      <div className="w-full px-6 lg:px-10 mb-12 lg:mb-20">
        {/* Editorial Typography Lockup */}
        <div ref={headingRef} className="relative inline-block mt-10 lg:mt-0 opacity-0">
          <span className="absolute left-1 lg:top-4 lg:left-2 text-xs lg:text-base font-bold tracking-[0.2em] uppercase">
            New
          </span>
          <h2 className="head-font text-6xl md:text-8xl lg:text-[7rem] font-bold tracking-tight lowercase leading-none">
            arrivals
          </h2>
        </div>
      </div>

      {/* Swiper Slider Container */}
      <div ref={sliderWrapperRef} className="w-full pl-6 lg:pl-10 opacity-0">
        <Swiper
          grabCursor={true}
          // Native Swiper breakpoints are much more reliable than Tailwind widths for slides
          breakpoints={{
            // Mobile: Shows 1 full slide, and 20% of the next one
            0: {
              slidesPerView: 1.2,
              spaceBetween: 16,
            },
            // Tablet: Shows 2 full slides, and 50% of the next one
            768: {
              slidesPerView: 2.5,
              spaceBetween: 24,
            },
            // Desktop: Shows 3 full slides, and 50% of the next one
            1024: {
              slidesPerView: 4.5,
              spaceBetween: 10,
            },
          }}
          className="w-full pb-10" 
        >
          {products.map((product) => (
            <SwiperSlide key={`product-${product.id}`}>
              <Link
                to={`/product/${product.id}`}
                className="group flex flex-col cursor-pointer block w-full"
              >
                {/* Product Background */}
                <div className="w-full aspect-4/5 bg-[#eeeeee] flex items-center justify-center overflow-hidden transition-colors duration-500 group-hover:bg-[#e4e4e4]">
                  <img
                    src={product.img}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                {/* Product Meta - Updated to stack vertically */}
                <div className="flex flex-col items-start mt-4 lg:mt-5 text-sm lg:text-base tracking-wide font-medium">
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
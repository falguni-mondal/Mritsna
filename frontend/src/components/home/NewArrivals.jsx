import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Icon } from "@iconify/react";

// Redux
import { fetchNewArrivals } from "../../store/features/productSlice";

// Swiper Imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
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
  const dispatch = useDispatch();
  
  // Pull the live data from your Redux store
  const { newArrivals, isLoading } = useSelector((state) => state.product);

  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const sliderWrapperRef = useRef(null);
  
  // State to hold the Swiper instance for custom navigation
  const [swiperInstance, setSwiperInstance] = useState(null);

  // Fetch the data when the component mounts
  useEffect(() => {
    dispatch(fetchNewArrivals());
  }, [dispatch]);

  // Re-calculate ScrollTrigger when newArrivals load so animations don't trigger in the wrong place
  useEffect(() => {
    if (newArrivals.length > 0) {
      ScrollTrigger.refresh();
    }
  }, [newArrivals]);

  useGSAP(() => {
    const words = gsap.utils.toArray(".reveal-word", headingRef.current);
    let mm = gsap.matchMedia();

    // ==========================================
    // DESKTOP: Triggers optimized for wide screens
    // ==========================================
    mm.add("(min-width: 1024px)", () => {
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

      <div ref={sliderWrapperRef} className="w-full pl-6 lg:pl-10 min-h-[400px]">
        {isLoading && newArrivals.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400">
            <Icon icon="lucide:loader-2" className="animate-spin" width="32" />
          </div>
        ) : (
          <>
            <Swiper
              modules={[Autoplay]} 
              onSwiper={setSwiperInstance}
              loop={newArrivals.length > 4} // Only loop if we have enough products to fill the screen
              observer={true} // Crucial: Tells swiper to update if children (async data) changes
              observeParents={true}
              speed={800} 
              autoplay={{
                delay: 3000, 
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              breakpoints={{
                0: { slidesPerView: 1.2, spaceBetween: 16 },
                768: { slidesPerView: 2.5, spaceBetween: 24 },
                1024: { slidesPerView: 4.5, spaceBetween: 10 },
              }}
              className="w-full pb-6" 
            >
              {newArrivals.map((product) => (
                <SwiperSlide key={product.id}>
                  <Link
                    to={`/product/${product.slug}`} // Using slug for SEO friendly URLs
                    data-cursor="explore" 
                    className="group flex flex-col block w-full cursor-none lg:cursor-none"
                  >
                    <div className="w-full aspect-[4/5] bg-[#eeeeee] flex items-center justify-center overflow-hidden transition-colors duration-500 group-hover:bg-[#e4e4e4] relative">
                      
                      {/* Premium Badge */}
                      {product.isPremium && (
                        <div className="absolute top-3 left-3 z-10 bg-black text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">
                          Premium
                        </div>
                      )}
                      
                      <img
                        src={product.img ? `${product.img}?tr=w-600,q-80` : "/hero_product.png"} // Using ImageKit transformations if available
                        alt={product.alt || product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex flex-col items-start mt-4 lg:mt-5 text-sm lg:text-base tracking-wide font-medium pointer-events-none">
                      <h3 className="line-clamp-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs lg:text-sm font-medium">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.finalPrice)}
                        </span>
                        
                        {/* Show original price with strikethrough if there's a discount */}
                        {product.discount > 0 && (
                          <span className="text-[10px] lg:text-xs text-gray-400 line-through">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(product.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Custom Navigation Arrows */}
            <div className="flex justify-center gap-4 pr-6 lg:pr-10 mt-6 lg:mt-10">
              <button 
                onClick={() => swiperInstance?.slidePrev()}
                className="w-12 h-12 flex items-center justify-center rounded-full border border-gray-300 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all duration-300"
                aria-label="Previous slide"
              >
                <Icon icon="lucide:arrow-left" width="20" />
              </button>
              <button 
                onClick={() => swiperInstance?.slideNext()}
                className="w-12 h-12 flex items-center justify-center rounded-full border border-gray-300 text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all duration-300"
                aria-label="Next slide"
              >
                <Icon icon="lucide:arrow-right" width="20" />
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default NewArrivals;
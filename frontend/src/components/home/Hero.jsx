import React, { useRef } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

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

const Hero = () => {
  const containerRef = useRef(null);
  const bgRef = useRef(null); // Ref for the parallax background
  const subheadingRef = useRef(null);
  const exclusiveTextRef = useRef(null);
  const productCardRef = useRef(null);

  // CTA Refs
  const ctaRef = useRef(null);
  const rippleRef = useRef(null);
  const ctaTextDarkRef = useRef(null);
  const ctaTextLightRef = useRef(null);
  const ctaIconDarkRef = useRef(null);
  const ctaIconLightRef = useRef(null);

  const { contextSafe } = useGSAP(() => {
    // ==========================================
    // 1. Background Parallax Animation
    // ==========================================
    gsap.to(bgRef.current, {
      yPercent: 20, // Moves the background down smoothly by 20% as you scroll
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "bottom top", // Parallax continues until the hero leaves the screen
        scrub: true,
      }
    });

    // ==========================================
    // 2. Load Sequence Animations
    // ==========================================
    const words = gsap.utils.toArray(".reveal-word", containerRef.current);

    gsap.set([subheadingRef.current, exclusiveTextRef.current], { 
      autoAlpha: 0, 
      y: 20, 
      filter: "blur(6px)" 
    });
    gsap.set(ctaRef.current, { autoAlpha: 0, y: 20 });
    gsap.set(productCardRef.current, { autoAlpha: 0, y: 30 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(words,
      { opacity: 0, y: 30, filter: "blur(12px)", scale: 0.95 },
      { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, duration: 1.2, stagger: 0.1 }
    )
    .to([subheadingRef.current, exclusiveTextRef.current], {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 1.2,
      stagger: 0.1
    }, "-=0.8") 
    .to(ctaRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: 1,
    }, "-=1.0")
    .to(productCardRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: 1.2,
    }, "-=1.0");
    
  }, { scope: containerRef });

  const handleMouseEnter = contextSafe((e) => {
    const rect = ctaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.set(rippleRef.current, { x: x, y: y, scale: 0 });
    gsap.to(rippleRef.current, { scale: 1, duration: 0.5, ease: "power3.out" });

    gsap.to(ctaTextDarkRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
    gsap.to(ctaTextLightRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
    gsap.to([ctaIconDarkRef.current, ctaIconLightRef.current], { rotation: -35, duration: 0.3, ease: "power2.out" });
  });

  const handleMouseLeave = contextSafe((e) => {
    const rect = ctaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    gsap.to(rippleRef.current, { scale: 0, x: x, y: y, duration: 0.5, ease: "power3.out" });

    gsap.to(ctaTextDarkRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
    gsap.to(ctaTextLightRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
    gsap.to([ctaIconDarkRef.current, ctaIconLightRef.current], { rotation: 0, duration: 0.3, ease: "power2.out" });
  });

  return (
    <section
      ref={containerRef}
      className="w-full min-h-[100dvh] lg:h-[100dvh] relative flex flex-col lg:flex-row justify-between pt-20 md:pt-32 lg:pt-0 px-6 md:px-12 lg:px-24 txt-light pb-5 lg:pb-0"
      id="home-hero"
    >
      {/* ========================================== */}
      {/* HARDWARE ACCELERATED PARALLAX BACKGROUND     */}
      {/* ========================================== */}
      <div className="absolute inset-0 w-full h-full overflow-hidden -z-20 pointer-events-none">
        {/* We make the image container 125% height and pull it up slightly. 
          This gives it physical room to slide down on scroll without showing a blank gap at the bottom. 
        */}
        <div 
          ref={bgRef}
          className="absolute -top-[15%] left-0 w-full h-[125%] bg-cover bg-center bg-no-repeat will-change-transform"
          style={{ backgroundImage: 'url("/hero.png")' }}
        />
        {/* Your dark gradient overlay applied safely over the sliding image */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.3),rgba(0,0,0,0.0))]" />
      </div>

      <div className="hero-left flex flex-col justify-center">
        <div className="hero-heading-container w-full mb-6 md:mb-10 lg:mb-8 mt-4 lg:mt-0">
          <h1 className="hero-heading text-[3.5rem] md:text-7xl lg:text-[6.5rem] tracking-tight lg:tracking-tighter leading-[0.95] lg:leading-[0.9] head-font flex flex-col">
            <div className="pb-1"><SplitText>Crafted in silence.</SplitText></div>
            <div className="pb-1"><SplitText>Felt in every detail.</SplitText></div>
          </h1>
        </div>

        <div ref={subheadingRef} className="hero-subheading text-sm md:text-lg lg:text-base font-light w-full lg:w-[45ch] mb-8 md:mb-12 lg:mb-10 txt-light opacity-80 leading-relaxed">
          Handcrafted pottery designed to bring warmth, texture, and timeless
          elegance into your space.
        </div>

        <div className="hero-CTA uppercase">
          <Link
            to="/shop"
            ref={ctaRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative inline-flex items-center justify-center w-44 md:w-56 lg:w-48 py-4 md:py-6 lg:py-4 rounded bg-light shadow-lg overflow-hidden group"
          >
            <div 
              ref={rippleRef} 
              className="absolute bg-dark rounded-full pointer-events-none z-0"
              style={{ width: '400px', height: '400px', top: '-200px', left: '-200px', transform: 'scale(0)' }}
            />

            <span ref={ctaTextDarkRef} className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-[0.6rem] md:text-[0.8rem] lg:text-[0.7rem] tracking-[0.05em] font-semibold txt-dark">
              explore now 
              <div ref={ctaIconDarkRef} className="flex items-center justify-center">
                <Icon className="text-sm md:text-lg lg:text-sm" icon="iconamoon:arrow-right-1" />
              </div>
            </span>

            <span ref={ctaTextLightRef} className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-[0.6rem] md:text-[0.8rem] lg:text-[0.7rem] tracking-[0.05em] font-semibold txt-light opacity-0">
              explore now 
              <div ref={ctaIconLightRef} className="flex items-center justify-center">
                <Icon className="text-sm md:text-lg lg:text-sm" icon="iconamoon:arrow-right-1" />
              </div>
            </span>

            <span className="invisible flex items-center gap-2 text-[0.6rem] md:text-[0.8rem] lg:text-[0.7rem] tracking-[0.05em] font-semibold">
              explore now 
              <div className="flex items-center justify-center">
                <Icon className="text-sm md:text-lg lg:text-sm" icon="iconamoon:arrow-right-1" />
              </div>
            </span>
          </Link>
        </div>
      </div>

      <div className="hero-right flex flex-col lg:items-end justify-end mt-16 md:mt-20 lg:mt-0 mb-2 lg:mb-12">
        <div className="mb-4 lg:mb-6">
          <h2 ref={exclusiveTextRef} className="uppercase text-[0.6rem] md:text-[0.7rem] lg:text-[0.65rem] font-bold tracking-[0.3em] txt-light opacity-60">
            Exclusive of this month
          </h2>
        </div>

        <Link
          to="/"
          ref={productCardRef}
          className="relative group w-full md:w-[28rem] lg:w-[22rem] flex flex-row lg:flex-col items-center lg:items-start gap-5 lg:gap-4 txt-light"
        >
          <div
            className="w-24 md:w-32 lg:w-full aspect-[4/5] rounded-[2px] overflow-hidden shrink-0 bg-[#1a1a1a]"
            id="hero-product-img"
          >
            <img
              className="w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
              src="/hero_product.png"
              alt="hero-product"
            />
          </div>

          <div className="flex flex-col lg:flex-row justify-center lg:justify-between lg:items-end w-full lg:px-1 flex-1">
            <div className="flex flex-col">
              <span className="uppercase text-[0.55rem] md:text-[0.65rem] tracking-[0.2em] font-medium opacity-60 mb-1 lg:mb-1.5">
                Study No. 01
              </span>
              <h2 className="text-lg md:text-xl lg:text-xl head-font tracking-wide mb-2 lg:mb-0">
                Alpha Product
              </h2>
            </div>

            <div className="text-xs md:text-sm tracking-widest font-light border-b border-[rgba(248,248,248,0.3)] pb-1 w-fit">
              ₹ 140.00
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default Hero;
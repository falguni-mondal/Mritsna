import React, { useRef } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const Hero = () => {
  const containerRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
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
    // 1. Headings, Subheading, AND Exclusive Text all start invisible, shifted down, and heavily blurred
    gsap.set([line1Ref.current, line2Ref.current], { 
      autoAlpha: 0, 
      y: 40, 
      filter: "blur(12px)" 
    });
    
    gsap.set([subheadingRef.current, exclusiveTextRef.current], { 
      autoAlpha: 0, 
      y: 40, 
      filter: "blur(6px)" 
    });

    // 2. CTA button gets a standard fade state
    gsap.set(ctaRef.current, { autoAlpha: 0, y: 30 });
    
    // 3. Product Card initial state (with backdrop filter fix)
    gsap.set(productCardRef.current, { 
      autoAlpha: 0, 
      y: 30,
      backdropFilter: "blur(0px)",
      webkitBackdropFilter: "blur(0px)"
    });

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    // 1. Reveal main headings: Fade in, slide up, and un-blur
    tl.to([line1Ref.current, line2Ref.current], {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 1.4,
      stagger: 0.2, 
    })
    
    // Create a timing label so the next elements sync up perfectly
    .add("secondaryReveal", "-=1.0")
    
    // 2. Blur reveal for Subheading and Exclusive text (they happen exactly together)
    .to([subheadingRef.current, exclusiveTextRef.current], {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 1.2,
      ease: "power3.out",
    }, "secondaryReveal") 
    
    // 3. Fade in CTA button (starts 0.1s after the subheading begins)
    .to(ctaRef.current, {
      autoAlpha: 1,
      y: 0,
      duration: 1,
      ease: "power3.out",
    }, "secondaryReveal+=0.1")
    
    // 4. Fade, float, AND blur the card simultaneously (starts 0.15s after the subheading begins)
    .to(productCardRef.current, {
      autoAlpha: 1,
      y: 0,
      backdropFilter: "blur(12px)",
      webkitBackdropFilter: "blur(12px)",
      duration: 1.2,
      ease: "power3.out", 
    }, "secondaryReveal+=0.15");
    
  }, { scope: containerRef });

  // Directional Hover Animation for CTA
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
      className="w-full h-[100dvh] relative flex flex-col lg:flex-row justify-between pt-20 md:pt-32 lg:pt-0 px-6 md:px-12 lg:px-48 txt-light"
      id="home-hero"
    >
      <div className="hero-left flex flex-col justify-center">
        <div className="hero-heading-container w-full mb-6 md:mb-10 lg:mb-6">
          <h1 className="hero-heading text-6xl md:text-6xl lg:text-6xl head-font flex flex-col">
            <div ref={line1Ref} className="leading-none lg:pb-1">Crafted in Silence.</div>
            <div ref={line2Ref} className="leading-none lg:pb-1">Felt in Every Detail.</div>
          </h1>
        </div>

        <div ref={subheadingRef} className="hero-subheading text-sm md:text-xl lg:text-base w-full lg:w-[50ch] mb-8 md:mb-12 lg:mb-8 txt-light opacity-90">
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
            {/* Expanding Circular Ripple Object */}
            <div 
              ref={rippleRef} 
              className="absolute bg-dark rounded-full pointer-events-none z-0"
              style={{ width: '400px', height: '400px', top: '-200px', left: '-200px', transform: 'scale(0)' }}
            />

            {/* Dark Text (Default State) */}
            <span ref={ctaTextDarkRef} className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-[0.6rem] md:text-[0.8rem] lg:text-[0.7rem] tracking-[0.05em] font-semibold txt-dark">
              explore now 
              <div ref={ctaIconDarkRef} className="flex items-center justify-center">
                <Icon className="text-sm md:text-lg lg:text-sm" icon="iconamoon:arrow-right-1" />
              </div>
            </span>

            {/* Light Text (Hover State) */}
            <span ref={ctaTextLightRef} className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-[0.6rem] md:text-[0.8rem] lg:text-[0.7rem] tracking-[0.05em] font-semibold txt-light opacity-0">
              explore now 
              <div ref={ctaIconLightRef} className="flex items-center justify-center">
                <Icon className="text-sm md:text-lg lg:text-sm" icon="iconamoon:arrow-right-1" />
              </div>
            </span>

            {/* Invisible spacer text to maintain button width/height properly */}
            <span className="invisible flex items-center gap-2 text-[0.6rem] md:text-[0.8rem] lg:text-[0.7rem] tracking-[0.05em] font-semibold">
              explore now 
              <div className="flex items-center justify-center">
                <Icon className="text-sm md:text-lg lg:text-sm" icon="iconamoon:arrow-right-1" />
              </div>
            </span>
          </Link>
        </div>
      </div>

      <div className="hero-right flex flex-col lg:items-end justify-end mb-5 lg:mb-3 mt-10 md:mt-16 lg:mt-0">
        <div className="mb-2 md:mb-4 lg:mb-2">
          <h2 ref={exclusiveTextRef} className="uppercase text-[0.6rem] md:text-[0.8rem] lg:text-[0.7rem] tracking-wider txt-light opacity-90">
            Exclusive of this month.
          </h2>
        </div>

        <Link
          to="/"
          ref={productCardRef}
          className="relative z-0 group hero-product w-full md:w-[32rem] lg:w-96 flex gap-3 md:gap-6 lg:flex-col lg:gap-0 p-2 md:p-4 lg:p-5 rounded-md txt-light"
        >
          {/* Layer 1: The Gradient Border (Sitting at the very back) */}
          <div className="absolute inset-0 -z-20 rounded-md pointer-events-none bg-[linear-gradient(90deg,rgba(248,248,248,0.1)_0%,rgba(248,248,248,0.01)_50%,rgba(248,248,248,0.02)_100%)]"></div>
          
          {/* Layer 2: The Glass Fill (Inset by 1px to reveal the gradient border underneath) */}
          <div className="absolute inset-[1px] -z-10 rounded-[calc(0.375rem-1px)] pointer-events-none bg-[rgba(248,248,248,0.1)] group-hover:bg-[rgba(248,248,248,0.15)] transition-colors duration-500"></div>

          {/* Layer 3: Content */}
          <div
            className="w-1/3 md:w-2/7 lg:w-full aspect-square rounded-md overflow-hidden shrink-0"
            id="hero-product-img"
          >
            <img
              className="w-full h-full object-cover"
              src="/hero_product.png"
              alt="hero-product"
            />
          </div>

          <div className="hero-prod-desc w-2/3 md:w-3/5 lg:w-full flex flex-col justify-between mt-0 lg:mt-3">
            <div className="product-category uppercase text-[0.6rem] md:text-[0.8rem] lg:text-[0.7rem] tracking-wider txt-light opacity-60">
              Decorative Base
            </div>

            <div className="hero-prod-heading flex justify-between items-center mt-1 md:mt-3 lg:mt-2">
              <h2 className="product-name text-xl md:text-3xl lg:text-2xl head-font tracking-wide">
                Alpha Product
              </h2>

              <div className="hero-prod-rating h-fit flex gap-1 items-center">
                <span className="inline-flex py-2 w-1 border-y border-l border-[rgba(248,248,248,0.4)] rounded-[1.5px]"></span>
                <div className="flex items-center gap-1 text-[0.6rem] md:text-sm lg:text-xs leading-none">
                  <Icon icon="iconamoon:star-fill" />
                  <span>4.8</span>
                </div>
                <span className="inline-flex py-2 w-1 border-y border-r border-[rgba(248,248,248,0.4)] rounded-[1.5px]"></span>
              </div>
            </div>

            <div className="hero-prod-price px-5 md:px-8 lg:px-10 py-2 md:py-4 lg:py-3 border border-[rgba(248,248,248,0.3)] w-fit mt-3 md:mt-6 lg:mt-5 text-sm md:text-xl lg:text-base">
              ₹ 140.00
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default Hero;
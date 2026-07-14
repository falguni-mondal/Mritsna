import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Icon } from "@iconify/react";

// --- Utility: Masked Text Reveal ---
// Wraps text in an overflow-hidden box so it slides UP from nothing
const MaskedText = ({ children, className = "", delay = 0 }) => {
  return (
    <span className={`block overflow-hidden ${className}`}>
      <span className="masked-line block will-change-transform" data-delay={delay}>
        {children}
      </span>
    </span>
  );
};

// --- Utility: Premium Hover Link ---
const AnimatedLink = ({ children, href, target = "_self" }) => {
  return (
    <a 
      href={href} 
      target={target} 
      rel={target === "_blank" ? "noopener noreferrer" : ""}
      className="group relative flex items-center gap-6 w-max py-2 cursor-pointer"
    >
      <span className="head-font text-4xl md:text-5xl lg:text-7xl text-[#1a1a1a] transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-4">
        {children}
      </span>
      
      {/* Animated Circular Arrow */}
      <div className="relative overflow-hidden w-10 h-10 md:w-14 md:h-14 rounded-full border border-black/20 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:border-black group-hover:bg-black group-hover:text-white opacity-0 -translate-x-8 group-hover:opacity-100 group-hover:translate-x-0">
        <Icon 
          icon="ph:arrow-up-right-light" 
          className="text-xl md:text-2xl absolute transition-transform duration-500 -translate-x-4 translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0" 
        />
        <Icon 
          icon="ph:arrow-up-right-light" 
          className="text-xl md:text-2xl absolute transition-transform duration-500 translate-x-0 translate-y-0 group-hover:translate-x-4 group-hover:-translate-y-4" 
        />
      </div>
    </a>
  );
};

// --- Main Component ---
const Contact = () => {
  const containerRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.1 });

    // 1. Hero Title Blur & Slide Reveal
    tl.fromTo(
      ".hero-title-word",
      { yPercent: 100, filter: "blur(10px)", opacity: 0 },
      { yPercent: 0, filter: "blur(0px)", opacity: 1, duration: 1.2, stagger: 0.1, ease: "expo.out" }
    );

    // 2. Horizontal Dividers Expanding
    tl.fromTo(
      ".contact-divider",
      { scaleX: 0 },
      { scaleX: 1, duration: 1.5, stagger: 0.1, ease: "expo.inOut", transformOrigin: "left center" },
      "-=0.8"
    );

    // 3. Masked Text Sliding Up (Labels & Info)
    const maskedLines = gsap.utils.toArray(".masked-line");
    maskedLines.forEach((line) => {
      const delay = parseFloat(line.getAttribute("data-delay")) || 0;
      gsap.fromTo(
        line,
        { yPercent: 100 },
        { yPercent: 0, duration: 1.2, ease: "expo.out", delay: delay + 0.5 }
      );
    });

    // 4. Fade in the paragraph text
    tl.fromTo(
      ".fade-text",
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: "power2.out" },
      "-=1"
    );

  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pt-32 lg:pt-48 pb-32 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        
        {/* --- Hero Header --- */}
        <div className="w-full mb-24 lg:mb-40">
          <MaskedText className="mb-8">
            <span className="inline-block text-[0.65rem] font-bold tracking-[0.3em] uppercase opacity-50">
              Contact Us
            </span>
          </MaskedText>
          
          <h1 className="head-font text-6xl md:text-[7rem] lg:text-[11rem] leading-[0.85] tracking-tighter flex flex-wrap gap-[2vw]">
            <span className="overflow-hidden block"><span className="hero-title-word block">Let's</span></span>
            <span className="overflow-hidden block"><span className="hero-title-word block italic text-black/70">Create</span></span>
          </h1>
        </div>

        {/* --- Editorial Directory Grid --- */}
        <div className="flex flex-col w-full">
          
          {/* Section: Email */}
          <div className="relative py-12 lg:py-20 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-4">
            <div className="contact-divider absolute top-0 left-0 w-full h-[1px] bg-black/15" />
            
            <div className="md:col-span-3 pt-2">
              <MaskedText delay={0.1}>
                <h3 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/40">
                  Inquiries
                </h3>
              </MaskedText>
            </div>
            
            <div className="md:col-span-9 flex flex-col items-start">
              <MaskedText delay={0.2}>
                <AnimatedLink href="mailto:hello@mritsna.com">
                  hello@mritsna.com
                </AnimatedLink>
              </MaskedText>
              <p className="fade-text text-sm font-medium text-black/50 mt-6 lg:mt-10 max-w-sm leading-relaxed">
                For customer service, press inquiries, or wholesale partnerships, please allow 24-48 hours for a response.
              </p>
            </div>
          </div>

          {/* Section: Studio */}
          <div className="relative py-12 lg:py-20 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-4">
            <div className="contact-divider absolute top-0 left-0 w-full h-[1px] bg-black/15" />
            
            <div className="md:col-span-3 pt-2">
              <MaskedText delay={0.2}>
                <h3 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/40">
                  Studio
                </h3>
              </MaskedText>
            </div>
            
            <div className="md:col-span-9 flex flex-col items-start">
              <MaskedText delay={0.3}>
                <div className="head-font text-4xl md:text-5xl lg:text-7xl leading-[1.1]">
                  IIT ISM, Dhanbad
                </div>
              </MaskedText>
              <MaskedText delay={0.4}>
                <div className="head-font text-4xl md:text-5xl lg:text-7xl leading-[1.1] text-black/60 italic">
                  Jharkhand, India
                </div>
              </MaskedText>
              <MaskedText delay={0.5}>
                <div className="head-font text-4xl md:text-5xl lg:text-7xl leading-[1.1]">
                  826004
                </div>
              </MaskedText>

              <div className="fade-text flex items-center gap-4 mt-8 lg:mt-12">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black/40 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-black"></span>
                </span>
                <p className="text-[0.65rem] font-bold tracking-widest uppercase text-black/50">
                  Visits by appointment only
                </p>
              </div>
            </div>
          </div>

          {/* Section: Socials */}
          <div className="relative py-12 lg:py-20 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-4">
            <div className="contact-divider absolute top-0 left-0 w-full h-[1px] bg-black/15" />
            <div className="contact-divider absolute bottom-0 left-0 w-full h-[1px] bg-black/15" />
            
            <div className="md:col-span-3 pt-2">
              <MaskedText delay={0.3}>
                <h3 className="text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black/40">
                  Socials
                </h3>
              </MaskedText>
            </div>
            
            <div className="md:col-span-9 flex flex-col items-start gap-4">
              <MaskedText delay={0.4}>
                <AnimatedLink href="https://instagram.com" target="_blank">
                  Instagram
                </AnimatedLink>
              </MaskedText>
              
              <MaskedText delay={0.5}>
                <AnimatedLink href="https://pinterest.com" target="_blank">
                  Pinterest
                </AnimatedLink>
              </MaskedText>
              
              <MaskedText delay={0.6}>
                <AnimatedLink href="https://twitter.com" target="_blank">
                  Twitter (X)
                </AnimatedLink>
              </MaskedText>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};

export default Contact;
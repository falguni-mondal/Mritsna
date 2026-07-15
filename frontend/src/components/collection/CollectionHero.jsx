import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const CollectionHero = ({ collectionData }) => {
  const heroSectionRef = useRef(null);
  const heroImgRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline();

    // Text Reveal
    tl.fromTo(".hero-reveal", 
      { opacity: 0, y: 40, filter: "blur(10px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.5, stagger: 0.2, ease: "expo.out" }
    );

    // Image Parallax
    gsap.to(heroImgRef.current, {
      yPercent: 30,
      ease: "none",
      scrollTrigger: {
        trigger: heroSectionRef.current,
        start: "top top",
        end: "80% top",
        scrub: true,
      }
    });
  }, { scope: heroSectionRef });

  return (
    <section ref={heroSectionRef} className="relative w-full h-screen overflow-hidden">
      <div 
        ref={heroImgRef}
        className="absolute inset-[-10%] w-[120%] h-[120%] bg-cover bg-center will-change-transform"
        style={{ backgroundImage: `url(${collectionData.heroImage})` }}
      />
      <div className="absolute inset-0 bg-black/40" /> 
      
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

      <div className="absolute bottom-8 right-6 lg:right-12 flex flex-col items-center gap-4 opacity-50">
        <span className="text-[0.55rem] font-bold tracking-[0.2em] uppercase writing-vertical-rl rotate-180">
          Scroll
        </span>
        <div className="w-[1px] h-12 bg-white/50 overflow-hidden">
          <div className="w-full h-full bg-white animate-scroll-line origin-top" />
        </div>
      </div>
    </section>
  );
};

export default CollectionHero;
import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitType from "split-type";

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const containerRef = useRef(null);

  useGSAP(() => {
    // 1. Initialize SplitType
    const headingSplit = new SplitType(".split-words, .split-words-scroll", { types: "words" });
    const bodySplit = new SplitType(".split-lines", { types: "lines" });

    // 2. Initial Hero Entrance Animation
    const tl = gsap.timeline();
    
    const heroWords = containerRef.current.querySelectorAll(".split-words .word");
    
    tl.fromTo(heroWords, 
      { 
        y: 30, 
        opacity: 0,
        filter: "blur(10px)" // The blur starting state
      }, 
      { 
        y: 0, 
        opacity: 1,  
        filter: "blur(0px)", // Comes into focus
        duration: 1.2, 
        stagger: 0.04, 
        ease: "expo.out", 
        delay: 0.2,
        clearProps: "filter" // Safely removes the CSS filter once done
      }
    )
    .fromTo(".hero-img-container",
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 1.2, ease: "expo.out" },
      "-=0.9"
    );

    // 3. Scroll Reveal for Subheadings (Words)
    const wordElements = gsap.utils.toArray(".split-words-scroll");
    wordElements.forEach((el) => {
      const words = el.querySelectorAll(".word");
      gsap.fromTo(words, 
        { 
          y: 30, 
          opacity: 0,
          filter: "blur(10px)" 
        },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.2,
          stagger: 0.03, 
          ease: "expo.out",
          clearProps: "filter",
          scrollTrigger: {
            trigger: el,
            start: "top 85%", 
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    // 4. Scroll Reveal for Paragraph Lines (Kept sharp without blur for readability)
    const lineElements = gsap.utils.toArray(".split-lines");
    lineElements.forEach((el) => {
      const lines = el.querySelectorAll(".line");
      gsap.fromTo(lines, 
        { 
          y: 30, 
          opacity: 0 
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.08, 
          ease: "expo.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%", 
            toggleActions: "play none none reverse"
          }
        }
      );
    });

    // 5. Parallax Effect for Images
    const parallaxImages = gsap.utils.toArray(".parallax-wrapper");
    parallaxImages.forEach((wrapper) => {
      const img = wrapper.querySelector("img");
      
      gsap.to(img, {
        yPercent: 15, 
        ease: "none",
        scrollTrigger: {
          trigger: wrapper,
          start: "top bottom",
          end: "bottom top",
          scrub: true, 
        }
      });
    });

    // CLEANUP
    return () => {
      headingSplit.revert();
      bodySplit.revert();
    };

  }, { scope: containerRef });

  return (
    <main ref={containerRef} className="w-full min-h-screen bg-[#f8f8f8] text-[#1a1a1a] pb-32 overflow-hidden">
      
      {/* ========================================= */}
      {/* 1. THE HERO */}
      {/* ========================================= */}
      <section className="w-full pt-[140px] lg:pt-[200px] px-6 lg:px-12 max-w-[1600px] mx-auto flex flex-col items-center text-center mb-32">
        <p className="text-[0.65rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-6">
          Our Manifesto
        </p>
        <h1 className="split-words head-font text-5xl lg:text-7xl leading-[1.1] tracking-wide mb-16 max-w-[900px]">
          Born from the earth. Shaped by time.
        </h1>
        
        <div className="hero-img-container w-full aspect-[16/9] lg:aspect-[21/9] overflow-hidden rounded-[2px] relative parallax-wrapper">
          <img 
            src="/about_hero.png" 
            alt="Hands shaping clay on a potter's wheel" 
            className="w-full h-[120%] object-cover absolute top-[-10%] left-0 will-change-transform"
          />
        </div>
      </section>

      {/* ========================================= */}
      {/* 2. THE ROOTS */}
      {/* ========================================= */}
      <section className="w-full px-6 lg:px-12 max-w-[1400px] mx-auto mb-32 lg:mb-48">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div className="order-2 lg:order-1 flex flex-col items-start">
            <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-6 block border-b border-black/20 pb-2">
              01 — The Origin
            </span>
            <h2 className="split-words-scroll head-font text-4xl lg:text-5xl mb-8">
              Fragrant Clay.
            </h2>
            <p className="split-lines text-base font-light opacity-80 leading-relaxed mb-6">
              The name "Mritsna" is derived from ancient Sanskrit, translating directly to "good earth" or "fragrant clay." It represents our foundational belief that true luxury is not synthetic, but deeply rooted in the natural world.
            </p>
            <p className="split-lines text-base font-light opacity-80 leading-relaxed">
              We source our materials with a reverence for the ground they came from, ensuring that every vessel carries the tactile memory of the soil.
            </p>
          </div>
          
          <div className="order-1 lg:order-2 w-full aspect-[4/5] overflow-hidden rounded-[2px] relative parallax-wrapper">
            <img 
              src="/about_root.png" 
              alt="Rich dark soil with Sanskrit imprint" 
              className="w-full h-[120%] object-cover absolute top-[-10%] left-0 will-change-transform"
            />
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* 3. THE PROCESS */}
      {/* ========================================= */}
      <section className="w-full bg-[#1a1a1a] text-white py-32 lg:py-48 px-6 lg:px-12 mb-32 lg:mb-48">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <div className="w-full aspect-[4/5] overflow-hidden rounded-[2px] relative parallax-wrapper">
            <img 
              src="/about_process.png" 
              alt="Glowing brick kiln mid-firing" 
              className="w-full h-[120%] object-cover absolute top-[-10%] left-0 will-change-transform"
            />
          </div>

          <div className="flex flex-col items-start">
            <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-6 block border-b border-white/20 pb-2">
              02 — The Forging
            </span>
            <h2 className="split-words-scroll head-font text-4xl lg:text-5xl mb-8">
              Trial by Fire.
            </h2>
            <p className="split-lines text-base font-light opacity-80 leading-relaxed mb-6">
              Our process is intentionally slow. After being thrown on the wheel and left to dry, each piece faces the crucible of the kiln. Fired at temperatures exceeding 1200°C for over 48 hours, the raw clay undergoes a violent transformation.
            </p>
            <p className="split-lines text-base font-light opacity-80 leading-relaxed">
              It is in this extreme heat that the clay vitrifies, becoming stone-like in its durability. We cannot completely control the fire; we can only guide it. The result is that no two Mritsna vessels will ever share the exact same firing marks.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* 4. THE MATERIALS */}
      {/* ========================================= */}
      <section className="w-full px-6 lg:px-12 max-w-[1400px] mx-auto mb-32 lg:mb-48">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          <div className="lg:col-span-5 flex flex-col items-start lg:pl-12">
            <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-6 block border-b border-black/20 pb-2">
              03 — The Texture
            </span>
            <h2 className="split-words-scroll head-font text-4xl lg:text-5xl mb-8">
              Uncompromising Purity.
            </h2>
            <p className="split-lines text-base font-light opacity-80 leading-relaxed">
              We contrast raw, unglazed stoneware with custom-mixed, matte glazes. By refusing to use artificial smoothing agents, we preserve the microscopic imperfections that give our ceramics their signature tactile weight. It is luxury you can feel in the dark.
            </p>
          </div>

          <div className="lg:col-span-7 w-full aspect-[4/3] overflow-hidden rounded-[2px] relative parallax-wrapper">
            <img 
              src="/about_material.png" 
              alt="Raw and glazed ceramic shards on linen" 
              className="w-full h-[120%] object-cover absolute top-[-10%] left-0 will-change-transform"
            />
          </div>

        </div>
      </section>

      {/* ========================================= */}
      {/* 5. THE STUDIO */}
      {/* ========================================= */}
      <section className="w-full px-6 lg:px-12 max-w-[1600px] mx-auto flex flex-col items-center text-center">
        <span className="text-[0.6rem] font-bold tracking-[0.2em] uppercase opacity-50 mb-8 block">
          04 — The Space
        </span>
        <h2 className="split-words-scroll head-font text-3xl lg:text-5xl tracking-wide mb-16 max-w-[700px] leading-tight">
          A quiet space for a loud world.
        </h2>
        
        <div className="w-full aspect-[16/9] lg:aspect-[2.5/1] overflow-hidden rounded-[2px] relative parallax-wrapper mb-16">
          <img 
            src="/studio.png" 
            alt="Minimalist sunlit ceramics studio" 
            className="w-full h-[130%] object-cover absolute top-[-15%] left-0 will-change-transform"
          />
        </div>

        <p className="text-sm font-light opacity-60 tracking-widest uppercase">
          Mritsna Studios, Est. 2026
        </p>
      </section>

    </main>
  );
};

export default About;
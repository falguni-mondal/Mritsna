import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

// Custom helper to split text into individually animatable words
const SplitText = ({ children, className }) => {
  if (typeof children !== "string") return <span className={className}>{children}</span>;
  
  return (
    <span className={`inline-block ${className}`}>
      {children.split(" ").map((word, index) => (
        // We add a right margin to replace the space character
        <span key={index} className="inline-block mr-[0.25em] whitespace-nowrap">
          <span className="reveal-word inline-block will-change-[transform,filter,opacity]">
            {word}
          </span>
        </span>
      ))}
    </span>
  );
};

const BespokeRegistry = () => {
  const sectionRef = useRef(null);

  useGSAP(() => {
    // Select DOM elements once to use in both desktop and mobile timelines
    const words = gsap.utils.toArray(".reveal-word");
    const inputLine = sectionRef.current.querySelector(".input-line");
    const bespokeImg = sectionRef.current.querySelector(".bespoke-img");
    const bespokeText = gsap.utils.toArray(".bespoke-reveal");

    let mm = gsap.matchMedia();

    // ==========================================
    // DESKTOP ANIMATION
    // ==========================================
    mm.add("(min-width: 1024px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 25%",       // Your corrected desktop start
          end: "center center",   // Finishes when the section reaches the middle
          scrub: 1, 
        }
      });

      tl.fromTo(words, 
        { y: 40, opacity: 0, filter: "blur(12px)", scale: 0.95 }, 
        { y: 0, opacity: 1, filter: "blur(0px)", scale: 1, stagger: 0.1, ease: "power2.out" }, 
        0
      )
      .fromTo(inputLine,
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, ease: "power2.out" },
        0.2
      )
      .fromTo(bespokeImg,
        { scale: 1.1, filter: "blur(10px)", opacity: 0 },
        { scale: 1, filter: "blur(0px)", opacity: 1, ease: "power2.out" },
        0.1
      )
      .fromTo(bespokeText,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, ease: "power2.out" },
        0.3
      );
    });

    // ==========================================
    // MOBILE ANIMATION
    // ==========================================
    mm.add("(max-width: 1023px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 90%",       // Starts slightly earlier on smaller screens
          end: "bottom 90%",      // Stretches the end point way down so the bottom elements don't animate off-screen
          scrub: 1,
        }
      });

      tl.fromTo(words, 
        { y: 40, opacity: 0, filter: "blur(12px)", scale: 0.95 }, 
        { y: 0, opacity: 1, filter: "blur(0px)", scale: 1, stagger: 0.1, ease: "power2.out" }, 
        0
      )
      .fromTo(inputLine,
        { scaleX: 0, transformOrigin: "left center" },
        { scaleX: 1, ease: "power2.out" },
        0.2
      )
      // On mobile, we push the image and bottom text slightly further down the timeline 
      // so they animate when the user actually scrolls to them
      .fromTo(bespokeImg,
        { scale: 1.1, filter: "blur(10px)", opacity: 0 },
        { scale: 1, filter: "blur(0px)", opacity: 1, ease: "power2.out" },
        0.4
      )
      .fromTo(bespokeText,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, ease: "power2.out" },
        0.6
      );
    });

    return () => mm.revert();
  }, { scope: sectionRef });

  return (
    <section 
      ref={sectionRef}
      className="w-full bg-[#f4f3f0] text-[#1a1a1a] py-32 lg:py-48 relative z-20 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto w-full px-6 lg:px-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 lg:gap-10">
          
          {/* ========================================== */}
          {/* LEFT SIDE: The Registry (Newsletter)       */}
          {/* ========================================== */}
          <div className="lg:col-span-7 flex flex-col justify-center lg:pr-20">
            <span className="bespoke-reveal block text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-8">
              The Registry
            </span>
            
            <h2 className="head-font text-6xl md:text-8xl lg:text-[7rem] tracking-tighter lowercase leading-[0.9] mb-12">
              <SplitText>join the inner circle.</SplitText>
            </h2>
            
            <p className="bespoke-reveal text-sm md:text-base font-light opacity-80 max-w-md leading-relaxed mb-16">
              Our collections are produced in limited runs. Enter your email to receive early access to new releases, private commissions, and studio insights.
            </p>

            {/* Ultra-Minimal Input Form */}
            <form className="relative w-full max-w-md group" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Email Address" 
                className="w-full bg-transparent border-none outline-none pb-4 text-sm font-light placeholder:text-[#1a1a1a]/40 text-[#1a1a1a]"
                required
              />
              <div className="input-line absolute bottom-0 left-0 w-full h-[1px] bg-[#1a1a1a]/20" />
              <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#1a1a1a] scale-x-0 origin-left transition-transform duration-500 group-hover:scale-x-100" />
              
              <button 
                type="submit"
                className="absolute right-0 bottom-4 text-lg hover:translate-x-1 transition-transform duration-300"
                aria-label="Submit email"
              >
                →
              </button>
            </form>
          </div>

          {/* ========================================== */}
          {/* RIGHT SIDE: The Bespoke Studio             */}
          {/* ========================================== */}
          <div className="lg:col-span-5 flex flex-col mt-10 lg:mt-0">
            <div className="w-full aspect-[4/5] overflow-hidden mb-8 relative group cursor-pointer">
              <img 
                src="/bespoke.png" 
                alt="Ceramist working on raw clay"
                className="bespoke-img w-full h-full object-cover transition-transform duration-[2s] ease-out group-hover:scale-105"
              />
              
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                 <span className="bg-[#f8f8f8] text-[#1a1a1a] px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase rounded-full">
                   View Portfolio
                 </span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="bespoke-reveal block text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-3">
                  The Atelier
                </span>
                <h3 className="bespoke-reveal head-font text-4xl tracking-tighter lowercase">
                  bespoke commissions
                </h3>
              </div>
              
              <Link 
                to="/bespoke"
                className="bespoke-reveal relative inline-flex items-center text-xs font-bold tracking-[0.2em] uppercase pb-1 group/link w-max"
              >
                <span>Inquire</span>
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#1a1a1a]/30 transition-all duration-500 group-hover/link:bg-[#1a1a1a]" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default BespokeRegistry;
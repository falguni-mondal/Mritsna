import React, { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom"; // <-- Import useLocation
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const CustomCursor = () => {
  const cursorRef = useRef(null);
  const textRef = useRef(null);
  const classTimer = useRef(null);
  const location = useLocation(); // <-- Get current route

  // THE FIX: Force reset the cursor on every page load
  useEffect(() => {
    if (cursorRef.current && textRef.current) {
      clearTimeout(classTimer.current);
      
      // ONLY kill sizing animations, leave x/y tracking completely alone
      gsap.killTweensOf(cursorRef.current, "width,height"); 
      gsap.killTweensOf(textRef.current);

      // Instantly strip the glass styling and restore the blend mode
      cursorRef.current.classList.remove("bg-white/40", "backdrop-blur-md", "border", "border-white/50", "shadow-xl");
      cursorRef.current.classList.add("bg-white", "mix-blend-difference");

      gsap.set(cursorRef.current, { width: 16, height: 16 });
      gsap.set(textRef.current, { autoAlpha: 0 });
    }
  }, [location.pathname]);

  useGSAP(() => {
    let mm = gsap.matchMedia();

    mm.add("(min-width: 1024px)", () => {
      gsap.set(cursorRef.current, { xPercent: -50, yPercent: -50 });
      gsap.set(textRef.current, { autoAlpha: 0 });

      let xTo = gsap.quickTo(cursorRef.current, "x", { duration: 0.3, ease: "power3.out" });
      let yTo = gsap.quickTo(cursorRef.current, "y", { duration: 0.3, ease: "power3.out" });

      const handleMouseMove = (e) => {
        xTo(e.clientX);
        yTo(e.clientY);
      };

      const handleMouseOver = (e) => {
        const exploreTarget = e.target.closest('[data-cursor="explore"]');
        
        if (exploreTarget) {
          gsap.killTweensOf(cursorRef.current, "width,height");
          
          clearTimeout(classTimer.current);
          
          cursorRef.current.classList.remove("bg-white", "mix-blend-difference");
          cursorRef.current.classList.add("bg-white/40", "backdrop-blur-md", "border", "border-white/50", "shadow-xl");
          
          gsap.to(cursorRef.current, { 
            width: 112, 
            height: 112, 
            duration: 0.4, 
            ease: "back.out(1.5)"
          });
          
          gsap.killTweensOf(textRef.current);
          gsap.to(textRef.current, { 
            autoAlpha: 1, 
            duration: 0.3, 
            delay: 0.1 
          });
        }
      };

      const handleMouseOut = (e) => {
        const leftTarget = e.target.closest('[data-cursor="explore"]');
        
        if (leftTarget && (!e.relatedTarget || !leftTarget.contains(e.relatedTarget))) {
          
          gsap.killTweensOf(cursorRef.current, "width,height");

          clearTimeout(classTimer.current);
          classTimer.current = setTimeout(() => {
            if (cursorRef.current) {
              cursorRef.current.classList.remove("bg-white/40", "backdrop-blur-md", "border", "border-white/50", "shadow-xl");
              cursorRef.current.classList.add("bg-white", "mix-blend-difference");
            }
          }, 200);
          
          gsap.to(cursorRef.current, { 
            width: 16, 
            height: 16, 
            duration: 0.3, 
            ease: "power2.inOut",
            delay: 0.05
          });

          gsap.killTweensOf(textRef.current); 
          
          gsap.to(textRef.current, { 
            autoAlpha: 0, 
            duration: 0.1 
          });
        }
      };

      window.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseover", handleMouseOver);
      document.addEventListener("mouseout", handleMouseOut);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseover", handleMouseOver);
        document.removeEventListener("mouseout", handleMouseOut);
        clearTimeout(classTimer.current);
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <div
      ref={cursorRef}
      className="hidden lg:flex fixed top-0 left-0 w-4 h-4 rounded-full bg-white mix-blend-difference items-center justify-center text-[#1a1a1a] pointer-events-none z-[9999]"
    >
      <span 
        ref={textRef} 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[0.65rem] font-bold tracking-[0.2em] uppercase whitespace-nowrap invisible"
      >
        Explore
      </span>
    </div>
  );
};

export default CustomCursor;
import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLocation } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const SmoothScroll = ({ children }) => {
  const lenisRef = useRef(null);
  const location = useLocation();

  // --- 1. Core Lenis Initialization ---
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    // DEFENSIVE PROGRAMMING: Check if lenis.raf exists before calling it
    const update = (time) => {
      if (lenis && typeof lenis.raf === "function") {
        lenis.raf(time * 1000);
      }
    };

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
      lenisRef.current = null; // Clear the ref on unmount
    };
  }, []);

  // --- 2. The SPA Router Fix ---
  useEffect(() => {
    if (!lenisRef.current) return;

    // Instantly snap scroll back to the top on page transition
    lenisRef.current.scrollTo(0, { immediate: true });

    // Force ScrollTrigger to recalculate all triggers
    const timeoutId = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  return <>{children}</>;
};

export default SmoothScroll;
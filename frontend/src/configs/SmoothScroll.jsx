import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLocation } from "react-router-dom"; // Hook to track route changes

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
      smoothTouch: false, // Keep native swipe on mobile
      touchMultiplier: 2,
    });

    lenisRef.current = lenis; // Store instance in ref so our route watcher can access it

    // Sync Lenis scroll with GSAP's ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Sync Lenis's requestAnimationFrame with GSAP's Ticker for zero-jitter
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    // Turn off GSAP's lag smoothing to prevent animation conflicts
    gsap.ticker.lagSmoothing(0);

    // Clean up on unmount to prevent memory leaks
    return () => {
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000);
      });
      lenis.destroy();
    };
  }, []); // Empty dependency array: Only runs once when the app mounts

  // --- 2. The SPA Router Fix ---
  useEffect(() => {
    if (!lenisRef.current) return;

    // Step 1: Instantly snap scroll back to the top on page transition
    lenisRef.current.scrollTo(0, { immediate: true });

    // Step 2: Force ScrollTrigger to recalculate all triggers
    // We use a tiny setTimeout to guarantee React has finished injecting the new DOM nodes
    const timeoutId = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname]); // Re-runs every time the URL changes

  return <>{children}</>;
};

export default SmoothScroll;
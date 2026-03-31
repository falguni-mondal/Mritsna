import React, { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const SmoothScroll = ({ children }) => {
  useEffect(() => {
    // 1. Initialize modern Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: "vertical",
      gestureDirection: "vertical",
      smooth: true,
      smoothTouch: false, // Keep native swipe on mobile
      touchMultiplier: 2,
    });

    // 2. Sync Lenis scroll with GSAP's ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // 3. Sync Lenis's requestAnimationFrame with GSAP's Ticker for zero-jitter
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    // 4. Turn off GSAP's lag smoothing to prevent animation conflicts
    gsap.ticker.lagSmoothing(0);

    // 5. Clean up on unmount to prevent memory leaks
    return () => {
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000);
      });
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScroll;
import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

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

const categories = [
  {
    id: "01",
    title: "Vessels",
    subtitle: "Tall forms & centerpieces",
    image: "/cat_1.png",
    link: "/collection/vessels",
  },
  {
    id: "02",
    title: "Tableware",
    subtitle: "Plates, bowls & dining",
    image: "/cat_2.png",
    link: "/collection/tableware",
  },
  {
    id: "03",
    title: "Sculpture",
    subtitle: "Abstract & decorative forms",
    image: "/cat_3.png",
    link: "/collection/sculpture",
  },
  {
    id: "04",
    title: "Lighting",
    subtitle: "Pendants & ambient fixtures",
    image: "/cat_4.png",
    link: "/collection/lighting",
  },
];

const CategoryIndex = () => {
  const desktopPinRef = useRef(null);
  const mobilePinRef = useRef(null);
  const deskHeadingRef = useRef(null);
  const mobHeadingRef = useRef(null);

  useGSAP(() => {
    let mm = gsap.matchMedia();

    // ==========================================
    // DESKTOP LAYOUT
    // ==========================================
    mm.add("(min-width: 1024px)", () => {
      const deskWords = gsap.utils.toArray(".reveal-word", deskHeadingRef.current);
      gsap.fromTo(deskWords,
        { opacity: 0, y: 40, filter: "blur(12px)", scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          filter: "blur(0px)", 
          scale: 1, 
          duration: 1, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: deskHeadingRef.current,
            start: "top 75%", 
            toggleActions: "play none none reverse"
          }
        }
      );

      const titles = gsap.utils.toArray(".desk-title");
      const subs = gsap.utils.toArray(".desk-sub");
      const links = gsap.utils.toArray(".desk-link");
      const imgPanels = gsap.utils.toArray(".desk-img-panel");

      gsap.set(imgPanels, { zIndex: (i) => i });
      gsap.set(imgPanels.slice(1), { yPercent: 100 });
      gsap.set(titles.slice(1), { yPercent: 100 });
      gsap.set(subs.slice(1), { yPercent: 100 });
      gsap.set(links.slice(1), { yPercent: 100 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: desktopPinRef.current,
          start: "top top",
          end: "+=250%", // Generous scroll distance to accommodate the dead zones
          pin: true,
          scrub: 0.5, 
          snap: {
            snapTo: "labels", // Snaps to the exact resting points we define
            directional: false, // Enforces the 50% threshold rule
            delay: 0.1, 
            duration: { min: 0.3, max: 0.6 },
            ease: "power2.inOut"
          }
        }
      });

      // Label and Dwell time for the very first slide
      tl.addLabel("slide0");
      tl.to({}, { duration: 0.5 }); 

      categories.forEach((_, i) => {
        if (i === categories.length - 1) return;

        const currentText = [subs[i], titles[i], links[i]];
        const nextText = [subs[i + 1], titles[i + 1], links[i + 1]];
        const nextImgPanel = imgPanels[i + 1];

        // The actual transition
        tl.to(currentText, { yPercent: -100, ease: "none", duration: 1 }, `trans${i}`)
          .to(nextText, { yPercent: 0, ease: "none", duration: 1 }, `trans${i}`)
          .to(nextImgPanel, { yPercent: 0, ease: "none", duration: 1 }, `trans${i}`);

        // Label and Dwell time for the newly arrived slide
        tl.addLabel(`slide${i + 1}`);
        tl.to({}, { duration: 0.5 });
      });
    });

    // ==========================================
    // MOBILE LAYOUT
    // ==========================================
    mm.add("(max-width: 1023px)", () => {
      const mobWords = gsap.utils.toArray(".reveal-word", mobHeadingRef.current);
      gsap.fromTo(mobWords,
        { opacity: 0, y: 40, filter: "blur(12px)", scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          filter: "blur(0px)", 
          scale: 1, 
          duration: 1, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: mobHeadingRef.current,
            start: "top 60%", 
            toggleActions: "play none none reverse"
          }
        }
      );

      const titles = gsap.utils.toArray(".mob-title");
      const subs = gsap.utils.toArray(".mob-sub");
      const links = gsap.utils.toArray(".mob-link");
      const imgPanels = gsap.utils.toArray(".mob-img-panel");
      
      gsap.set(imgPanels, { zIndex: (i) => i });
      gsap.set(imgPanels.slice(1), { yPercent: 100 });
      gsap.set(titles.slice(1), { yPercent: 100 });
      gsap.set(subs.slice(1), { yPercent: 100 });
      gsap.set(links.slice(1), { yPercent: 100 });
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: mobilePinRef.current,
          start: "top top",
          end: "+=400%", 
          pin: true,
          scrub: 0.5,
          snap: {
            snapTo: "labels", 
            directional: false, 
            delay: 0.1, 
            duration: { min: 0.3, max: 0.6 },
            ease: "power2.inOut"
          }
        }
      });

      // Label and Dwell time for the very first slide
      tl.addLabel("slide0");
      tl.to({}, { duration: 0.5 }); 

      categories.forEach((_, i) => {
        if (i === categories.length - 1) return;

        const currentText = [subs[i], titles[i], links[i]];
        const nextText = [subs[i + 1], titles[i + 1], links[i + 1]];
        const nextImgPanel = imgPanels[i + 1];

        // The actual transition
        tl.to(currentText, { yPercent: -100, ease: "none", duration: 1 }, `trans${i}`)
          .to(nextText, { yPercent: 0, ease: "none", duration: 1 }, `trans${i}`)
          .to(nextImgPanel, { yPercent: 0, ease: "none", duration: 1 }, `trans${i}`);

        // Label and Dwell time for the newly arrived slide
        tl.addLabel(`slide${i + 1}`);
        tl.to({}, { duration: 0.5 });
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <div className="bg-dark mt-20">
      
      {/* DESKTOP LAYOUT */}
      <div className="hidden lg:block w-full txt-light pt-20">
        <h2 ref={deskHeadingRef} className="head-font text-6xl md:text-8xl lg:text-[7rem] tracking-tighter lowercase leading-[0.9] px-6 lg:px-10 mix-blend-difference relative mb-10">
          <SplitText>categories</SplitText>
        </h2>
        <section className="pb-16 px-12 max-w-[1400px] mx-auto w-full relative z-10">
          <span className="block text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-4">
            Shop by Form
          </span>
          <p className="text-base font-light opacity-80 max-w-sm leading-relaxed">
            Explore the Mritsna archives. Each piece is categorized by its functional intent and architectural shape.
          </p>
        </section>

        <section ref={desktopPinRef} className="w-full h-dvh flex relative bg-dark">
          <div className="w-[55%] h-full relative flex flex-col justify-center pl-12 pr-20">
            {categories.map((category) => (
              <div key={`desk-txt-${category.id}`} className="absolute inset-0 w-full h-full flex flex-col justify-center pl-12 pr-20 pointer-events-none">
                <div className="overflow-hidden mb-6">
                  <span className="desk-sub block text-xs font-light tracking-[0.3em] uppercase opacity-50 pb-2">
                    0{category.id.replace('0', '')} — {category.subtitle}
                  </span>
                </div>
                <div className="overflow-hidden mb-10">
                  <h3 className="desk-title head-font text-8xl xl:text-[8rem] tracking-tighter lowercase leading-[0.9] pt-2 pb-6">
                    {category.title}
                  </h3>
                </div>
                <div className="overflow-hidden">
                  <Link 
                    to={category.link}
                    className="desk-link group relative inline-flex items-center text-sm tracking-[0.2em] uppercase pt-2 pb-2 w-max pointer-events-auto"
                  >
                    <span>Explore {category.title}</span>
                    <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#f8f8f8] transition-all duration-500 origin-left group-hover:scale-x-0" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="w-[45%] h-full relative">
            {categories.map((category) => (
              <div key={`desk-img-${category.id}`} className="desk-img-panel absolute inset-0 w-full h-full overflow-hidden">
                <img 
                  src={category.image} 
                  alt={category.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* MOBILE LAYOUT */}
      <div className="block lg:hidden w-full txt-light pt-14">
        <h2 ref={mobHeadingRef} className="head-font text-6xl md:text-8xl lg:text-[7rem] tracking-tighter lowercase leading-[0.9] px-6 lg:px-10 mix-blend-difference relative mb-10">
          <SplitText>categories</SplitText>
        </h2>
        
        <section className="pb-8 px-6 w-full relative z-10">
          <span className="block text-[0.6rem] font-bold tracking-[0.3em] uppercase opacity-50 mb-4">
            Shop by Form
          </span>
          <p className="text-sm font-light opacity-80 leading-relaxed">
            Explore the Mritsna archives. Each piece is categorized by its functional intent and architectural shape.
          </p>
        </section>

        <section ref={mobilePinRef} className="w-full h-dvh relative bg-dark">
          <div className="absolute inset-0 w-full h-full z-10">
            {categories.map((category) => (
              <div key={`mob-img-wrap-${category.id}`} className="mob-img-panel absolute inset-0 w-full h-full overflow-hidden">
                 <div className="absolute inset-0 bg-black/40 z-20 pointer-events-none" />
                 <img 
                   src={category.image} 
                   alt={category.title}
                   className="w-full h-full object-cover origin-top"
                 />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 w-full h-full z-30 pointer-events-none">
            {categories.map((category) => (
              <div key={`mob-txt-${category.id}`} className="absolute inset-0 w-full h-full flex flex-col items-center justify-center txt-light mix-blend-difference px-6 text-center">
                <div className="overflow-hidden mb-4">
                  <span className="mob-sub block text-[0.6rem] font-light tracking-[0.3em] uppercase opacity-80 pb-2">
                    0{category.id.replace('0', '')} — {category.subtitle}
                  </span>
                </div>
                <div className="overflow-hidden mb-8">
                  <h3 className="mob-title head-font text-6xl tracking-tighter lowercase leading-none pt-2 pb-4">
                    {category.title}
                  </h3>
                </div>
                <div className="overflow-hidden">
                  <Link 
                    to={category.link}
                    className="mob-link relative inline-flex items-center text-xs tracking-[0.2em] uppercase pt-2 pb-2 pointer-events-auto"
                  >
                    <span>Explore {category.title}</span>
                    <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#f8f8f8] transition-all duration-500" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
};

export default CategoryIndex;
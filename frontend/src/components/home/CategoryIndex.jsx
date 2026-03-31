import React, { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

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

  useGSAP(() => {
    let mm = gsap.matchMedia();

    // ==========================================
    // DESKTOP: Text Mask Reveal + Image Card Stack
    // ==========================================
    mm.add("(min-width: 1024px)", () => {
      const titles = gsap.utils.toArray(".desk-title");
      const subs = gsap.utils.toArray(".desk-sub");
      const links = gsap.utils.toArray(".desk-link");
      
      // Target the wrappers instead of the image tags for the stacking effect
      const imgPanels = gsap.utils.toArray(".desk-img-panel");

      // Set Z-Indexes so the next image slides OVER the previous one
      gsap.set(imgPanels, { zIndex: (i) => i });
      
      // Push all items (except the first) down
      gsap.set(imgPanels.slice(1), { yPercent: 100 });
      gsap.set(titles.slice(1), { yPercent: 100 });
      gsap.set(subs.slice(1), { yPercent: 100 });
      gsap.set(links.slice(1), { yPercent: 100 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: desktopPinRef.current,
          start: "top top",
          end: `+=${categories.length * 100}%`,
          pin: true,
          scrub: 1, 
        }
      });

      categories.forEach((_, i) => {
        if (i === categories.length - 1) return;

        const currentText = [subs[i], titles[i], links[i]];
        const nextText = [subs[i + 1], titles[i + 1], links[i + 1]];
        
        // We only need to animate the NEXT image. The current stays still.
        const nextImgPanel = imgPanels[i + 1];

        // 1. Text does the Mask Reveal
        tl.to(currentText, { 
            yPercent: -100, 
            ease: "power3.inOut", 
            duration: 1, 
        }, `slide${i}`)
        .to(nextText, { 
            yPercent: 0, 
            ease: "power3.inOut", 
            duration: 1, 
        }, `slide${i}`)
        
        // 2. The Next Image slides up OVER the current image (Current stays at 0)
        .to(nextImgPanel, { 
            yPercent: 0, 
            ease: "power3.inOut", 
            duration: 1 
        }, `slide${i}`);
      });
    });

    // ==========================================
    // MOBILE: Text Mask Reveal + Image Card Stack
    // ==========================================
    mm.add("(max-width: 1023px)", () => {
      const titles = gsap.utils.toArray(".mob-title");
      const subs = gsap.utils.toArray(".mob-sub");
      const links = gsap.utils.toArray(".mob-link");
      
      // Target the wrappers so the gradient and image slide together
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
          end: `+=${categories.length * 100}%`,
          pin: true,
          scrub: 1,
        }
      });

      categories.forEach((_, i) => {
        if (i === categories.length - 1) return;

        const currentText = [subs[i], titles[i], links[i]];
        const nextText = [subs[i + 1], titles[i + 1], links[i + 1]];
        const nextImgPanel = imgPanels[i + 1];

        tl.to(currentText, { 
            yPercent: -100, 
            ease: "power3.inOut", 
            duration: 1, 
        }, `slide${i}`)
        .to(nextText, { 
            yPercent: 0, 
            ease: "power3.inOut", 
            duration: 1, 
        }, `slide${i}`)
        .to(nextImgPanel, { 
            yPercent: 0, 
            ease: "power3.inOut", 
            duration: 1 
        }, `slide${i}`);
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <div className="bg-dark">
      
      {/* ========================================== */}
      {/* DESKTOP LAYOUT                             */}
      {/* ========================================== */}
      <div className="hidden lg:block w-full txt-light">
        
        <section className="pt-32 pb-16 px-12 max-w-[1400px] mx-auto w-full relative z-10">
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
              // The Wrapper (.desk-img-panel) is now what animates, physically layering over the previous one
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


      {/* ========================================== */}
      {/* MOBILE LAYOUT                              */}
      {/* ========================================== */}
      <div className="block lg:hidden w-full txt-light">
        
        <section className="pt-24 pb-8 px-6 w-full relative z-10">
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
              // The Wrapper (.mob-img-panel) animates, carrying both the dark overlay and image over the old one
              <div key={`mob-img-wrap-${category.id}`} className="mob-img-panel absolute inset-0 w-full h-full overflow-hidden">
                 
                 {/* Transparent black overlay added here */}
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
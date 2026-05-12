import React, { useState, useRef, useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Icon } from "@iconify/react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navmenu from "./Navmenu";
import { IntroContext } from "../../context/IntroContext"; 
import { useSelector } from "react-redux";

// Register the plugin
gsap.registerPlugin(ScrollTrigger);

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Replace local state with live Redux derived state
  const cartItems = useSelector((state) => state.cart?.items || []);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  const [isScrolled, setIsScrolled] = useState(false);
  // Global Context & Routing
  const location = useLocation();
  const { introPlayed } = useContext(IntroContext);
  
  // Track the path to force a synchronous state reset
  const [currentPath, setCurrentPath] = useState(location.pathname);

  // Refs for Animations & Structure
  const navbarRef = useRef(null);
  const navContainerRef = useRef(null);
  const underlineRef = useRef(null);
  const isHovering = useRef(false);
  const rightNavContainerRef = useRef(null);
  const rightUnderlineRef = useRef(null);
  const isRightHovering = useRef(false);

  const navigations = [
    { name: "shop", path: "/shop" },
    { name: "collection", path: "/collection" },
    { name: "about", path: "/about" },
    { name: "contact us", path: "/contact" },
  ];

  const serviceNavs = [
    { name: "account", path: "/account" },
    { name: "cart", path: "/cart" },
    { name: "wishlist", path: "/wishlist" },
  ];

  // ==========================================
  // CONFIGURATION
  // ==========================================
  const scrollBlendRoutes = ["/"]; 
  const isScrollBlendRoute = scrollBlendRoutes.includes(location.pathname);

  if (location.pathname !== currentPath) {
    setCurrentPath(location.pathname);
    setIsScrolled(false);
  }

  const isDarkTheme = !isScrollBlendRoute || isScrolled;

  const { contextSafe } = useGSAP(() => {
    const entryDelay = (!introPlayed && location.pathname === "/") ? 2.4 : 0.2;

    gsap.set(navbarRef.current, { yPercent: -30, opacity: 0 });
    gsap.to(navbarRef.current, {
      yPercent: 0,
      opacity: 1,
      duration: 1,
      ease: "power3.out",
      delay: entryDelay, 
    });

    const existingTrigger = ScrollTrigger.getById("nav-blend");
    if (existingTrigger) {
      existingTrigger.kill();
    }

    if (isScrollBlendRoute) {
      ScrollTrigger.create({
        id: "nav-blend", 
        start: () => window.innerHeight * 0.9, 
        onEnter: () => setIsScrolled(true),      
        onLeaveBack: () => setIsScrolled(false), 
        invalidateOnRefresh: true, 
      });
    } 
    
  }, { scope: navbarRef, dependencies: [location.pathname] }); 

  const handleItemEnter = contextSafe((e) => {
    const item = e.currentTarget;
    const targetLeft = item.offsetLeft;
    const targetWidth = item.offsetWidth;

    if (!isHovering.current) {
      gsap.set(underlineRef.current, { left: 0, width: 0 });
      isHovering.current = true;
    }

    gsap.to(underlineRef.current, {
      left: targetLeft,
      width: targetWidth,
      opacity: 1,
      duration: 0.4,
      ease: "power3.out",
      overwrite: true, 
    });
  });

  const handleNavLeave = contextSafe(() => {
    isHovering.current = false;
    const containerWidth = navContainerRef.current.offsetWidth;

    gsap.to(underlineRef.current, {
      left: containerWidth,
      width: 0,
      opacity: 0,
      duration: 0.4,
      ease: "power3.out",
      overwrite: true,
    });
  });

  const handleRightItemEnter = contextSafe((e) => {
    const item = e.currentTarget;
    const containerWidth = rightNavContainerRef.current.offsetWidth;
    const targetLeft = item.offsetLeft;
    const targetWidth = item.offsetWidth;
    
    const targetRight = containerWidth - (targetLeft + targetWidth);

    if (!isRightHovering.current) {
      gsap.set(rightUnderlineRef.current, { right: 0, left: "auto", width: 0 });
      isRightHovering.current = true;
    }

    gsap.to(rightUnderlineRef.current, {
      right: targetRight,
      width: targetWidth,
      opacity: 1,
      duration: 0.4,
      ease: "power3.out",
      overwrite: true, 
    });
  });

  const handleRightNavLeave = contextSafe(() => {
    isRightHovering.current = false;
    const containerWidth = rightNavContainerRef.current.offsetWidth;

    gsap.to(rightUnderlineRef.current, {
      right: containerWidth,
      width: 0,
      opacity: 0,
      duration: 0.4,
      ease: "power3.out",
      overwrite: true,
    });
  });

  return (
    <>
      <div 
        key={location.pathname} 
        ref={navbarRef} 
        className={`navbar w-full fixed top-0 left-0 z-[99999] transition-colors duration-500 border-b max-h-[80px]
          ${isDarkTheme ? "bg-[#f8f8f8]/80 backdrop-blur-md border-black/5" : "bg-transparent border-transparent"}
        `}
      >
        <div
          className={`w-full py-4 px-6 lg:px-10 flex justify-between items-center transition-colors duration-500
            ${isDarkTheme ? "text-[#1a1a1a]" : "text-white"}
          `}
          id="navbar-content"
        >
          <nav className="w-1/3 hidden lg:block" id="desktop-first-nav">
            <ul 
              ref={navContainerRef}
              onMouseLeave={handleNavLeave}
              className="nav-list flex items-center gap-10 uppercase text-[0.7rem] tracking-wider relative"
            >
              <li
                ref={underlineRef}
                className={`absolute -bottom-1 h-px opacity-0 pointer-events-none transition-colors duration-500
                  ${isDarkTheme ? "bg-[#1a1a1a]" : "bg-white"}
                `}
                style={{ left: 0, width: 0 }}
              />

              {navigations.map(({ name, path }) => (
                <li 
                  key={`${name}-desk-nav`} 
                  className="nav-list-item"
                  onMouseEnter={handleItemEnter}
                >
                  <Link 
                    to={path}
                    className="py-1 inline-block"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="logo lg:w-1/3 flex justify-start lg:justify-center items-center">
            <Link to="/">
              <img 
                className="w-22 lg:w-36 transition-opacity duration-500" 
                src={isDarkTheme ? "/logo_black.svg" : "/logo_white.svg"} 
                alt="Mritsna Logo" 
              />
            </Link>
          </div>

          <nav className="w-1/3 hidden lg:block" id="desktop-second-nav">
            <ul 
              ref={rightNavContainerRef}
              onMouseLeave={handleRightNavLeave}
              className="nav-list flex justify-end items-center gap-10 uppercase text-[0.7rem] tracking-wider relative"
            >
              <li
                ref={rightUnderlineRef}
                className={`absolute -bottom-1 h-px opacity-0 pointer-events-none transition-colors duration-500
                  ${isDarkTheme ? "bg-[#1a1a1a]" : "bg-white"}
                `}
                style={{ right: 0, width: 0 }}
              />

              <li 
                className="nav-list-item"
                onMouseEnter={handleRightItemEnter}
              >
                <span className="cursor-pointer py-1 inline-block">
                  search
                </span>
              </li>
              
              {serviceNavs.map(({ name, path }) => (
                <li 
                  key={`${name}-desk-nav`} 
                  className="nav-list-item"
                  onMouseEnter={handleRightItemEnter}
                >
                  <Link 
                    className="py-1 inline-block" 
                    to={path}
                  >
                    {name}
                    {name === "cart" && (
                      <span className="ml-1 tracking-widest font-medium opacity-80">
                        [{cartCount > 0 ? cartCount : "0"}]
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-5 lg:hidden">
            <div className="cursor-pointer text-xl flex items-center justify-center hover:opacity-70 transition-opacity duration-300">
              <Icon icon="iconamoon:search" />
            </div>

            <div
              onClick={() => setIsOpen((prev) => !prev)}
              className="nav-icon w-6 h-2 flex flex-col justify-between cursor-pointer"
            >
              <span
                className={`block h-[1.5px] transition-all duration-300 ease-[cubic-bezier(0.77,0,0.175,1)] 
                  ${isDarkTheme ? "bg-[#1a1a1a]" : "bg-white"} 
                  ${isOpen ? "rotate-45 translate-y-[3px]" : ""}
                `}
              />
              <span
                className={`block h-[1.5px] transition-all duration-300 ease-[cubic-bezier(0.77,0,0.175,1)] 
                  ${isDarkTheme ? "bg-[#1a1a1a]" : "bg-white"} 
                  ${isOpen ? "-rotate-45 -translate-y-[3px]" : ""}
                `}
              />
            </div>
          </div>
        </div>
      </div>
      
      <Navmenu isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  );
};

export default Navbar;